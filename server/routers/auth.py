from os import access

from fastapi import APIRouter
from pydantic import BaseModel
from services.kakao import exchange_code_for_token, get_kakao_user

router = APIRouter(prefix="/auth", tags=["auth"])

class KaKaoLoginIn(BaseModel):
    code: str

@router.post("/kakao")
async def kakao_login(body: KaKaoLoginIn):
    access_token = await exchange_code_for_token(body.code)
    user = await get_kakao_user(access_token)
    print("카카오 유저: ", user)

    return {"ok": True, "user": user}