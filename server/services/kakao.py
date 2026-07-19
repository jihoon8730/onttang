import httpx
from config import settings

KAKAO_TOKEN_URL = "https://kauth.kakao.com/oauth/token"
KAKAO_USER_URL = "https://kapi.kakao.com/v2/user/me"
REDIRECT_URI = settings.kakao_redirect_uri

async def exchange_code(code:str) -> str:
    """인가코드 -> access_token으로 교환"""
    data = {
        "grant_type": "authorization_code",
        "client_id": settings.kakao_rest_key,
        "client_secret": settings.kakao_client_secret,
        "redirect_uri": REDIRECT_URI,
        "code": code
    }
    
    async with httpx.AsyncClient() as client:
        res = await client.post(KAKAO_TOKEN_URL, data=data)
        res.raise_for_status()

        return res.json()["access_token"]

async def get_kakao_user(access_token: str) -> dict:
    """access_token -> 카카오 유저정보"""
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
