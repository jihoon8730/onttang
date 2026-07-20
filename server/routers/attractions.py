from fastapi import APIRouter
from constants import CATEGORY_LABELS
from services import attractions as attraction_service
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
    rows = attraction_service.list_featured()
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


@router.post("/sync")
async def sync_attractions(ldong_regn_cd: str = "11"):
    synced = await attraction_service.sync_attractions(ldong_regn_cd)
    return {"synced": synced}


@router.get("/{content_id}", response_model=AttractionDetailOut)
async def attraction_detail(content_id: str):
    detail = await fetch_attraction_detail(content_id)
    return AttractionDetailOut(content_id=content_id, **detail)
