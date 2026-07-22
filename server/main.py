from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from models import Base
from database import engine
from routers import attractions, auth, stamps, me, markers, rankings

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


app.include_router(attractions.router)
app.include_router(auth.router)
app.include_router(stamps.router)
app.include_router(me.router)
app.include_router(markers.router)
app.include_router(rankings.router)