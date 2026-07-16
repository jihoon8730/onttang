from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from services.kakao import exchange_code, get_kakao_user
from models import User
from database import SessionLocal
from sqlalchemy import select
from security import create_access_token, decode_access_token

router = APIRouter(prefix="/auth", tags=["auth"])

class KakaoLoginIn(BaseModel):
    code: str

@router.post("/kakao")
async def kakao_login(body: KakaoLoginIn):
    access_token = await exchange_code(body.code)
    kakao_user = await get_kakao_user(access_token)
    
    with SessionLocal() as session:
        stmt = select(User).where(
            User.provider == "kakao",
            User.provider_user_id == kakao_user["provider_user_id"],
        )
        user = session.execute(stmt).scalar_one_or_none()

        if user is None:
            user = User(
                provider="kakao",
                provider_user_id=kakao_user["provider_user_id"],
                nickname=kakao_user["nickname"],
                profile_image=kakao_user["profile_image"],
            )
            session.add(user)
        else:
            user.nickname = kakao_user["nickname"]
            user.profile_image = kakao_user["profile_image"]
        session.commit()
        token = create_access_token(user.id)  # JWT 발급
        return {"token": token, "user": {"id": user.id, "nickname": user.nickname}}

bearer = HTTPBearer()

def get_current_user_id(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> int:
    try:
        return decode_access_token(cred.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")
    
@router.get("/me")
def me(user_id: int = Depends(get_current_user_id)):
    with SessionLocal() as session:
        user = session.get(User, user_id)
        if user is None:
            raise HTTPException(status_code=404, detail="유저 없음")
        return {"id": user.id, "nickname": user.nickname}