# CineStats API 명세서

> **Base URL**: `http://localhost:8080`  
> **Content-Type**: `application/json`  
> **CORS**: `http://localhost:5173` 허용

---

## 목차

1. [TMDB 영화 API](#1-tmdb-영화-api)
2. [KOFIC 박스오피스 API](#2-kofic-박스오피스-api)
3. [KOFIC 데이터 관리 API](#3-kofic-데이터-관리-api)
4. [AI 코멘터리 API](#4-ai-코멘터리-api)
5. [배틀 게임 API](#5-배틀-게임-api)
6. [게시판 API](#6-게시판-api)

---

## 1. TMDB 영화 API

### 1.1 전체 영화 목록 조회

영화 목록을 평점 내림차순으로 반환합니다. DB가 비어있으면 TMDB에서 자동 수집 후 반환합니다.

| 항목           | 값            |
| -------------- | ------------- |
| **Method**     | `GET`         |
| **URI**        | `/api/movies` |
| **Parameters** | 없음          |

**Response** `200 OK`

```json
[
  {
    "id": 278,
    "title": "쇼생크 탈출",
    "original_title": "The Shawshank Redemption",
    "overview": "촉망받는 은행 부행장 앤디 듀프레인은...",
    "release_date": "1994-09-23",
    "vote_average": 8.7,
    "vote_count": 27000,
    "popularity": 120.5,
    "poster_path": "/9O7gLzmreU0nGkIB6K3BsJbzvNv.jpg",
    "backdrop_path": "/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg",
    "movie_cd": "19950042",
    "genres": ["드라마", "범죄"]
  }
]
```

| 필드             | 타입     | 설명                      |
| ---------------- | -------- | ------------------------- |
| `id`             | Long     | TMDB 영화 ID              |
| `title`          | String   | 한글 제목                 |
| `original_title` | String   | 원어 제목                 |
| `overview`       | String   | 줄거리                    |
| `release_date`   | String   | 개봉일 (YYYY-MM-DD)       |
| `vote_average`   | Double   | 평균 평점 (0~10)          |
| `vote_count`     | Long     | 투표 수                   |
| `popularity`     | Double   | 인기도 점수               |
| `poster_path`    | String   | 포스터 이미지 경로        |
| `backdrop_path`  | String   | 배경 이미지 경로          |
| `movie_cd`       | String   | KOBIS 영화 코드 (연결 시) |
| `genres`         | String[] | 장르 목록                 |

---

### 1.2 영화 데이터 강제 갱신

기존 영화 데이터를 모두 삭제하고 TMDB에서 다시 수집합니다.

| 항목             | 값                    |
| ---------------- | --------------------- |
| **Method**       | `POST`                |
| **URI**          | `/api/movies/refresh` |
| **Request Body** | 없음                  |

**Response** `200 OK`

```
"120편 갱신 완료"
```

---

### 1.3 영화 상세 조회

ID로 영화를 조회합니다. DB에 없으면 TMDB API에서 직접 조회(fallback)합니다.

| 항목       | 값                 |
| ---------- | ------------------ |
| **Method** | `GET`              |
| **URI**    | `/api/movies/{id}` |

| Path Variable | 타입 | 설명         |
| ------------- | ---- | ------------ |
| `id`          | Long | TMDB 영화 ID |

**Response** `200 OK` — [TmdbMovie 객체](#11-전체-영화-목록-조회) (단일)

---

### 1.4 영화 검색

키워드로 TMDB 영화를 검색합니다.

| 항목       | 값                   |
| ---------- | -------------------- |
| **Method** | `GET`                |
| **URI**    | `/api/movies/search` |

| Query Parameter | 타입   | 필수 | 설명        |
| --------------- | ------ | ---- | ----------- |
| `query`         | String | O    | 검색 키워드 |

**Response** `200 OK` — [TmdbMovie 객체](#11-전체-영화-목록-조회) 배열

**요청 예시**

```
GET /api/movies/search?query=인터스텔라
```

---

## 2. KOFIC 박스오피스 API

### 2.1 일별 박스오피스 조회

특정 날짜의 일별 박스오피스 데이터를 DB에서 조회합니다.

| 항목       | 값               |
| ---------- | ---------------- |
| **Method** | `GET`            |
| **URI**    | `/api/boxoffice` |

| Query Parameter | 타입   | 필수 | 설명                                             |
| --------------- | ------ | ---- | ------------------------------------------------ |
| `date`          | String | X    | 조회 날짜 (YYYY-MM-DD). 미지정 시 가장 최근 날짜 |

**Response** `200 OK`

```json
[
  {
    "rank": 1,
    "rankInten": 0,
    "rankOldAndNew": "OLD",
    "movieNm": "범죄도시4",
    "openDt": "2024-04-24",
    "salesAmt": 4523000000,
    "salesShare": 52.3,
    "salesInten": -120000000,
    "salesChange": -2.6,
    "salesAcc": 85000000000,
    "audiCnt": 520000,
    "audiInten": -30000,
    "audiChange": -5.5,
    "audiAcc": 10000000,
    "scrnCnt": 2100,
    "showCnt": 9500,
    "date": "2024-05-01"
  }
]
```

| 필드            | 타입   | 설명                                       |
| --------------- | ------ | ------------------------------------------ |
| `rank`          | int    | 박스오피스 순위                            |
| `rankInten`     | int    | 전일 대비 순위 증감 (양수=상승, 음수=하락) |
| `rankOldAndNew` | String | `"OLD"` (기존) / `"NEW"` (신규 진입)       |
| `movieNm`       | String | 영화명                                     |
| `openDt`        | String | 개봉일                                     |
| `salesAmt`      | long   | 당일 매출액 (원)                           |
| `salesShare`    | double | 매출 점유율 (%)                            |
| `salesInten`    | long   | 전일 대비 매출 증감액 (원)                 |
| `salesChange`   | double | 전일 대비 매출 증감률 (%)                  |
| `salesAcc`      | long   | 누적 매출액 (원)                           |
| `audiCnt`       | long   | 당일 관객 수                               |
| `audiInten`     | long   | 전일 대비 관객 수 증감                     |
| `audiChange`    | double | 전일 대비 관객 수 증감률 (%)               |
| `audiAcc`       | long   | 누적 관객 수                               |
| `scrnCnt`       | long   | 스크린 수                                  |
| `showCnt`       | long   | 상영 횟수                                  |
| `date`          | String | 기준 날짜 (YYYY-MM-DD)                     |

---

### 2.2 수집된 날짜 목록 조회

일별 박스오피스 데이터가 존재하는 날짜 목록을 반환합니다.

| 항목           | 값                     |
| -------------- | ---------------------- |
| **Method**     | `GET`                  |
| **URI**        | `/api/boxoffice/dates` |
| **Parameters** | 없음                   |

**Response** `200 OK`

```json
["2024-05-01", "2024-04-30", "2024-04-29"]
```

---

### 2.3 주간/주말 박스오피스 조회

특정 기간의 주간 또는 주말 박스오피스 데이터를 반환합니다.

| 항목       | 값                      |
| ---------- | ----------------------- |
| **Method** | `GET`                   |
| **URI**    | `/api/boxoffice/weekly` |

| Query Parameter | 타입   | 필수 | 기본값 | 설명                          |
| --------------- | ------ | ---- | ------ | ----------------------------- |
| `range`         | String | O    | -      | 조회 기간 (yyyyMMdd~yyyyMMdd) |
| `weekGb`        | String | X    | `"0"`  | `"0"` = 주간, `"1"` = 주말    |

**Response** `200 OK`

```json
[
  {
    "id": 1,
    "showRange": "20240422~20240428",
    "weekGb": "0",
    "rank": 1,
    "movieCd": "20240001",
    "movieNm": "범죄도시4",
    "openDt": "2024-04-24",
    "salesAmt": 30000000000,
    "salesShare": 55.2,
    "salesAcc": 85000000000,
    "audiCnt": 3500000,
    "audiAcc": 10000000,
    "scrnCnt": 2300,
    "showCnt": 65000
  }
]
```

| 필드         | 타입   | 설명                       |
| ------------ | ------ | -------------------------- |
| `id`         | Long   | 레코드 ID                  |
| `showRange`  | String | 기간 (yyyyMMdd~yyyyMMdd)   |
| `weekGb`     | String | `"0"` = 주간, `"1"` = 주말 |
| `rank`       | int    | 순위                       |
| `movieCd`    | String | KOBIS 영화 코드            |
| `movieNm`    | String | 영화명                     |
| `openDt`     | String | 개봉일                     |
| `salesAmt`   | long   | 기간 매출액 (원)           |
| `salesShare` | double | 매출 점유율 (%)            |
| `salesAcc`   | long   | 누적 매출액 (원)           |
| `audiCnt`    | long   | 기간 관객 수               |
| `audiAcc`    | long   | 누적 관객 수               |
| `scrnCnt`    | long   | 스크린 수                  |
| `showCnt`    | long   | 상영 횟수                  |

**요청 예시**

```
GET /api/boxoffice/weekly?range=20240422~20240428&weekGb=0
```

---

### 2.4 주간/주말 조회 가능 기간 목록

수집된 주간/주말 데이터의 기간 목록을 반환합니다.

| 항목       | 값                             |
| ---------- | ------------------------------ |
| **Method** | `GET`                          |
| **URI**    | `/api/boxoffice/weekly/ranges` |

| Query Parameter | 타입   | 필수 | 기본값 | 설명                       |
| --------------- | ------ | ---- | ------ | -------------------------- |
| `weekGb`        | String | X    | `"0"`  | `"0"` = 주간, `"1"` = 주말 |

**Response** `200 OK`

```json
["20240422~20240428", "20240415~20240421", "20240408~20240414"]
```

---

### 2.5 트렌드 분석 (월별/계절별)

주간 박스오피스 데이터를 기반으로 월별 및 계절별 트렌드를 분석합니다.

| 항목           | 값                             |
| -------------- | ------------------------------ |
| **Method**     | `GET`                          |
| **URI**        | `/api/boxoffice/weekly/trends` |
| **Parameters** | 없음                           |

**Response** `200 OK`

```json
{
  "monthly": [
    {
      "period": "2024-01",
      "totalSales": 150000000000,
      "totalAudience": 18000000,
      "movieCount": 30,
      "topMovie": "서울의 봄",
      "avgScreens": 1500
    }
  ],
  "seasonal": [
    {
      "period": "2024-봄",
      "totalSales": 450000000000,
      "totalAudience": 55000000,
      "movieCount": 85,
      "topMovie": "범죄도시4",
      "avgScreens": 1600
    }
  ]
}
```

| 필드       | 타입             | 설명                 |
| ---------- | ---------------- | -------------------- |
| `monthly`  | WeeklyTrendDto[] | 월별 트렌드 데이터   |
| `seasonal` | WeeklyTrendDto[] | 계절별 트렌드 데이터 |

**WeeklyTrendDto 필드**

| 필드            | 타입   | 설명                                      |
| --------------- | ------ | ----------------------------------------- |
| `period`        | String | 기간 (월: `"2024-01"`, 계절: `"2024-봄"`) |
| `totalSales`    | long   | 기간 총 매출액 (원)                       |
| `totalAudience` | long   | 기간 총 관객 수                           |
| `movieCount`    | int    | 기간 내 영화 수                           |
| `topMovie`      | String | 기간 내 1위 영화명                        |
| `avgScreens`    | long   | 평균 스크린 수                            |

---

### 2.6 파생 통계 조회

특정 날짜의 파생 통계(스크린당 관객 수, 상영회당 관객 수, 스크린 점유율 등)를 반환합니다.

| 항목       | 값                       |
| ---------- | ------------------------ |
| **Method** | `GET`                    |
| **URI**    | `/api/boxoffice/derived` |

| Query Parameter | 타입   | 필수 | 설명                                        |
| --------------- | ------ | ---- | ------------------------------------------- |
| `date`          | String | X    | 조회 날짜 (YYYY-MM-DD). 미지정 시 최근 날짜 |

**Response** `200 OK`

```json
[
  {
    "rank": 1,
    "movieNm": "범죄도시4",
    "openDt": "2024-04-24",
    "daysSinceRelease": 7,
    "audiCnt": 520000,
    "scrnCnt": 2100,
    "showCnt": 9500,
    "audiPerScreen": 247.6,
    "audiPerShow": 54.7,
    "screenShare": 42.5,
    "salesShare": 52.3
  }
]
```

| 필드               | 타입   | 설명                                   |
| ------------------ | ------ | -------------------------------------- |
| `rank`             | int    | 순위                                   |
| `movieNm`          | String | 영화명                                 |
| `openDt`           | String | 개봉일                                 |
| `daysSinceRelease` | int    | 개봉 후 경과일                         |
| `audiCnt`          | long   | 당일 관객 수                           |
| `scrnCnt`          | long   | 스크린 수                              |
| `showCnt`          | long   | 상영 횟수                              |
| `audiPerScreen`    | double | 스크린당 관객 수 (`audiCnt / scrnCnt`) |
| `audiPerShow`      | double | 상영회당 관객 수 (`audiCnt / showCnt`) |
| `screenShare`      | double | 스크린 점유율 (%)                      |
| `salesShare`       | double | 매출 점유율 (%)                        |

---

### 2.7 영화 추적 (주차별 추이)

특정 영화의 일자별 박스오피스 추이를 반환합니다.

| 항목       | 값                        |
| ---------- | ------------------------- |
| **Method** | `GET`                     |
| **URI**    | `/api/boxoffice/tracking` |

| Query Parameter | 타입   | 필수 | 설명                 |
| --------------- | ------ | ---- | -------------------- |
| `movieNm`       | String | O    | 영화명 (정확히 일치) |

**Response** `200 OK`

```json
[
  {
    "date": "2024-04-24",
    "daysSinceRelease": 0,
    "weekNumber": 1,
    "audiCnt": 520000,
    "audiAcc": 520000,
    "salesAmt": 4523000000,
    "salesAcc": 4523000000,
    "scrnCnt": 2100,
    "showCnt": 9500,
    "audiPerScreen": 247.6,
    "audiPerShow": 54.7
  }
]
```

| 필드               | 타입   | 설명                   |
| ------------------ | ------ | ---------------------- |
| `date`             | String | 기준 날짜 (YYYY-MM-DD) |
| `daysSinceRelease` | int    | 개봉 후 경과일         |
| `weekNumber`       | int    | 개봉 주차              |
| `audiCnt`          | long   | 당일 관객 수           |
| `audiAcc`          | long   | 누적 관객 수           |
| `salesAmt`         | long   | 당일 매출액 (원)       |
| `salesAcc`         | long   | 누적 매출액 (원)       |
| `scrnCnt`          | long   | 스크린 수              |
| `showCnt`          | long   | 상영 횟수              |
| `audiPerScreen`    | double | 스크린당 관객 수       |
| `audiPerShow`      | double | 상영회당 관객 수       |

**요청 예시**

```
GET /api/boxoffice/tracking?movieNm=범죄도시4
```

---

### 2.8 추적 가능 영화 목록

추적 가능한 영화 이름 목록을 반환합니다.

| 항목           | 값                               |
| -------------- | -------------------------------- |
| **Method**     | `GET`                            |
| **URI**        | `/api/boxoffice/tracking/movies` |
| **Parameters** | 없음                             |

**Response** `200 OK`

```json
["범죄도시4", "파묘", "서울의 봄"]
```

---

### 2.9 역대 흥행 순위

누적 관객 수 또는 누적 매출액 기준 역대 흥행 순위를 반환합니다.

| 항목       | 값                       |
| ---------- | ------------------------ |
| **Method** | `GET`                    |
| **URI**    | `/api/boxoffice/alltime` |

| Query Parameter | 타입   | 필수 | 기본값       | 설명                                                   |
| --------------- | ------ | ---- | ------------ | ------------------------------------------------------ |
| `sortBy`        | String | X    | `"audience"` | 정렬 기준: `"audience"` (관객 수) / `"sales"` (매출액) |
| `limit`         | int    | X    | `20`         | 조회 개수 (최대)                                       |

**Response** `200 OK`

```json
[
  {
    "rank": 1,
    "movieNm": "범죄도시4",
    "openDt": "2024-04-24",
    "maxAudiAcc": 10000000,
    "maxSalesAcc": 85000000000
  }
]
```

| 필드          | 타입   | 설명                  |
| ------------- | ------ | --------------------- |
| `rank`        | int    | 순위                  |
| `movieNm`     | String | 영화명                |
| `openDt`      | String | 개봉일                |
| `maxAudiAcc`  | long   | 최대 누적 관객 수     |
| `maxSalesAcc` | long   | 최대 누적 매출액 (원) |

**요청 예시**

```
GET /api/boxoffice/alltime?sortBy=sales&limit=10
```

---

## 3. KOFIC 데이터 관리 API

### 3.1 공통코드 조회

KOFIC 공통코드(장르, 국가 등)를 조회합니다.

| 항목       | 값                 |
| ---------- | ------------------ |
| **Method** | `GET`              |
| **URI**    | `/api/kobis/codes` |

| Query Parameter | 타입   | 필수 | 설명                           |
| --------------- | ------ | ---- | ------------------------------ |
| `comCode`       | String | O    | 코드 분류 (`"2105"` = 장르 등) |

**Response** `200 OK`

```json
[
  {
    "id": 1,
    "comCode": "2105",
    "fullCd": "01",
    "korNm": "액션"
  }
]
```

| 필드      | 타입   | 설명        |
| --------- | ------ | ----------- |
| `id`      | Long   | 레코드 ID   |
| `comCode` | String | 코드 분류   |
| `fullCd`  | String | 세부 코드   |
| `korNm`   | String | 코드 한글명 |

---

### 3.2 KOFIC 영화 목록 조회

수집된 KOFIC 영화 마스터 데이터 전체를 반환합니다.

| 항목           | 값                  |
| -------------- | ------------------- |
| **Method**     | `GET`               |
| **URI**        | `/api/kobis/movies` |
| **Parameters** | 없음                |

**Response** `200 OK`

```json
[
  {
    "movieCd": "20240001",
    "movieNm": "범죄도시4",
    "movieNmEn": "The Roundup: Punishment",
    "prdtYear": "2024",
    "openDt": "20240424",
    "typeNm": "장편",
    "prdtStatNm": "개봉",
    "nationAlt": "한국",
    "genreAlt": "액션,범죄",
    "showTm": 109,
    "directors": "허명행",
    "actors": "마동석,김무열,이동휘",
    "companys": "빅펀치픽쳐스",
    "watchGradeNm": "15세이상관람가"
  }
]
```

| 필드           | 타입    | 설명                      |
| -------------- | ------- | ------------------------- |
| `movieCd`      | String  | KOBIS 영화 코드 (PK)      |
| `movieNm`      | String  | 영화명 (한글)             |
| `movieNmEn`    | String  | 영화명 (영문)             |
| `prdtYear`     | String  | 제작 연도                 |
| `openDt`       | String  | 개봉일 (yyyyMMdd)         |
| `typeNm`       | String  | 유형 (장편, 단편 등)      |
| `prdtStatNm`   | String  | 제작 상태 (개봉, 기타 등) |
| `nationAlt`    | String  | 제작 국가                 |
| `genreAlt`     | String  | 장르 (쉼표 구분)          |
| `showTm`       | Integer | 상영 시간 (분)            |
| `directors`    | String  | 감독                      |
| `actors`       | String  | 출연 배우                 |
| `companys`     | String  | 제작사                    |
| `watchGradeNm` | String  | 관람 등급                 |

---

### 3.3 KOFIC 영화 상세 조회

KOBIS 영화 코드로 영화 상세정보를 조회합니다.

| 항목       | 값                            |
| ---------- | ----------------------------- |
| **Method** | `GET`                         |
| **URI**    | `/api/kobis/movies/{movieCd}` |

| Path Variable | 타입   | 설명            |
| ------------- | ------ | --------------- |
| `movieCd`     | String | KOBIS 영화 코드 |

**Response** `200 OK` — [KobisMovie 객체](#32-kofic-영화-목록-조회) (단일, 없으면 `null`)

---

### 3.4 KOFIC 데이터 수동 수집

KOFIC API에서 전체 데이터(일별/주간 박스오피스, 공통코드, 영화목록/상세)를 수동으로 수집합니다.

| 항목             | 값                   |
| ---------------- | -------------------- |
| **Method**       | `POST`               |
| **URI**          | `/api/kobis/collect` |
| **Request Body** | 없음                 |

**Response** `200 OK`

```json
{
  "daily": 10,
  "weekly": 10,
  "codes": 150,
  "movies": 50
}
```

각 항목은 수집된 건수를 나타냅니다.

---

## 4. AI 코멘터리 API

### 4.1 AI 분석 코멘터리 생성

박스오피스 데이터를 기반으로 로컬 LLM(Ollama)이 자연어 분석 코멘터리를 생성합니다.

| 항목       | 값                   |
| ---------- | -------------------- |
| **Method** | `POST`               |
| **URI**    | `/api/ai/commentary` |

**Request Body**

```json
{
  "type": "daily",
  "date": "2024-05-01",
  "showRange": null,
  "chartFocus": "ranking",
  "entries": [
    {
      "rank": 1,
      "movieNm": "범죄도시4",
      "audiCnt": 520000,
      "salesAmt": 4523000000
    }
  ],
  "monthly": null,
  "seasonal": null
}
```

| 필드         | 타입     | 필수   | 설명                                                                    |
| ------------ | -------- | ------ | ----------------------------------------------------------------------- |
| `type`       | String   | O      | 분석 유형: `"daily"`, `"weekly"`, `"weekend"`, `"trend"`                |
| `date`       | String   | 조건부 | 일별 분석 시 기준 날짜 (YYYY-MM-DD)                                     |
| `showRange`  | String   | 조건부 | 주간/주말 분석 시 기간 (yyyyMMdd~yyyyMMdd)                              |
| `chartFocus` | String   | X      | 차트 초점: `null`, `"ranking"`, `"sales"`, `"audience"`                 |
| `entries`    | Object[] | 조건부 | 일별/주간 순위 데이터 (type이 `"daily"`, `"weekly"`, `"weekend"` 일 때) |
| `monthly`    | Object[] | 조건부 | 월별 트렌드 데이터 (type이 `"trend"` 일 때)                             |
| `seasonal`   | Object[] | 조건부 | 계절별 트렌드 데이터 (type이 `"trend"` 일 때)                           |

**Response** `200 OK` — 성공

```json
{
  "text": "오늘 박스오피스 1위는 '범죄도시4'로, 52만 명의 관객을 동원하며 압도적인 1위를 기록했습니다..."
}
```

**Response** `500 Internal Server Error` — AI 분석 실패

```json
{
  "error": "AI 분석을 가져오지 못했습니다."
}
```

---

## 5. 배틀 게임 API

### 5.1 배틀 영화 풀 조회

배틀 게임에 사용할 영화 풀을 반환합니다. 영화별로 누적 관객 수가 가장 높은 데이터 하나씩을 추출합니다.

| 항목           | 값                 |
| -------------- | ------------------ |
| **Method**     | `GET`              |
| **URI**        | `/api/battle/pool` |
| **Parameters** | 없음               |

**Response** `200 OK`

```json
[
  {
    "movieNm": "범죄도시4",
    "openDt": "2024-04-24",
    "audiAcc": 10000000,
    "salesAcc": 85000000000,
    "scrnCnt": 2300
  }
]
```

| 필드       | 타입   | 설명             |
| ---------- | ------ | ---------------- |
| `movieNm`  | String | 영화명           |
| `openDt`   | String | 개봉일           |
| `audiAcc`  | long   | 누적 관객 수     |
| `salesAcc` | long   | 누적 매출액 (원) |
| `scrnCnt`  | long   | 스크린 수        |

---

## 6. 게시판 API

> 게시판 API는 영화 데이터의 CRUD 관리를 위한 관리자용 엔드포인트입니다.  
> `@NoDoubleSubmit` 어노테이션이 적용된 엔드포인트는 중복 제출이 방지됩니다.

### 6.1 영화 목록 / 검색

전체 영화 목록을 조회하거나 키워드로 검색합니다.

| 항목       | 값       |
| ---------- | -------- |
| **Method** | `GET`    |
| **URI**    | `/board` |

| Query Parameter | 타입   | 필수 | 설명                             |
| --------------- | ------ | ---- | -------------------------------- |
| `keyword`       | String | X    | 검색 키워드. 미지정 시 전체 조회 |

**Response** `200 OK` — [TmdbMovie 객체](#11-전체-영화-목록-조회) 배열

**요청 예시**

```
GET /board?keyword=인터스텔라
```

---

### 6.2 영화 상세 조회

| 항목       | 값            |
| ---------- | ------------- |
| **Method** | `GET`         |
| **URI**    | `/board/{id}` |

| Path Variable | 타입 | 설명         |
| ------------- | ---- | ------------ |
| `id`          | Long | TMDB 영화 ID |

**Response** `200 OK` — [TmdbMovie 객체](#11-전체-영화-목록-조회) (단일)

---

### 6.3 영화 추가

새 영화를 등록합니다. (중복 제출 방지 적용)

| 항목       | 값           |
| ---------- | ------------ |
| **Method** | `POST`       |
| **URI**    | `/board/add` |

**Request Body**

```json
{
  "id": 12345,
  "title": "새 영화",
  "original_title": "New Movie",
  "overview": "영화 줄거리...",
  "release_date": "2024-06-01",
  "vote_average": 7.5,
  "vote_count": 100,
  "popularity": 50.0,
  "poster_path": "/poster.jpg",
  "backdrop_path": "/backdrop.jpg",
  "genres": ["액션", "드라마"]
}
```

**Response** `200 OK`

```
"Success"
```

---

### 6.4 영화 수정

기존 영화 정보를 수정합니다. (중복 제출 방지 적용)

| 항목       | 값                 |
| ---------- | ------------------ |
| **Method** | `POST`             |
| **URI**    | `/board/edit/{id}` |

| Path Variable | 타입 | 설명           |
| ------------- | ---- | -------------- |
| `id`          | Long | 수정할 영화 ID |

**Request Body** — [6.3 영화 추가](#63-영화-추가)와 동일 (id 필드는 Path Variable로 덮어씀)

**Response** `200 OK`

```
"Success"
```

---

### 6.5 영화 삭제

영화를 삭제합니다.

| 항목       | 값                   |
| ---------- | -------------------- |
| **Method** | `POST`               |
| **URI**    | `/board/delete/{id}` |

| Path Variable | 타입 | 설명           |
| ------------- | ---- | -------------- |
| `id`          | Long | 삭제할 영화 ID |

**Response** `200 OK`

```
"Success"
```

---

## 부록: 에러 응답

API는 별도의 글로벌 에러 핸들러를 정의하지 않으며, Spring Boot 기본 에러 응답을 따릅니다.

| HTTP Status                 | 설명                             |
| --------------------------- | -------------------------------- |
| `200 OK`                    | 정상 처리                        |
| `404 Not Found`             | 리소스 없음                      |
| `500 Internal Server Error` | 서버 내부 오류 (AI 분석 실패 등) |

---

## 부록: 외부 이미지 URL 구성

TMDB 이미지 경로는 아래 Base URL을 접두사로 붙여 사용합니다.

| 용도                 | URL 패턴                                             |
| -------------------- | ---------------------------------------------------- |
| 포스터 (작은 사이즈) | `https://image.tmdb.org/t/p/w500{poster_path}`       |
| 포스터 (원본)        | `https://image.tmdb.org/t/p/original{poster_path}`   |
| 배경 이미지          | `https://image.tmdb.org/t/p/original{backdrop_path}` |
