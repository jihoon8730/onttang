from html import escape

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from models import Base
from database import engine
from routers import attractions, auth, stamps, me, markers, rankings, coupons
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


# 계정 삭제 안내 페이지 — Google Play 정책: 앱 미설치 상태에서도 계정 삭제를
# 요청할 수 있는 공개 URL이 필요함. 실제 삭제 로직은 services/auth.py
# delete_user()와 동일(스탬프 전체 + 계정 정보 즉시·영구 삭제, 복구 불가).
SUPPORT_EMAIL = "rec8730@gmail.com"

DELETE_ACCOUNT_HTML = f"""<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>온땅 — 계정 삭제</title>
    <style>
      body {{
        margin: 0; padding: 32px 20px 64px; background: #ffffff; color: #22271f;
        font-family: -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo",
          "Pretendard", "Malgun Gothic", "Segoe UI", sans-serif;
        line-height: 1.7; max-width: 720px; margin-left: auto; margin-right: auto;
      }}
      h1 {{ font-size: 22px; font-weight: 800; margin: 0 0 24px; color: #1F5B3D; }}
      h2 {{ font-size: 16px; font-weight: 800; margin: 28px 0 10px; color: #22271f; }}
      p, li {{ font-size: 15px; }}
      ul {{ padding-left: 20px; margin: 8px 0; }}
      .box {{
        background: #E6F1EA; border-radius: 12px; padding: 16px 18px; margin: 10px 0;
      }}
      a.btn {{
        display: inline-block; margin-top: 8px; background: #2F7A55; color: #fff;
        text-decoration: none; font-weight: 700; padding: 10px 18px; border-radius: 10px;
      }}
      footer {{ margin-top: 40px; color: #8c948a; font-size: 12.5px; }}
    </style>
  </head>
  <body>
    <h1>계정 삭제</h1>
    <p>온땅 계정과 관련 데이터를 삭제하는 방법을 안내합니다. 앱을 설치하지 않은 경우에도 이메일로 삭제를 요청할 수 있습니다.</p>

    <h2>방법 1 — 앱에서 바로 삭제 (즉시 처리)</h2>
    <p>온땅 앱 → <strong>더보기</strong> 탭 → 프로필 화면 하단 <strong>회원 탈퇴</strong>를 눌러 진행하세요. 확인 즉시 처리됩니다.</p>

    <h2>방법 2 — 이메일로 요청 (앱 미설치 시)</h2>
    <div class="box">
      <p style="margin:0 0 6px">가입 시 사용한 카카오/애플 계정의 닉네임을 적어 아래 메일로 보내주세요.</p>
      <a class="btn" href="mailto:{SUPPORT_EMAIL}?subject=계정%20삭제%20요청">{SUPPORT_EMAIL} 로 메일 보내기</a>
    </div>
    <p>요청 확인 후 <strong>영업일 기준 7일 이내</strong>에 삭제 처리됩니다.</p>

    <h2>삭제되는 데이터</h2>
    <ul>
      <li>계정 정보 (닉네임, 프로필 사진, 로그인 식별자)</li>
      <li>스탬프 방문 기록 전체 및 탐험 통계</li>
    </ul>
    <p>삭제된 데이터는 <strong>즉시 영구적으로 제거</strong>되며 복구할 수 없습니다. 관광지 정보 등 개인과 무관한 데이터는 영향받지 않습니다.</p>

    <footer>문의: {SUPPORT_EMAIL}</footer>
  </body>
</html>"""


@app.get("/delete-account", response_class=HTMLResponse)
def delete_account_page():
    return DELETE_ACCOUNT_HTML


app.include_router(attractions.router)
app.include_router(auth.router)
app.include_router(stamps.router)
app.include_router(me.router)
app.include_router(markers.router)
app.include_router(rankings.router)
app.include_router(coupons.router)