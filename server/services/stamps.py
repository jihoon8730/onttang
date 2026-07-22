from math import radians, sin, cos, asin, sqrt
from sqlalchemy import select, func
from database import SessionLocal
from models import Stamp, Attraction, User
from constants import CATEGORY_LABELS, REGION_LABELS

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
        # 지역별 대표 관광지 수
        total_rows = session.execute(
            select(Attraction.area_code, func.count())
            .where(Attraction.is_featured.is_(True))
            .group_by(Attraction.area_code)
        ).all()

        # 지역별 내 스탬프 수
        stamped_rows = session.execute(
            select(Attraction.area_code, func.count())
            .join(Stamp, Stamp.content_id == Attraction.content_id)
            .where(Stamp.user_id == user_id, Attraction.is_featured.is_(True))
            .group_by(Attraction.area_code)
        ).all()

        # 내가 찍은 테마(카테고리) 종류 — 중복 제거
        theme_rows = session.execute(
            select(Attraction.lcls_systm1)
            .join(Stamp, Stamp.content_id == Attraction.content_id)
            .where(Stamp.user_id == user_id, Attraction.is_featured.is_(True))
            .distinct()
        ).all()
        
    stamped_by_region = {code: cnt for code, cnt in stamped_rows}
    regions = [
        {
            "code": code,
            "name": REGION_LABELS.get(code, code),
            "stamped": stamped_by_region.get(code, 0),
            "total": region_total,
            "rate": round(stamped_by_region.get(code, 0) / region_total, 4),
        }
        for code, region_total in total_rows
    ]
    regions.sort(key=lambda r: r["rate"], reverse=True)

    # CATEGORY_LABELS에 있는 테마만 카운트 (4개: 자연·역사·거리·명소)
    themes = {code for (code,) in theme_rows if code in CATEGORY_LABELS}

    return {
        "stamped": stamped,
        "total": total,
        "rate": round(stamped / total, 3) if total else 0,
        "regions": regions,
        "region_stamped": sum(1 for r in regions if r["stamped"] > 0),
        "region_total": len(regions),
        "theme_stamped": len(themes),
        "theme_total": len(CATEGORY_LABELS),
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


def get_rankings(current_user_id: int | None, limit: int = 100) -> dict:
    """유저별 스탬프 수로 랭킹. 상위 목록 + 내 순위(목록 밖이어도) 반환."""
    with SessionLocal() as session:
        stamp_count = func.count(Stamp.id)
        stmt = (
            select(
                User.id,
                User.nickname,
                User.profile_image,
                stamp_count.label("stamp_count"),
                # 동점은 같은 순위(예: 42개 2명 → 둘 다 1위, 다음 3위)
                func.rank().over(order_by=stamp_count.desc()).label("rank"),
            )
            .join(Stamp, Stamp.user_id == User.id)  # 스탬프 1개 이상인 유저만
            .group_by(User.id)
            .order_by(stamp_count.desc())
        )
        rows = session.execute(stmt).all()

    rankings = [
        {
            "rank": r.rank,
            "user_id": r.id,
            "nickname": r.nickname,
            "profile_image": r.profile_image,
            "stamp_count": r.stamp_count,
            "is_me": r.id == current_user_id,
        }
        for r in rows
    ]
    # 내 순위는 상위 목록 밖일 수 있으니 전체에서 따로 뽑아 둠 (스탬프 없으면 None)
    me = next((row for row in rankings if row["is_me"]), None)
    return {"rankings": rankings[:limit], "me": me}
