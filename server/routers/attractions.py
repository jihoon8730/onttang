from fastapi import APIRouter
from constants import CATEGORY_LABELS
from services import attractions as attraction_service
from services.tour_api import fetch_attractions, fetch_attraction_detail
from schemas import AttractionOut, AttractionDetailOut, NearbyAttractionOut

router = APIRouter(prefix="/attractions", tags=["attractions"])

# geofence 등록 개수 상한 — iOS가 동시 감시 가능한 region 수(20개)에 맞춤
NEARBY_LIMIT_MAX = 20
NEARBY_RADIUS_DEFAULT_M = 15000


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


@router.get("/nearby", response_model=list[NearbyAttractionOut])
def nearby_attractions(lat: float, lng: float, radius_m: float = NEARBY_RADIUS_DEFAULT_M):
    """현재 위치 기준 가까운 대표 관광지 최대 20곳 (백그라운드 geofence 등록용)."""
    rows = attraction_service.list_nearby(lat, lng, radius_m, NEARBY_LIMIT_MAX)
    return [NearbyAttractionOut(**row) for row in rows]


@router.get("/{content_id}", response_model=AttractionDetailOut)
async def attraction_detail(content_id: str):
    detail = await fetch_attraction_detail(content_id)
    return AttractionDetailOut(content_id=content_id, **detail)
