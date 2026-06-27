# 트러블슈팅 & 변경 기록

> 작성일: 2026-06-22
> 범위: AI 분석(Ollama 전환) 도입, 코드 품질(ESLint/TS) 정리, DB 중복 정리, 같은 네트워크(LAN) 공유 설정

---

## 1. AI 분석: Gemini → Ollama(Qwen) 로컬 모델 전환

### 배경

Gemini API가 프로젝트 `gen-lang-client-...`의 무료 등급 할당량이 `limit: 0`으로 잡혀 있어 **429(Too Many Requests)** 가 계속 발생. 할당량 자체가 프로비저닝되지 않은 프로젝트 설정 문제라 코드로는 해결 불가 → 로컬 Ollama 모델로 전환.

### 변경

- **모델 선택**: VRAM 8GB 환경 기준으로 `qwen3.5:4b`(약 3.4GB) 채택. (9b/gemma4:e2b는 8GB에 빠듯하거나 CPU 오프로드로 느려짐)
- **`GeminiService.java`**: 호출 대상을 Gemini REST → `POST http://localhost:11434/api/generate` 로 변경.
  - 요청: `{ model, prompt, stream:false, think:false, options:{ num_predict:300, temperature:0.6 } }`
- **`GeminiResponseDto.java`**: Ollama 응답 구조(`{ model, response, done }`)에 맞게 재정의.
- **프론트 라벨**: `AiCommentaryCard.tsx`의 `Gemini` → `Qwen3.5 4B`.

### 발생한 문제와 해결

| 증상                             | 원인                                                          | 해결                                                                                                                                      |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 분석 중 표시 후 텍스트가 안 나옴 | Qwen은 thinking 모델이라 응답이 `<think>...</think>`만 채워짐 | 요청에 **`think: false`** 추가 + `<think>` 태그 제거 후처리                                                                               |
| 한자(漢字)가 간혹 섞여 출력      | Qwen이 중국 모델이라 한자로 새는 토큰 발생                    | ① 프롬프트에 "순수 한글만, 한자 금지" 규칙 강화 ② temperature 0.85→0.6 ③ 응답에서 **CJK 한자 영역(`一-鿿` 등) 제거 후처리**(`stripHanja`) |

> 참고: 백엔드는 AI 호출 **성공 시 로그를 남기지 않음**. "콘솔에 아무것도 안 찍힘"은 실패가 아니라 정상 동작일 수 있음. 실패 시에만 `Ollama API 호출 실패` 등 로그가 남음.

---

## 2. 차트별 On-demand AI 분석 버튼

### 구조

- **`useOnDemandAi.ts`**: 버튼 클릭 시에만 1회 호출하는 훅(중복 호출 방지 `inflightRef`).
- **`ChartAiWrapper.tsx`**: 차트 우측에 AI 패널을 슬라이드로 띄우는 래퍼. 하단 "✦ AI 분석 요청" 버튼 + ✕ 닫기.
- **`chartFocus`**(`ranking`/`sales`/`audience`): 차트 종류별로 프롬프트를 다르게 생성 → 매출 차트는 매출 얘기만, 관객 차트는 관객 얘기만.
- 탭 상단의 전체 AI 분석 카드(`AiCommentaryCard`)는 유지.

### 추가 결정

- **순위 탭에서는 차트별 버튼 제거** — 상단 전체 분석으로 충분. (`KoficRankingTab`, `KoficWeeklyRankingTab`에서 `ChartAiWrapper` 제거)

---

## 3. 코드 품질 정리 (ESLint "빨간 줄")

`npx eslint`에서 16건의 에러. 모두 동작에는 영향 없으나 IDE에 빨갛게 표시됨.

| 규칙                                   | 건수 | 해결                                                                                                                          |
| -------------------------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------- |
| `react-hooks/set-state-in-effect`      | 11   | 데이터 패칭 effect를 **async 함수 + 취소 플래그(`cancelled`)** 패턴으로 변경. (부수효과로 빠른 입력 시 race condition도 방지) |
| `react-refresh/only-export-components` | 4    | Nav 컴포넌트가 같이 export하던 날짜 헬퍼를 **`koficDate.ts`** 유틸 파일로 분리                                                |
| `react-hooks/exhaustive-deps`          | 1    | `DashboardPage`의 연도 자동확장 로직을 effect → **렌더 중 조정 패턴**(React 권장)으로 교체. 함수형 setState로 deps 의존 제거  |

부수 정리: `KoficWeeklyNav`에서 `monday` prop과 항상 같던 중복 `pickerDate` state + 동기화 effect 제거.

---

## 4. TypeScript 에러 (중요: 검사 명령어 함정)

### 핵심 교훈

이 프로젝트의 루트 `tsconfig.json`은 `files: []` + references 구조라 **`npx tsc --noEmit`은 아무것도 검사하지 않음**(no-op). Vite 개발 서버도 esbuild라 타입 검사를 건너뜀. 그래서 타입 에러가 IDE(`tsconfig.app.json`)에서만 빨갛게 보이고 숨어 있었음.

> ✅ 올바른 타입 검사: **`npx tsc -b`** (또는 `npx tsc -p tsconfig.app.json`)

### 수정한 에러

| 에러                                                         | 원인                                               | 해결                                                            |
| ------------------------------------------------------------ | -------------------------------------------------- | --------------------------------------------------------------- |
| `Property 'audi_acc' does not exist on type 'Movie'` 등      | `Movie` 타입에 KOBIS 조인 필드 미선언              | `movie.ts`에 `audi_acc?`, `sales_acc?`, `scrn_cnt?` 옵셔널 추가 |
| recharts `formatter={(v: number) => ...}` 타입 불일치 (24곳) | recharts가 value를 `ValueType \| undefined`로 전달 | `(v) => ... Number(v) ...` 로 통일 (출력 동일, import 불필요)   |

---

## 5. cSpell 맞춤법 경고 (빨간 줄이지만 에러 아님)

`audiAcc`, `kobisMovies`, `scrnCnt` 같은 식별자의 일부(`audi`, `kobis`, `scrn`)에 빨간 줄 → **Code Spell Checker** 확장의 맞춤법 경고. TS/ESLint 에러 아님.

- **`.vscode/settings.json`**의 `cSpell.words`에 도메인 용어 등록 (`audi`, `acc`, `kobis`, `kofic`, `tmdb`, `recharts`, `pknu`, `prdt` 등). camelCase는 토큰으로 쪼개져 검사되므로 기본 토큰만 등록하면 됨.
- 새 용어가 또 뜨면: 빨간 줄 → 💡 전구 → "Add to workspace dictionary".

---

## 6. 박스오피스 중복 행 (DB)

### 증상

파생통계 탭에서 `Encountered two children with the same key, '1'` 등 React key 중복 경고. **최신 일자(6/21)에서만** 발생.

### 원인

6/21에 일별 수집이 두 번 실행(스케줄러 2시 + on-demand 조회 수집 경쟁)되어 `(date, rank)` 중복 행이 DB에 저장됨.

### 해결 (3중)

1. **프론트 dedup**: `useDerivedStats`에서 rank 기준 중복 제거 (`useBoxOffice`와 동일 패턴).
2. **백엔드 가드**: `collectDailySingle`/`collectMovieList` 시작부에 존재 체크(이미 적용됨), `backfillOnStartup`의 `@Transactional` 제거(거대 단일 트랜잭션 롤백으로 재수집 반복되던 문제).
3. **DB 정리 + 제약**:

   ```sql
   -- 중복 제거 (id 작은 것만 남김)
   DELETE d1 FROM daily_box_office d1
   JOIN daily_box_office d2
     ON d1.`date`=d2.`date` AND d1.`rank`=d2.`rank` AND d1.id>d2.id;
   DELETE w1 FROM weekly_box_office w1
   JOIN weekly_box_office w2
     ON w1.show_range=w2.show_range AND w1.week_gb=w2.week_gb AND w1.`rank`=w2.`rank` AND w1.id>w2.id;

   -- 재발 방지 유니크 제약
   ALTER TABLE daily_box_office  ADD CONSTRAINT uk_daily_date_rank      UNIQUE (`date`,`rank`);
   ALTER TABLE weekly_box_office ADD CONSTRAINT uk_weekly_range_gb_rank UNIQUE (show_range,week_gb,`rank`);
   ```

   - 결과: daily 11그룹·weekly 110그룹 중복 제거.
   - ⚠️ DB를 drop 후 재생성하면 제약이 사라짐 → 위 `ALTER` 두 줄 재실행 필요.
   - JPA 엔티티에는 `@UniqueConstraint`를 **추가하지 않음**: `date`/`rank`가 예약어라 백틱 매핑돼 있어 `ddl-auto=update`가 DDL 에러를 낼 위험이 있기 때문. (DB 레벨 제약으로 충분)

---

## 7. 같은 네트워크(LAN)에서 다른 PC 접속

목표: 호스트 PC의 IP(`210.119.14.73`)로 다른 PC에서 대시보드 접속.

### 채택한 구조: Vite 프록시 + 상대경로

브라우저는 **Vite(3000) 한 포트만** 접속하고, Vite가 내부에서 백엔드(8080)로 프록시. → 백엔드 포트 개방 불필요, CORS 불필요.

### 변경

- **API 호출 전부 상대경로(`/api/...`)로 변경**: 기존 `http://localhost:8080` 하드코딩 제거. (`api/*.ts`, `SearchTab`, `BattlePage`)
  - ⚠️ `trends.ts` 가 누락됐다가 CORS 에러로 뒤늦게 발견 → 동일 수정.
- **`vite.config.ts`**:
  ```ts
  server: {
    host: true,          // 0.0.0.0 바인딩 (외부 PC 접속 허용)
    port: 3000,          // (5173이 막히는 환경이라 변경)
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://127.0.0.1:8080",  // localhost 대신 127.0.0.1 (IPv6 ::1 혼선 방지)
        changeOrigin: true,
        timeout: 180000, proxyTimeout: 180000,  // AI(Ollama) 긴 응답 대비
        configure: (proxy) => {                 // 백엔드 @CrossOrigin 403 회피
          proxy.on("proxyReq", (proxyReq) => proxyReq.removeHeader("origin"));
        },
      },
    },
  },
  ```

### 발생한 문제와 해결

| 증상                                                             | 원인                                                                                           | 해결                                                                                       |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| AI만 "분석 결과 못 가져옴"                                       | AI 호출을 상대경로로 바꾸기 전 옛 코드가 `:8080` 직접 호출 → 포트/IP가 5173이 아니라 CORS 차단 | API 상대경로화 + 브라우저 하드 새로고침                                                    |
| `ECONNREFUSED` (proxy error)                                     | 그 순간 백엔드가 미실행/재시작 중, 또는 `localhost`의 IPv6(`::1`) 우선 해석                    | 프록시 target을 `127.0.0.1`로 고정 + 백엔드 실행 확인                                      |
| `weekly/trends` **CORS / "more-private address space loopback"** | `trends.ts`가 상대경로 변경에서 누락되어 `:8080` 직접 호출 (크롬 Private Network Access 차단)  | `trends.ts` 상대경로화                                                                     |
| `POST /api/ai/commentary` **403 Forbidden**                      | 프록시가 전달한 `Origin` 헤더를 백엔드 `@CrossOrigin("http://localhost:5173")`이 거부          | 프록시에서 **Origin 헤더 제거**(`removeHeader("origin")`) → Spring이 비-CORS 요청으로 처리 |

### 실행 절차 (호스트 PC)

1. 백엔드 실행(8080), Ollama 실행(11434).
2. `npm run dev` → 콘솔의 `Network: http://210.119.14.73:3000/` 확인.
3. Windows 방화벽 인바운드 허용:
   ```powershell
   New-NetFirewallRule -DisplayName "Vite Dev 3000" -Direction Inbound -LocalPort 3000 -Protocol TCP -Action Allow
   ```
4. 다른 PC 브라우저: `http://210.119.14.73:3000`

### 주의

- 두 PC가 **같은 서브넷**이어야 하고, 학교/회사망의 **AP 격리(클라이언트 격리)** 가 켜져 있으면 IP가 맞아도 접속 불가.
- `vite.config.ts` 변경 시 **Vite 재시작** 필요. 옛 번들 캐시 의심되면 브라우저 **하드 새로고침(Ctrl+Shift+R)**.
- 이 구조는 **개발 서버(프록시)** 전제. 프로덕션 빌드로 정적 서빙하면 프록시가 없으므로 별도 설정 필요.

---

## 부록: 자주 쓰는 검증 명령

```bash
# 타입 검사 (반드시 -b 사용; --noEmit는 이 프로젝트에서 no-op)
npx tsc -b

# 린트
npx eslint src --ext .ts,.tsx

# Ollama 동작 확인
curl http://localhost:11434/api/tags

# 백엔드 AI 엔드포인트 직접 호출 (프론트/프록시 우회)
curl -H "Content-Type: application/json" \
  -d '{"type":"daily","date":"2026-06-21","chartFocus":"sales","entries":[{"rank":1,"movieNm":"테스트","audiCnt":100000,"audiAcc":500000,"salesShare":45.5,"salesAmt":900000000}]}' \
  http://localhost:8080/api/ai/commentary
```
