from sqlalchemy import select
from database import SessionLocal
from models import User
from security import create_access_token
from services.kakao import exchange_code, get_kakao_user


async def login_with_kakao(code: str) -> dict:
    """카카오 인가코드 → 유저 upsert → 자체 JWT 발급."""
    access_token = await exchange_code(code)
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
        return {
            "token": create_access_token(user.id),
            "user": {"id": user.id, "nickname": user.nickname},
        }


def get_user(user_id: int) -> dict | None:
    """user_id로 유저 조회 (없으면 None)."""
    with SessionLocal() as session:
        user = session.get(User, user_id)
        if user is None:
            return None
        return {"id": user.id, "nickname": user.nickname}
