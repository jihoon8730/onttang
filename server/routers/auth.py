from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from security import decode_access_token
from services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


class KakaoLoginIn(BaseModel):
    code: str
    redirect_uri: str


@router.post("/kakao")
async def kakao_login(body: KakaoLoginIn):
    return await auth_service.login_with_kakao(body.code, body.redirect_uri)


bearer = HTTPBearer()


def get_current_user_id(cred: HTTPAuthorizationCredentials = Depends(bearer)) -> int:
    try:
        return decode_access_token(cred.credentials)
    except Exception:
        raise HTTPException(status_code=401, detail="유효하지 않은 토큰")


@router.get("/me")
def me(user_id: int = Depends(get_current_user_id)):
    user = auth_service.get_user(user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="유저 없음")
    return user


@router.delete("/me", status_code=204)
def delete_me(user_id: int = Depends(get_current_user_id)):
    deleted = auth_service.delete_user(user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="유저 없음")
