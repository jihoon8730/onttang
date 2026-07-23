from html import escape

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from models import Base
from database import engine
from routers import attractions, auth, stamps, me, markers, rankings
import legal_content

Base.metadata.create_all(bind=engine)
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "온땅 백엔드 작동 중"}


# 카카오 로그인 브리지: 카카오는 redirect_uri로 http(s)만 허용하므로,
# 이 https 페이지가 인가코드를 받아 앱 스킴(onttang://)으로 넘겨준다.
# dev/prod 공용 — 카카오 콘솔엔 이 URL 하나만 등록하면 됨.
KAKAO_BRIDGE_HTML = """<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script>
      location.replace("onttang://oauth/kakao" + location.search);
    </script>
  </head>
  <body>로그인 처리 중..</body>
</html>"""


@app.get("/kakao-bridge.html", response_class=HTMLResponse)
def kakao_bridge():
    return KAKAO_BRIDGE_HTML


# 스토어 제출용 공개 법적 페이지 (App Store·Google Play가 요구하는 공개 URL).
# 내용은 legal_content.py에 있고, 앱 내부 화면(src/app/legal.tsx)과 동일하게 유지한다.
def _legal_page(title: str, body: str) -> str:
    return f"""<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>온땅 — {escape(title)}</title>
    <style>
      body {{
        margin: 0; padding: 32px 20px 64px; background: #ffffff; color: #22271f;
        font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
          "Pretendard", "Malgun Gothic", "Segoe UI", sans-serif;
        line-height: 1.7; max-width: 720px; margin-left: auto; margin-right: auto;
      }}
      h1 {{ font-size: 22px; font-weight: 800; margin: 0 0 24px; color: #1F5B3D; }}
      pre {{
        white-space: pre-wrap; word-break: keep-all; font-family: inherit;
        font-size: 15px; margin: 0;
      }}
      footer {{ margin-top: 40px; color: #8c948a; font-size: 12.5px; }}
    </style>
  </head>
  <body>
    <h1>{escape(title)}</h1>
    <pre>{escape(body)}</pre>
    <footer>시행일: {escape(legal_content.EFFECTIVE_DATE)}</footer>
  </body>
</html>"""


@app.get("/privacy", response_class=HTMLResponse)
def privacy_policy():
    return _legal_page("개인정보처리방침", legal_content.PRIVACY)


@app.get("/terms", response_class=HTMLResponse)
def terms_of_service():
    return _legal_page("이용약관", legal_content.TERMS)


app.include_router(attractions.router)
app.include_router(auth.router)
app.include_router(stamps.router)
app.include_router(me.router)
app.include_router(markers.router)
app.include_router(rankings.router)