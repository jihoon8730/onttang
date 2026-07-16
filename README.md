# 온땅 (Onttang) 🚩

> **전국의 땅을 모두 내 영지로** — 한국관광공사 TourAPI 기반 **관광지 탐험 + 개인 점령(방문 스탬프)** 풀스택 모바일 앱

관광지를 지도·리스트로 탐험하고, 실제로 방문해 스탬프를 찍어 나의 전국 정복 현황을 모아가는 앱입니다. 프론트엔드(모바일) 포트폴리오 겸 관광데이터 활용 프로젝트로 만들고 있어요.

자세한 기획·로드맵은 **[온땅 PRD](./onttang_PRD_v1.md)** 참고.

---

## 스택

| 영역 | 기술 |
|---|---|
| 앱 | React Native 0.85 · **Expo SDK 56** · TypeScript · Expo Router(파일 기반) |
| 지도 | `@mj-studio/react-native-naver-map` |
| 리스트 | `@shopify/flash-list` (가상화) · `@gorhom/bottom-sheet` |
| 상태 | `@tanstack/react-query`(서버) · `zustand`(클라) |
| 상세 UI | `expo-image` · `react-native-reanimated-carousel` · `expo-glass-effect` |
| 백엔드 | FastAPI(Python) · uv · SQLAlchemy |
| DB | PostgreSQL |
| 데이터 | 한국관광공사 TourAPI (KorService2) |

---

## 프로젝트 구조

```
onttang/
├─ src/
│  ├─ app/                      # Expo Router 화면 (파일 기반 라우팅)
│  │  ├─ (tabs)/index.tsx       #  탐험: 지도 + 바텀시트 + 검색/카테고리
│  │  ├─ (tabs)/territory.tsx   #  내 영토 (준비 중)
│  │  └─ attraction/[id].tsx    #  관광지 상세
│  ├─ components/               # 마커·리스트 아이템
│  ├─ constants/                # 디자인 토큰(theme)·API URL
│  ├─ lib/                      # api 클라이언트·유틸
│  ├─ stores/                   # zustand (검색·카테고리 필터)
│  └─ types/                    # 타입 정의
├─ server/                      # FastAPI 백엔드 (별도 실행) → server/README.md
├─ app.config.ts                # Expo 설정
├─ onttang_PRD_v1.md            # 제품 요구사항 문서
└─ RUNNING.md                   # 앱 실행 가이드(터널·시뮬·실기기)
```

---

## 실행

앱과 백엔드는 **별도로** 띄웁니다.

### 1) 백엔드 (관광지 API)
```bash
cd server
uv sync
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
자세히는 [`server/README.md`](./server/README.md).

### 2) 앱
```bash
npm install
npm start          # 같은 와이파이(시뮬레이터·LAN)
# 또는
npm run dev:tunnel # 다른 네트워크(터널)
```
- 네이티브 모듈(네이버 지도 등)을 써서 **Expo Go로는 안 되고**, 개발 빌드(dev client)로 붙어야 합니다.
- 시뮬레이터/실기기 빌드·접속 방법은 [`RUNNING.md`](./RUNNING.md).

> `src/constants/config.ts`의 `API_URL`은 접속 환경에 맞춰야 합니다 — 시뮬레이터 `localhost`, Android 에뮬 `10.0.2.2`, 실기기 `http://<맥-LAN-IP>:8000`.

---

## 현재 상태 (2026-07-16)

- ✅ **Stage 1 완료** — 탐험 대시보드: 지도-리스트 양방향 연동, FlashList 가상화, 바텀시트, 검색·카테고리 필터, 관광지 상세.
- 🔜 **Stage 2 예정** — 방문 스탬프(GPS) + 내 영토 대시보드 + 인증.
- ⏸ **로그인 보류** — 소셜 로그인을 여러 방식으로 시도 후 전면 제거, 방식 재설계 대기 (PRD §16).

---

## 환경변수

- `server/.env` — `tour_api_key`, `database_url`
- 루트 `.env` — `NAVER_MAP_CLIENT_ID` 등 (Expo `app.config.ts`에서 로드)
- `.env` 파일은 커밋하지 않습니다.
