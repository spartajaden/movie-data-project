# CineStats ETL 설계서

## 1. 개요

본 문서는 CineStats 프로젝트의 **ETL(Extract-Transform-Load)** 파이프라인을 정의합니다. 외부 데이터 소스(TMDB API, KOBIS API)에서 영화 데이터를 추출하고, 내부 스키마에 맞게 변환한 뒤, MySQL 데이터베이스에 적재하는 전체 프로세스를 다룹니다.

### 1.1 데이터 소스 요약

| 소스      | 제공 기관              | 데이터 성격                                           | 갱신 주기 |
| --------- | ---------------------- | ----------------------------------------------------- | --------- |
| TMDB API  | The Movie Database     | 글로벌 영화 메타데이터 (평점, 인기도, 포스터, 줄거리) | 실시간    |
| KOBIS API | 영화진흥위원회 (KOFIC) | 한국 박스오피스 (일별/주간 매출, 관객, 스크린)        | 일별/주간 |

### 1.2 대상 테이블 요약

| 테이블                    | 소스                      | 적재 방식           |
| ------------------------- | ------------------------- | ------------------- |
| `movies` + `movie_genres` | TMDB API                  | 배치 수집 (5페이지) |
| `daily_box_office`        | KOBIS 일별 박스오피스 API | 스케줄러 + 백필     |
| `weekly_box_office`       | KOBIS 주간 박스오피스 API | 백필 + 온디맨드     |
| `kobis_movie`             | KOBIS 영화목록 + 상세 API | 백필 (시작 시 1회)  |
| `kobis_code`              | KOBIS 공통코드 API        | 백필 (시작 시 1회)  |

---

## 2. ETL 파이프라인 전체 흐름

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ETL 트리거 방식                               │
├─────────────┬───────────────┬───────────────┬───────────────────────┤
│  서버 기동   │  스케줄러      │  온디맨드     │  수동 트리거           │
│ (백필)      │ (매일 02:00)  │ (API 조회 시) │ (POST /kobis/collect) │
└──────┬──────┴───────┬───────┴───────┬───────┴───────────┬───────────┘
       │              │               │                   │
       ▼              ▼               ▼                   ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Extract (추출)                                    │
│                                                                      │
│  TMDB API                    KOBIS API                               │
│  ├ /genre/movie/list         ├ /searchDailyBoxOfficeList.json        │
│  ├ /movie/top_rated          ├ /searchWeeklyBoxOfficeList.json       │
│  ├ /movie/{id}               ├ /searchCodeList.json                  │
│  └ /search/movie             ├ /searchMovieList.json                 │
│                              └ /searchMovieInfo.json                 │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     Transform (변환)                                  │
│                                                                      │
│  ┌ TMDB ──────────────────────────────────────────────────────────┐  │
│  │ • genre_ids (정수 배열) → genre 이름 배열 (장르 맵 조인)        │  │
│  │ • JSON snake_case → Java camelCase 매핑                        │  │
│  │ • null 안전 처리 (빈 리스트 대체)                                │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌ KOBIS ─────────────────────────────────────────────────────────┐  │
│  │ • 전체 필드 String → int/long/double 타입 파싱                  │  │
│  │ • targetDt(yyyyMMdd) → date(yyyy-MM-dd) 포맷 변환              │  │
│  │ • showRange 계산 (월요일~일요일 범위 문자열 생성)                 │  │
│  │ • 영화 상세: directors/actors 리스트 → 쉼표 구분 문자열          │  │
│  │ • 배우 정보: 최대 5명 제한, "이름(배역)" 포맷으로 결합           │  │
│  │ • 관람등급: audits 리스트에서 첫 번째 항목 추출                   │  │
│  └────────────────────────────────────────────────────────────────┘  │
│  ┌ 파생 통계 (조회 시 실시간 변환) ──────────────────────────────┐   │
│  │ • audiPerScreen = audiCnt / scrnCnt                           │   │
│  │ • audiPerShow = audiCnt / showCnt                             │   │
│  │ • screenShare = (scrnCnt / totalScreens) × 100                │   │
│  │ • daysSinceRelease = currentDate - openDt                     │   │
│  │ • weekNumber = daysSinceRelease / 7 + 1                       │   │
│  │ • 월별/계절별 트렌드 집계 (그룹핑 + SUM/AVG/COUNT/MAX)         │   │
│  └───────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      Load (적재)                                      │
│                                                                      │
│  Spring Data JPA → Hibernate → MySQL                                 │
│  • saveAll() 벌크 저장                                                │
│  • 중복 방지: existsByDate / existsByShowRangeAndWeekGb 사전 검사     │
│  • 보존 정책: purgeOldData()로 만료 데이터 자동 삭제                   │
│  • DDL 전략: hibernate.ddl-auto=update (자동 스키마 반영)              │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. TMDB ETL 파이프라인

### 3.1 처리 클래스

| 클래스                | 역할                                 |
| --------------------- | ------------------------------------ |
| `TmdbService`         | Extract + Transform + Load 전체 수행 |
| `TmdbMovieRepository` | Load (JPA 영속화)                    |

### 3.2 수집 흐름

```
[트리거]                     [Extract]                [Transform]           [Load]
   │                            │                         │                   │
   │  GET /api/movies           │                         │                   │
   │  (DB 비어있을 때)     ──────┤                         │                   │
   │                            │                         │                   │
   │  POST /api/movies/refresh  │                         │                   │
   │  (수동 갱신)         ──────┤                         │                   │
   │                            ▼                         │                   │
   │                   fetchGenreMap()                    │                   │
   │                   /genre/movie/list                  │                   │
   │                   → Map<Integer, String>             │                   │
   │                            │                         │                   │
   │                            ▼                         │                   │
   │                   fetchTopRatedPage(1~5)              │                   │
   │                   /movie/top_rated?page=N            │                   │
   │                   → TmdbMovieListResponse            │                   │
   │                            │                         ▼                   │
   │                            │                  toMovie(item, genreMap)    │
   │                            │                  • genreIds → 장르명 변환   │
   │                            │                  • Builder로 엔티티 생성    │
   │                            │                         │                   │
   │                            │                         │                   ▼
   │                            │                         │         movieRepository.saveAll()
   │                            │                         │         → movies + movie_genres
```

### 3.3 Extract 상세

#### 3.3.1 장르 맵 조회

| 항목     | 값                                             |
| -------- | ---------------------------------------------- |
| API      | `GET /3/genre/movie/list`                      |
| 파라미터 | `api_key`, `language=ko-KR`                    |
| 응답 DTO | `TmdbGenreListResponse`                        |
| 목적     | genre_id(정수) → 장르명(한글) 매핑 테이블 생성 |

**응답 구조**

```json
{
  "genres": [
    { "id": 28, "name": "액션" },
    { "id": 12, "name": "모험" }
  ]
}
```

**변환 결과**: `Map<Integer, String>` (예: `{28: "액션", 12: "모험", ...}`)

#### 3.3.2 Top Rated 영화 목록 (5페이지)

| 항목          | 값                                              |
| ------------- | ----------------------------------------------- |
| API           | `GET /3/movie/top_rated`                        |
| 파라미터      | `api_key`, `language=ko-KR`, `page=1~5`         |
| 응답 DTO      | `TmdbMovieListResponse` → `List<TmdbMovieItem>` |
| 페이지당 결과 | 최대 20편                                       |
| 총 수집 대상  | 최대 100편                                      |

**응답 DTO 필드 매핑**

| API 필드 (snake_case) | DTO 필드 (camelCase) | 타입            |
| --------------------- | -------------------- | --------------- |
| `id`                  | `id`                 | Long            |
| `title`               | `title`              | String          |
| `original_title`      | `originalTitle`      | String          |
| `overview`            | `overview`           | String          |
| `release_date`        | `releaseDate`        | String          |
| `vote_average`        | `voteAverage`        | Double          |
| `vote_count`          | `voteCount`          | Long            |
| `popularity`          | `popularity`         | Double          |
| `poster_path`         | `posterPath`         | String          |
| `backdrop_path`       | `backdropPath`       | String          |
| `genre_ids`           | `genreIds`           | List\<Integer\> |

#### 3.3.3 영화 상세 (Fallback 조회)

| 항목     | 값                                            |
| -------- | --------------------------------------------- |
| API      | `GET /3/movie/{id}`                           |
| 파라미터 | `api_key`, `language=ko-KR`                   |
| 응답 DTO | `TmdbMovieDetailResponse`                     |
| 트리거   | DB에 해당 ID 없을 때 (`getMovieById` 호출 시) |

상세 API는 `genre_ids` 대신 `genres` 객체 배열(`[{id, name}]`)을 반환하므로 장르 맵 조인 없이 직접 이름을 추출합니다.

### 3.4 Transform 상세

`toMovie(TmdbMovieItem item, Map<Integer, String> genreMap)` 메서드에서 수행:

| 변환 항목 | 입력                 | 출력                       | 변환 규칙                  |
| --------- | -------------------- | -------------------------- | -------------------------- |
| 장르      | `genreIds: [28, 12]` | `genres: ["액션", "모험"]` | genreMap 조인, null 제거   |
| 필드 매핑 | snake_case JSON      | camelCase Entity           | `@JsonProperty` 어노테이션 |
| null 처리 | `genreIds: null`     | `genres: []`               | 빈 리스트 대체             |

### 3.5 Load 상세

| 항목        | 값                                                   |
| ----------- | ---------------------------------------------------- |
| 메서드      | `movieRepository.saveAll(movies)`                    |
| 대상 테이블 | `movies` (메인) + `movie_genres` (ElementCollection) |
| PK 전략     | TMDB ID 사용 (자동 생성 아님)                        |
| 중복 처리   | 동일 ID 존재 시 JPA merge (update)                   |
| 트랜잭션    | `@Transactional` (fetchAndStore 메서드 단위)         |

### 3.6 갱신 전략

| 시나리오                          | 동작                                        |
| --------------------------------- | ------------------------------------------- |
| 최초 조회 (`/api/movies`)         | DB 비어있으면 자동 수집                     |
| 강제 갱신 (`/api/movies/refresh`) | `deleteAll()` → `fetchAndStore()`           |
| 개별 조회 (`/api/movies/{id}`)    | DB 조회 → 없으면 TMDB API fallback (비저장) |

---

## 4. KOBIS ETL 파이프라인

### 4.1 처리 클래스

| 클래스                      | 역할                                  |
| --------------------------- | ------------------------------------- |
| `KobisService`              | Extract + Transform + Load + 스케줄링 |
| `DailyBoxOfficeRepository`  | 일별 박스오피스 적재/조회/삭제        |
| `WeeklyBoxOfficeRepository` | 주간/주말 박스오피스 적재/조회        |
| `KobisMovieRepository`      | 영화 마스터 적재/조회                 |
| `KobisCodeRepository`       | 공통코드 적재/조회                    |

### 4.2 수집 대상별 파이프라인

#### 4.2.1 일별 박스오피스

```
[트리거]                           [Extract]                    [Transform]              [Load]
   │                                  │                            │                      │
   │  스케줄러 (매일 02:00)            │                            │                      │
   │  → scheduledCollect()     ──────┤                            │                      │
   │                                  │                            │                      │
   │  서버 기동 시                     │                            │                      │
   │  → backfillOnStartup()    ──────┤                            │                      │
   │    → backfillDaily()             │                            │                      │
   │      (DATA_START_DATE~어제)      │                            │                      │
   │                                  │                            │                      │
   │  API 조회 시                     │                            │                      │
   │  → getDailyBoxOffice(date)──────┤                            │                      │
   │    (DB 미존재 시)                │                            │                      │
   │                                  ▼                            │                      │
   │                         collectDailySingle(date)              │                      │
   │                         KOBIS 일별 박스오피스 API              │                      │
   │                         → KobisBoxOfficeResponse              │                      │
   │                                  │                            ▼                      │
   │                                  │                  String → int/long/double 파싱     │
   │                                  │                  targetDt → yyyy-MM-dd 변환        │
   │                                  │                  DailyBoxOffice.builder() 생성     │
   │                                  │                            │                      ▼
   │                                  │                            │          dailyRepo.saveAll()
   │                                  │                            │          → daily_box_office
```

**Extract — KOBIS 일별 박스오피스 API**

| 항목     | 값                                                         |
| -------- | ---------------------------------------------------------- |
| URL      | `http://www.kobis.or.kr/.../searchDailyBoxOfficeList.json` |
| 파라미터 | `key` (API 키), `targetDt` (yyyyMMdd)                      |
| 응답 DTO | `KobisBoxOfficeResponse`                                   |

**Transform — 타입 변환 규칙**

| API 필드 (String) | 엔티티 필드              | 변환 함수      | 실패 시 기본값 |
| ----------------- | ------------------------ | -------------- | -------------- |
| `rank`            | `rank` (int)             | `parsInt()`    | 0              |
| `rankInten`       | `rankInten` (int)        | `parsInt()`    | 0              |
| `rankOldAndNew`   | `rankOldAndNew` (String) | 그대로         | -              |
| `movieNm`         | `movieNm` (String)       | 그대로         | -              |
| `openDt`          | `openDt` (String)        | 그대로         | -              |
| `salesAmt`        | `salesAmt` (long)        | `parsLong()`   | 0L             |
| `salesShare`      | `salesShare` (double)    | `parsDouble()` | 0.0            |
| `salesInten`      | `salesInten` (long)      | `parsLong()`   | 0L             |
| `salesChange`     | `salesChange` (double)   | `parsDouble()` | 0.0            |
| `salesAcc`        | `salesAcc` (long)        | `parsLong()`   | 0L             |
| `audiCnt`         | `audiCnt` (long)         | `parsLong()`   | 0L             |
| `audiInten`       | `audiInten` (long)       | `parsLong()`   | 0L             |
| `audiChange`      | `audiChange` (double)    | `parsDouble()` | 0.0            |
| `audiAcc`         | `audiAcc` (long)         | `parsLong()`   | 0L             |
| `scrnCnt`         | `scrnCnt` (long)         | `parsLong()`   | 0L             |
| `showCnt`         | `showCnt` (long)         | `parsLong()`   | 0L             |

추가 변환: `targetDt` 파라미터는 `yyyyMMdd` 형식이지만, 엔티티의 `date` 필드에는 `yyyy-MM-dd` 형식으로 저장합니다.

---

#### 4.2.2 주간/주말 박스오피스

```
[트리거]                           [Extract]                    [Transform]              [Load]
   │                                  │                            │                      │
   │  서버 기동 시                     │                            │                      │
   │  → backfillWeekly()       ──────┤                            │                      │
   │    (월요일 단위 순회)             │                            │                      │
   │    (weekGb=0, weekGb=1 각각)     │                            │                      │
   │                                  │                            │                      │
   │  API 조회 시                     │                            │                      │
   │  → getWeeklyBoxOffice()   ──────┤                            │                      │
   │    (DB 미존재 시)                │                            │                      │
   │                                  ▼                            │                      │
   │                         collectWeeklySingle(targetDt)         │                      │
   │                         KOBIS 주간 박스오피스 API              │                      │
   │                         → KobisWeeklyResponse                 │                      │
   │                                  │                            ▼                      │
   │                                  │                  String → int/long/double 파싱     │
   │                                  │                  showRange 계산/수신               │
   │                                  │                  WeeklyBoxOffice.builder() 생성    │
   │                                  │                            │                      ▼
   │                                  │                            │        weeklyRepo.saveAll()
   │                                  │                            │        → weekly_box_office
```

**Extract — KOBIS 주간 박스오피스 API**

| 항목     | 값                                                                   |
| -------- | -------------------------------------------------------------------- |
| URL      | `http://www.kobis.or.kr/.../searchWeeklyBoxOfficeList.json`          |
| 파라미터 | `key`, `targetDt` (yyyyMMdd, 월요일 기준), `weekGb` (0=주간, 1=주말) |
| 응답 DTO | `KobisWeeklyResponse`                                                |

**showRange 결정 로직**

| 모드                                   | showRange 결정 방식                                |
| -------------------------------------- | -------------------------------------------------- |
| 백필 (`collectWeeklySingle`)           | API 응답의 `actualRange` 사용 (없으면 계산값 사용) |
| 온디맨드 (`collectWeeklySingleForced`) | 요청한 `showRange` 그대로 사용 (API 응답 무시)     |

**백필 범위 계산**

```
시작: DATA_START_DATE의 직전 또는 당일 월요일
종료: 어제의 직전 또는 당일 일요일
단위: 1주일씩 (월요일 → 다음 월요일)
반복: weekGb=0 (주간) + weekGb=1 (주말) 각각 수집
```

---

#### 4.2.3 KOBIS 영화 마스터

```
[트리거]                            [Extract 1단계]              [Extract 2단계]           [Load]
   │                                  │                            │                      │
   │  서버 기동 시                     │                            │                      │
   │  → collectMovieList()     ──────┤                            │                      │
   │                                  ▼                            │                      │
   │                         searchMovieList API                  │                      │
   │                         (페이지네이션, 100건/페이지)           │                      │
   │                         → KobisMovieListResponse             │                      │
   │                                  │                            │                      │
   │                                  │  [기본 정보로 엔티티 생성]   │                      │
   │                                  │                            │                      │
   │                                  │  movieCd가 DB에 없으면     │                      │
   │                                  │  ──────────────────────────┤                      │
   │                                  │                            ▼                      │
   │                                  │                   enrichWithDetail()              │
   │                                  │                   searchMovieInfo API             │
   │                                  │                   → KobisMovieInfoResponse        │
   │                                  │                            │                      │
   │                                  │                   [상세 필드 보강]                 │
   │                                  │                   • showTm (상영시간)              │
   │                                  │                   • directors → 문자열             │
   │                                  │                   • actors → 문자열 (5명 제한)     │
   │                                  │                   • companys → 문자열             │
   │                                  │                   • watchGradeNm (관람등급)        │
   │                                  │                            │                      ▼
   │                                  │                            │        movieRepo.save()
   │                                  │                            │        → kobis_movie
```

**Extract 1단계 — 영화 목록 API**

| 항목         | 값                                                                  |
| ------------ | ------------------------------------------------------------------- |
| URL          | `http://www.kobis.or.kr/.../searchMovieList.json`                   |
| 파라미터     | `key`, `prdtStartYear`, `prdtEndYear`, `curPage`, `itemPerPage=100` |
| 응답 DTO     | `KobisMovieListResponse`                                            |
| 수집 범위    | `DATA_START_DATE.year - 1` ~ `현재 연도`                            |
| 페이지네이션 | `totCnt`로 전체 페이지 수 계산 후 순회                              |

**Extract 2단계 — 영화 상세 API**

| 항목      | 값                                                |
| --------- | ------------------------------------------------- |
| URL       | `http://www.kobis.or.kr/.../searchMovieInfo.json` |
| 파라미터  | `key`, `movieCd`                                  |
| 응답 DTO  | `KobisMovieInfoResponse`                          |
| 호출 조건 | DB에 해당 `movieCd` 없을 때만                     |

**Transform — 상세정보 변환 규칙**

| 변환 항목 | 입력                                     | 출력                    | 규칙                          |
| --------- | ---------------------------------------- | ----------------------- | ----------------------------- |
| 상영시간  | `showTm: "109"`                          | `showTm: 109`           | `parsIntOrNull()` (null 허용) |
| 감독      | `[{peopleNm: "허명행"}]`                 | `"허명행"`              | 쉼표 구분 조인                |
| 배우      | `[{peopleNm: "마동석", cast: "마석도"}]` | `"마동석(마석도), ..."` | 최대 5명, "이름(배역)" 포맷   |
| 제작사    | `[{companyNm: "빅펀치"}]`                | `"빅펀치"`              | 쉼표 구분 조인                |
| 관람등급  | `[{watchGradeNm: "15세이상"}]`           | `"15세이상"`            | 첫 번째 항목만 추출           |

---

#### 4.2.4 KOBIS 공통코드

```
[트리거]                           [Extract]                    [Transform]              [Load]
   │                                  │                            │                      │
   │  서버 기동 시                     │                            │                      │
   │  → collectCodes()         ──────┤                            │                      │
   │    (codeRepo 비어있을 때만)       │                            │                      │
   │                                  ▼                            │                      │
   │                         searchCodeList API                   │                      │
   │                         comCode별 순회                        │                      │
   │                         ("2105", "2101", "2201")             │                      │
   │                         → KobisCodeResponse                  │                      │
   │                                  │                            ▼                      │
   │                                  │                  CodeItem → KobisCode 엔티티      │
   │                                  │                  comCode 태깅                     │
   │                                  │                            │                      ▼
   │                                  │                            │        codeRepo.saveAll()
   │                                  │                            │        → kobis_code
```

**코드 분류 (comCode)**

| comCode | 용도           |
| ------- | -------------- |
| `2105`  | 장르 코드      |
| `2101`  | 국가 코드      |
| `2201`  | 기타 분류 코드 |

---

## 5. 스케줄링 및 트리거 설계

### 5.1 스케줄러

| 스케줄    | Cron 표현식                | 메서드               | 동작                                         |
| --------- | -------------------------- | -------------------- | -------------------------------------------- |
| 일별 수집 | `0 0 2 * * *` (매일 02:00) | `scheduledCollect()` | 전일 일별 박스오피스 수집 + 만료 데이터 삭제 |

```java
@Scheduled(cron = "0 0 2 * * *")
public void scheduledCollect() {
    collectDailySingle(어제 날짜);
    purgeOldData();
}
```

### 5.2 서버 기동 시 백필

| 순서 | 메서드               | 동작                                                   |
| ---- | -------------------- | ------------------------------------------------------ |
| 1    | `backfillDaily()`    | DATA_START_DATE ~ 어제까지 일별 데이터 보충            |
| 2    | `backfillWeekly()`   | DATA_START_DATE 주 ~ 직전 주까지 주간+주말 데이터 보충 |
| 3    | `collectCodes()`     | 공통코드 수집 (이미 존재 시 건너뜀)                    |
| 4    | `collectMovieList()` | 영화 마스터 수집 + 상세 보강 (이미 존재 시 건너뜀)     |

```java
@EventListener(ApplicationReadyEvent.class)
public void backfillOnStartup() {
    backfillDaily();
    backfillWeekly();
    collectCodes();
    collectMovieList();
}
```

**백필 기준일**: `DATA_START_DATE = 2025-06-19`

### 5.3 온디맨드 수집

사용자가 API를 조회할 때 DB에 해당 데이터가 없으면 자동으로 수집합니다.

| 메서드                              | 조건                                          | 동작                                  |
| ----------------------------------- | --------------------------------------------- | ------------------------------------- |
| `getDailyBoxOffice(date)`           | `!dailyRepo.existsByDate(date)`               | `collectDailySingle(date)` 호출       |
| `getWeeklyBoxOffice(range, weekGb)` | `!weeklyRepo.existsByShowRangeAndWeekGb(...)` | `collectWeeklySingleForced(...)` 호출 |
| `getMovies()` (TMDB)                | `movieRepository.count() == 0`                | `tmdbService.fetchAndStore()` 호출    |

### 5.4 수동 트리거

| 엔드포인트                 | 동작                                                          |
| -------------------------- | ------------------------------------------------------------- |
| `POST /api/movies/refresh` | TMDB 데이터 전체 삭제 후 재수집                               |
| `POST /api/kobis/collect`  | KOBIS 전체 데이터 수동 수집 (일별+주간+코드+영화) + 만료 삭제 |

---

## 6. 데이터 생명주기 관리

### 6.1 보존 정책

| 데이터               | 보존 기간                       | 삭제 방식                      |
| -------------------- | ------------------------------- | ------------------------------ |
| 일별 박스오피스      | 365일 (`RETENTION_DAYS`)        | `purgeOldData()` — JPQL DELETE |
| 주간/주말 박스오피스 | 무기한                          | 삭제 로직 없음                 |
| KOBIS 영화 마스터    | 무기한                          | 삭제 로직 없음                 |
| KOBIS 공통코드       | 무기한                          | 삭제 로직 없음                 |
| TMDB 영화            | 무기한 (수동 갱신 시 전체 교체) | `deleteAll()` → 재수집         |

### 6.2 삭제 쿼리

```sql
DELETE FROM DailyBoxOffice d WHERE d.date < :cutoffDate
-- cutoffDate = 현재일 - (RETENTION_DAYS + 1)
```

### 6.3 삭제 트리거

| 트리거    | 시점                              |
| --------- | --------------------------------- |
| 스케줄러  | 매일 02:00 수집 후                |
| 수동 수집 | `POST /api/kobis/collect` 실행 후 |

---

## 7. 중복 방지 전략

| 대상              | 중복 체크 방식                              | 메서드                               |
| ----------------- | ------------------------------------------- | ------------------------------------ |
| 일별 박스오피스   | `existsByDate(date)`                        | 동일 날짜 데이터 존재 시 수집 건너뜀 |
| 주간 박스오피스   | `existsByShowRangeAndWeekGb(range, weekGb)` | 동일 기간+구분 존재 시 건너뜀        |
| KOBIS 영화 마스터 | `movieRepo.existsById(movieCd)`             | 동일 movieCd 존재 시 건너뜀          |
| KOBIS 공통코드    | `codeRepo.count() > 0`                      | 1건이라도 있으면 전체 건너뜀         |
| TMDB 영화         | `movieRepository.count() == 0`              | DB 비어있을 때만 수집                |

---

## 8. API 호출 제어

### 8.1 Rate Limiting

외부 API 호출 간 `Thread.sleep(300)` (300ms) 대기를 삽입하여 과도한 요청을 방지합니다.

| 적용 위치                           | 대기 시간 |
| ----------------------------------- | --------- |
| `collectDailySingle()`              | 300ms     |
| `collectWeeklySingle()`             | 300ms     |
| `collectMovieList()` — 페이지 간    | 300ms     |
| `collectMovieList()` — 영화 상세 간 | 300ms     |
| `collectCodes()` — 코드 분류 간     | 300ms     |

### 8.2 오류 처리

| 상황                | 처리 방식                                                            |
| ------------------- | -------------------------------------------------------------------- |
| API 응답 null       | 건너뜀 (빈 리스트 반환)                                              |
| JSON 파싱 실패      | `parsInt/parsLong/parsDouble`에서 기본값(0) 반환                     |
| HTTP 통신 실패      | `catch (Exception)` → 경고 로그 후 다음 건 진행                      |
| KOBIS 비즈니스 오류 | `faultInfo` 필드 확인 → `ResponseStatusException(503)` (온디맨드 시) |
| TMDB 상세 조회 실패 | `null` 반환 (fallback 실패)                                          |

---

## 9. 파생 데이터 변환 (조회 시 실시간)

DB에 적재하지 않고, 조회 시점에 실시간으로 계산하는 파생 데이터입니다.

### 9.1 파생 통계 (`DerivedStatsDto`)

| 파생 필드          | 계산식                           | 단위      |
| ------------------ | -------------------------------- | --------- |
| `audiPerScreen`    | `audiCnt / scrnCnt`              | 명/스크린 |
| `audiPerShow`      | `audiCnt / showCnt`              | 명/상영회 |
| `screenShare`      | `(scrnCnt / totalScreens) × 100` | %         |
| `daysSinceRelease` | `currentDate - openDt`           | 일        |

반올림: `audiPerScreen`, `audiPerShow`는 소수 1자리, `screenShare`는 소수 2자리

### 9.2 영화 추적 (`MovieTrackingDto`)

| 파생 필드          | 계산식                     |
| ------------------ | -------------------------- |
| `daysSinceRelease` | `date - openDt`            |
| `weekNumber`       | `daysSinceRelease / 7 + 1` |
| `audiPerScreen`    | `audiCnt / scrnCnt`        |
| `audiPerShow`      | `audiCnt / showCnt`        |

### 9.3 트렌드 집계 (`TrendAnalysisDto`)

주간 박스오피스 데이터(`weekGb=0`)를 월별/계절별로 그룹핑 후 집계합니다.

**월별 그룹 키**: showRange 앞 6자리 → `"YYYY-MM"` 형식  
**계절별 그룹 키**: showRange 앞 6자리 월 기준

| 월     | 계절          |
| ------ | ------------- |
| 3~5월  | `"YYYY 봄"`   |
| 6~8월  | `"YYYY 여름"` |
| 9~11월 | `"YYYY 가을"` |
| 12~2월 | `"YYYY 겨울"` |

**집계 함수**

| 필드            | 집계                           |
| --------------- | ------------------------------ |
| `totalSales`    | SUM(salesAmt)                  |
| `totalAudience` | SUM(audiCnt)                   |
| `movieCount`    | COUNT(DISTINCT movieNm)        |
| `topMovie`      | MAX(SUM(audiCnt)) 기준 movieNm |
| `avgScreens`    | SUM(scrnCnt) / COUNT           |

### 9.4 역대 순위 (`AllTimeRankingDto`)

일별 박스오피스 전체 데이터를 영화명으로 그룹핑하여 누적 최대값을 추출합니다.

| 필드          | 집계                      |
| ------------- | ------------------------- |
| `maxAudiAcc`  | MAX(audiAcc) per movieNm  |
| `maxSalesAcc` | MAX(salesAcc) per movieNm |
| `rank`        | 정렬 후 순번 부여         |

---

## 10. 전체 데이터 흐름 요약도

```
                    ┌──────────────────┐
                    │   TMDB API       │
                    │ (글로벌 영화 DB)  │
                    └────────┬─────────┘
                             │ REST (JSON)
                             │ • /genre/movie/list
                             │ • /movie/top_rated (5 pages)
                             │ • /movie/{id}
                             │ • /search/movie
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                        TmdbService                               │
│                                                                  │
│  Extract: RestTemplate.getForObject()                            │
│  Transform: genreId→이름 변환, snake→camel, null 처리            │
│  Load: movieRepository.saveAll()                                 │
│                                                                  │
│  트리거: DB 비어있을 때 / 수동 refresh                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
              ┌────────────────┐
              │     MySQL      │
              │                │
              │  movies        │◄──── TMDB 데이터
              │  movie_genres  │
              │                │
              │  daily_box_    │◄──── KOBIS 일별
              │    office      │
              │                │
              │  weekly_box_   │◄──── KOBIS 주간/주말
              │    office      │
              │                │
              │  kobis_movie   │◄──── KOBIS 영화 마스터
              │                │
              │  kobis_code    │◄──── KOBIS 공통코드
              └────────────────┘
                       ▲
                       │
┌──────────────────────┴───────────────────────────────────────────┐
│                        KobisService                              │
│                                                                  │
│  Extract: RestTemplate.getForObject()                            │
│  Transform: String→숫자 파싱, 날짜 변환, 리스트→문자열            │
│  Load: dailyRepo/weeklyRepo/movieRepo/codeRepo.saveAll()         │
│                                                                  │
│  트리거: 스케줄러(02:00) / 서버기동(백필) / 온디맨드 / 수동 수집   │
│  생명주기: purgeOldData() — 365일 초과 일별 데이터 삭제            │
└──────────────────────────────────────────────────────────────────┘
                       ▲
                       │ REST (JSON)
                       │ • /searchDailyBoxOfficeList
                       │ • /searchWeeklyBoxOfficeList
                       │ • /searchCodeList
                       │ • /searchMovieList + /searchMovieInfo
                       │
                    ┌──┴───────────────┐
                    │   KOBIS API      │
                    │ (영화진흥위원회)   │
                    └──────────────────┘
```
