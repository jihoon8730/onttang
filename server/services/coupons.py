from datetime import datetime, timezone

from sqlalchemy import func, select
from database import SessionLocal
from models import CouponCode, Product, Stamp

# 쿠폰 이벤트 조건 — 모든 상품이 이 마일스톤을 공유(스탬프 N곳 이상이면 카탈로그에서 1개 선택 가능)
COUPON_MILESTONE = 5


class NotEligibleError(Exception):
    """스탬프 수가 마일스톤 미만, 또는 이미 다른 상품을 받은 유저."""


class SoldOutError(Exception):
    """해당 상품의 미배정 코드가 모두 소진됨."""


def _stamped_count(session, user_id: int) -> int:
    return session.scalar(
        select(func.count()).select_from(Stamp).where(Stamp.user_id == user_id)
    )


def list_products(user_id: int) -> dict:
    """전체 상품 카탈로그 + 내 진행 상황(마일스톤 공통, 이미 받은 상품이 있으면 그 코드)."""
    with SessionLocal() as session:
        stamped = _stamped_count(session, user_id)

        my_claim = session.execute(
            select(CouponCode).where(CouponCode.claimed_by == user_id)
        ).scalar_one_or_none()
        my_product = (
            session.get(Product, my_claim.product_id) if my_claim else None
        )

        products = session.execute(
            select(Product).where(Product.is_active.is_(True)).order_by(Product.id)
        ).scalars().all()

        items = []
        for p in products:
            total = session.scalar(
                select(func.count()).select_from(CouponCode).where(CouponCode.product_id == p.id)
            )
            remaining = session.scalar(
                select(func.count())
                .select_from(CouponCode)
                .where(CouponCode.product_id == p.id, CouponCode.claimed_by.is_(None))
            )
            items.append({
                "product_id": p.id,
                "name": p.name,
                "description": p.description,
                "icon_ios": p.icon_ios,
                "icon_android": p.icon_android,
                "remaining": remaining or 0,
                "total": total or 0,
            })

        return {
            "stamped": stamped,
            "milestone": COUPON_MILESTONE,
            "eligible": stamped >= COUPON_MILESTONE,
            "claimed": my_claim is not None,
            "claimed_product_name": my_product.name if my_product else None,
            "code": my_claim.code if my_claim else None,
            "claimed_at": my_claim.claimed_at.isoformat() if my_claim else None,
            "products": items,
        }


def claim(user_id: int, product_id: int) -> dict:
    """조건 달성 시 고른 상품의 미배정 코드 하나를 원자적으로 선점해 배정.
    이미 어떤 상품이든 받은 유저가 재요청하면 기존 코드를 그대로 반환(안전한 재시도).
    유저는 전체 이벤트에서 상품 1개만 받을 수 있다."""
    with SessionLocal() as session:
        existing = session.execute(
            select(CouponCode).where(CouponCode.claimed_by == user_id)
        ).scalar_one_or_none()
        if existing is not None:
            return {"code": existing.code, "product_id": existing.product_id}

        if _stamped_count(session, user_id) < COUPON_MILESTONE:
            raise NotEligibleError()

        # FOR UPDATE SKIP LOCKED: 동시에 여러 유저가 같은 상품을 요청해도
        # 중복 배정 없이, 이미 잠긴 행은 건너뛰어 다음 미배정 행을 집는다.
        row = session.execute(
            select(CouponCode)
            .where(CouponCode.product_id == product_id, CouponCode.claimed_by.is_(None))
            .order_by(CouponCode.id)
            .with_for_update(skip_locked=True)
            .limit(1)
        ).scalar_one_or_none()
        if row is None:
            raise SoldOutError()

        row.claimed_by = user_id
        row.claimed_at = datetime.now(timezone.utc)
        session.commit()
        return {"code": row.code, "product_id": row.product_id}
