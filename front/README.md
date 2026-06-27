# 🎬 CineStats — 영화 데이터 시각화 대시보드

TMDB 기반 영화 데이터를 시각화하는 웹 대시보드입니다.  
백엔드 팀원이 제공하는 REST API와 연동하거나, 내장 Mock 데이터로 바로 실행할 수 있습니다.

## 기술 스택

- **React + Vite + TypeScript**
- **Tailwind CSS** — 다크/라이트 테마 지원
- **Recharts** — 차트 시각화
- **Motion** — 애니메이션 (구 Framer Motion)

## 시작하기

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

## 백엔드 API 연동

팀원의 백엔드가 준비되면 `.env.example`을 복사해서 `.env`를 만들고 URL을 입력하세요.

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:8000
```

API가 없으면 자동으로 `public/mockMovies.json`의 100편 Mock 데이터를 사용합니다.

## API 스펙 (팀원과 합의)

`GET /api/movies` 응답 형식:

```json
[
  {
    "id": 550,
    "title": "Fight Club",
    "release_date": "1999-10-15",
    "vote_average": 8.4,
    "popularity": 61.4,
    "revenue": 37023395,
    "genres": ["Drama", "Thriller"],
    "poster_path": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"
  }
]
```

> `poster_path`는 TMDB 이미지 URL(`https://image.tmdb.org/t/p/w342`) 또는 절대 URL 모두 지원합니다.

## 주요 기능

| 탭 | 내용 |
|---|---|
| 🏆 랭킹 | 포스터 카드 그리드, 순위 뱃지, 평점 % 표시 |
| 🎭 장르 | 장르별 영화 수 / 평균 평점 바 차트 |
| 📈 트렌드 | 연도별 개봉작 수 + 평균 평점 복합 차트 |
| 🔬 분석 | 평점 vs 인기도 산점도 + Top N 수평 바 차트 |

- 연도 범위, 장르 멀티 필터, 정렬 기준, Top N 설정
- 다크 / 라이트 테마 전환 (선택값 저장)

## 빌드

```bash
npm run build
```
