from fastapi import APIRouter
from sqlalchemy import select
from database import SessionLocal
from models import Attraction
from constants import CATEGORY_LABELS
from services.tour_api import fetch_attractions, fetch_attraction_detail
from schemas import AttractionOut, AttractionDetailOut

router = APIRouter(prefix="/attractions", tags=["attractions"])


@router.get("", response_model=list[AttractionOut])
async def get_attractions(ldong_regn_cd: str = "11", page: int = 1):
    items = await fetch_attractions(ldong_regn_cd, page)
    return [
        AttractionOut(
            content_id=item["contentid"],
            title=item["title"],
            address=item.get("addr1", ""),
            latitude=float(item["mapy"]),
            longitude=float(item["mapx"]),
            image_url=item.get("firstimage") or None,
            category=item.get("category") or None,
        )
        for item in items
    ]


@router.get("/db", response_model=list[AttractionOut])
def attractions_from_db():
    with SessionLocal() as session:
        stmt = select(Attraction).where(Attraction.is_featured.is_(True))
        rows = session.execute(stmt).scalars().all()
    return [
        AttractionOut(
            content_id=row.content_id,
            title=row.title,
            category=CATEGORY_LABELS.get(row.lcls_systm1), 
            address=row.address,
            latitude=row.latitude,
            longitude=row.longitude,
            image_url=row.image_url,
        )
    for row in rows
]

NUM_OF_ROWS = 100

# 17개 시도 법정동 코드
AREA_CODES = [
    "11", "26", "27", "28", "29", "30", "31", "36",
    "41", "51", "43", "44", "52", "46", "47", "48", "50",
]

@router.post("/sync")
async def sync_attractions(ldong_regn_cd: str = "11", page: int = 1):
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
                            category=CATEGORY_LABELS.get(item.get("lclsSystm1")),
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
    return {"synced": total}

@router.get("/{content_id}", response_model=AttractionDetailOut)
async def attraction_detail(content_id:str):
    detail = await fetch_attraction_detail(content_id)
    return AttractionDetailOut(content_id=content_id, **detail)
