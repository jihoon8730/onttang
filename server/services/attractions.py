from sqlalchemy import select
from database import SessionLocal
from models import Attraction
from services.tour_api import fetch_attractions

NUM_OF_ROWS = 100

# 17개 시도 법정동 코드
AREA_CODES = [
    "11", "26", "27", "28", "29", "30", "31", "36",
    "41", "51", "43", "44", "52", "46", "47", "48", "50",
]


def list_featured() -> list[Attraction]:
    """대표(is_featured) 관광지 전체 조회."""
    with SessionLocal() as session:
        stmt = select(Attraction).where(Attraction.is_featured.is_(True))
        return session.execute(stmt).scalars().all()


async def sync_attractions(ldong_regn_cd: str = "11") -> int:
    """TourAPI에서 관광지를 페이지네이션으로 받아 DB에 merge. 적재 건수 반환."""
    codes = [ldong_regn_cd] if ldong_regn_cd else AREA_CODES

    total = 0
    with SessionLocal() as session:
        for code in codes:
            page = 1
            while True:
                items = await fetch_attractions(code, page, NUM_OF_ROWS)
                if not items:
                    break
                for item in items:
                    session.merge(
                        Attraction(
                            content_id=item["contentid"],
                            title=item["title"],
                            address=item.get("addr1", ""),
                            latitude=float(item["mapy"]),
                            longitude=float(item["mapx"]),
                            area_code=code,
                            image_url=(item.get("firstimage") or "").replace("http://", "https://") or None,
                            lcls_systm1=item.get("lclsSystm1"),
                            lcls_systm2=item.get("lclsSystm2"),
                            lcls_systm3=item.get("lclsSystm3"),
                        )
                    )
                total += len(items)
                if len(items) < NUM_OF_ROWS:
                    break
                page += 1
        session.commit()
    return total
