from sqlalchemy import select, delete
from database import SessionLocal
from models import User, Stamp
from security import create_access_token
from services.kakao import exchange_code, get_kakao_user
from services.apple import verify_apple_identity_token


async def login_with_kakao(code: str, redirect_uri: str) -> dict:
    """카카오 인가코드 → 유저 upsert → 자체 JWT 발급."""
    access_token = await exchange_code(code, redirect_uri)
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
            "user": {"id": user.id, "nickname": user.nickname, "profile_image": user.profile_image},
        }


def login_with_apple(identity_token: str, full_name: str | None) -> dict:
    """애플 identityToken 검증 → 유저 upsert → 자체 JWT 발급."""
    payload = verify_apple_identity_token(identity_token)
    provider_user_id = payload["sub"]  # 애플의 고유 유저 식별자
    email = payload.get("email")

    with SessionLocal() as session:
        stmt = select(User).where(
            User.provider == "apple",
            User.provider_user_id == provider_user_id,
        )
        user = session.execute(stmt).scalar_one_or_none()

        if user is None:
            # 애플은 이름을 '첫 로그인 때만' 준다 → full_name 우선, 없으면 이메일 앞부분
            nickname = full_name or (email.split("@")[0] if email else "애플 사용자")
            user = User(
                provider="apple",
                provider_user_id=provider_user_id,
                nickname=nickname,
                profile_image=None,  # 애플은 프로필 사진을 제공하지 않음
            )
            session.add(user)
        # 재로그인 시 애플이 이름을 안 주므로 기존 닉네임은 덮어쓰지 않고 유지

        session.commit()
        return {
            "token": create_access_token(user.id),
            "user": {"id": user.id, "nickname": user.nickname, "profile_image": user.profile_image},
        }


def get_user(user_id: int) -> dict | None:
    """user_id로 유저 조회 (없으면 None)."""
    with SessionLocal() as session:
        user = session.get(User, user_id)
        if user is None:
            return None
        return {"id": user.id, "nickname": user.nickname, "profile_image": user.profile_image}


def delete_user(user_id: int) -> bool:
    """회원 탈퇴 — 유저의 스탬프를 먼저 지우고 유저 삭제 (없으면 False)."""
    with SessionLocal() as session:
        user = session.get(User, user_id)
        if user is None:
            return False
        # 스탬프가 users.id를 FK로 참조 → 유저보다 먼저 지워야 제약 위반 안 남
        session.execute(delete(Stamp).where(Stamp.user_id == user_id))
        session.delete(user)
        session.commit()
        return True
