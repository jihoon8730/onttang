# 서버 실행 가이드

온땅 백엔드 서버(FastAPI + uv) 실행 명령어 모음입니다.
모든 명령어는 `server` 폴더 안에서 실행합니다.

```bash
cd server
```

## 1. 의존성 설치

```bash
uv sync
```

## 2. 서버 실행

```bash
# 개발 모드 (코드 저장 시 자동 재시작)
uv run uvicorn main:app --reload

# 외부 기기(에뮬레이터·실기기)에서 접속할 때
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## 3. 동작 확인

| 주소 | 설명 |
| --- | --- |
| http://127.0.0.1:8000 | 루트 (`{"message": "온땅 백엔드 작동 중"}`) |
| http://127.0.0.1:8000/docs | Swagger UI (API 문서) |
| http://127.0.0.1:8000/redoc | ReDoc (API 문서) |

---

### 참고

- 실행 전 `server/.env` 에 환경변수가 있어야 합니다.
  ```env
  tour_api_key=...     # 관광공사 TourAPI 키
  database_url=...     # PostgreSQL 연결 문자열
  ```
- 앱에서 서버에 접속할 때 주소:
  - **iOS 시뮬레이터** → `http://127.0.0.1:8000`
  - **Android 에뮬레이터** → `http://10.0.2.2:8000`
  - **실기기(iOS/Android)** → `http://<내-PC-IP>:8000` (예: `192.168.0.x`)
