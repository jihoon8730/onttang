import httpx
from config import settings

KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me"
REDIRECT_URI = "https://onttang8730.ngrok.io/oauth/kakao"

async def exchange_code_for_token(code:str) -> str:
    """카카오 인가코드(code) -> access_token 교환"""
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.kakao_rest_key,
        "client_secret": settings.kakao_client_secret,
        "redirect_uri": REDIRECT_URI,
        "code": code,
    }
    async with httpx.AsyncClient() as client:
        res = await client.post(KAKAO_TOKEN_URL, data=data)
        res.raise_for_status()
        return res.json()["access_token"]
    
async def get_kakao_user(access_token:str) -> dict:
    headers = {"Authorization": f"Bearer {access_token}"}
    async with httpx.AsyncClient() as client:
        res = await client.get(KAKAO_USER_URL, headers=headers)
        res.raise_for_status()
        data = res.json()
    
    profile = data.get("kakao_account", {}).get("profile", {})
    return {
        "provider_user_id": str(data["id"]),
        "nickname": profile.get("nickname"),
        "profile_image": profile.get("profile_image_url"),
    }