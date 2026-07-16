# 온땅 백엔드 (FastAPI)

온땅 앱의 관광지 데이터 서버입니다. 한국관광공사 **TourAPI(KorService2)**를 프록시·캐싱하고, 추천 관광지를 PostgreSQL에서 제공합니다.

> 실행 명령어는 [`RUNNING.md`](./RUNNING.md) 참고.

---

## 왜 백엔드가 필요한가

1. **TourAPI 키 보호 + 호출 절감** — 앱이 직접 부르지 않고 서버가 프록시·캐싱.
2. **데이터 영속화** — 큐레이션한 추천 관광지를 DB에 저장.
3. **집계·인증 확장 기반** — 향후 스탬프 집계(SQL)·인증을 서버에서 처리(Stage 2 예정).

---

## 스택

- **FastAPI** + **uv**(패키지·실행)
- **SQLAlchemy** ORM
- **PostgreSQL**
- **httpx** (TourAPI 호출)

---

## 구조

```
server/
├─ main.py                 # FastAPI 앱 + 라우터 등록
├─ config.py               # 환경변수(Settings): tour_api_key, database_url
├─ database.py             # SQLAlchemy engine / SessionLocal
├─ models.py               # ORM 모델 (Attraction)
├─ schemas.py              # 응답 스키마 (AttractionOut, AttractionDetailOut)
├─ constants.py            # 분류코드 → 한글 카테고리 라벨
├─ routers/attractions.py  # 관광지 엔드포인트
└─ services/tour_api.py    # TourAPI 호출 로직
```

---

## API

| Method | Endpoint | 설명 |
|---|---|---|
| GET | `/` | 헬스체크 |
| GET | `/attractions` | TourAPI 라이브 목록 (`ldong_regn_cd`, `page`) |
| GET | `/attractions/db` | 추천(`is_featured`) 관광지 DB 조회 |
| POST | `/attractions/sync` | TourAPI → DB 적재(upsert). 인자 없으면 17개 시도 전체 |
| GET | `/attractions/{content_id}` | TourAPI 라이브 상세(운영정보·이미지) |

> Swagger UI: `http://127.0.0.1:8000/docs`

---

## 데이터 모델 (`attractions`)

`content_id`(PK) · `title` · `address` · `latitude`/`longitude` · `area_code` · `image_url` · `lcls_systm1/2/3`(TourAPI 분류코드) · `is_featured`(추천 큐레이션 플래그).

카테고리 라벨(`constants.py`): `NA`→자연 · `HS`→역사 · `EX`→거리 · `VE`→명소.

---

## 환경변수 (`server/.env`)

```env
tour_api_key=...     # 관광공사 TourAPI 키
database_url=...     # PostgreSQL 연결 문자열
```

> `config.py`의 Settings는 `extra="ignore"`라, 위 두 값 외 다른 변수(예: 향후 인증용)가 `.env`에 있어도 무시하고 기동합니다.

---

## 예정 (Stage 2)

- `stamps` 테이블 + 스탬프 CRUD (GPS 반경 검증)
- 정복 현황 집계 API
- 인증(방식 재설계 대기 — 루트 PRD §16)
