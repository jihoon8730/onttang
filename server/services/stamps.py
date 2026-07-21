from math import radians, sin, cos, asin, sqrt
from sqlalchemy import select, func
from database import SessionLocal
from models import Stamp, Attraction
from constants import CATEGORY_LABELS

STAMP_RADIUS_M = 200  # 이 반경(m) 안에서만 스탬프 허용


class TooFarError(Exception):
    """스탬프 반경 밖 — 라우터가 400 HTTP 에러로 번역."""

    def __init__(self, distance_m: int):
        self.distance_m = distance_m


def _distance_m(lat1, lng1, lat2, lng2) -> float:
    """두 GPS 좌표 사이 실제 거리(미터). 하버사인 공식."""
    R = 6371000  # 지구 반지름(m)
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * R * asin(sqrt(a))


def list_stamps(user_id: int) -> list[dict]:
    """내가 찍은 스탬프 목록 (Stamp Join Attraction, 최근순)"""
    with SessionLocal() as session:
        stmt = (
            select(Stamp, Attraction)
            .join(Attraction, Stamp.content_id == Attraction.content_id)
            .where(Stamp.user_id == user_id)
            .order_by(Stamp.stamped_at.desc())
        )
        rows = session.execute(stmt).all()

    return [
        {
            "content_id": a.content_id,
            "title": a.title,
            "address": a.address,
            "image_url": a.image_url,
            "category": CATEGORY_LABELS.get(a.lcls_systm1),
            "visit_count": s.visit_count,
            "stamped_at": s.stamped_at,
        }
        for s, a in rows
    ]


def get_stats(user_id: int) -> dict:
    """탐험률 = 내 스탬프 수 / 전체 대표 관광지 수"""
    with SessionLocal() as session:
        stamped = session.scalar(
            select(func.count()).select_from(Stamp).where(Stamp.user_id == user_id)
        )
        total = session.scalar(
            select(func.count())
            .select_from(Attraction)
            .where(Attraction.is_featured.is_(True))
        )

    return {
        "stamped": stamped,
        "total": total,
        "rate": round(stamped / total, 3) if total else 0,
    }


def create_stamp(user_id: int, content_id: str, lat: float, lng: float) -> dict:
    """현재 위치가 관광지 반경 안이면 스탬프 생성(또는 재방문 +1)."""
    with SessionLocal() as session:
        attraction = session.get(Attraction, content_id)
        dist = _distance_m(lat, lng, attraction.latitude, attraction.longitude)

        if dist > STAMP_RADIUS_M:
            raise TooFarError(int(dist))

        stmt = select(Stamp).where(
            Stamp.user_id == user_id,
            Stamp.content_id == content_id,
        )
        stamp = session.execute(stmt).scalar_one_or_none()

        if stamp is None:
            stamp = Stamp(user_id=user_id, content_id=content_id)
            session.add(stamp)
        else:
            stamp.visit_count += 1

        session.commit()
        return {
            "id": stamp.id,
            "content_id": stamp.content_id,
            "visit_count": stamp.visit_count,
        }
