import asyncio
import httpx
from sqlalchemy import select, delete
from database import SessionLocal
from models import Attraction, AttractionDetail, Stamp
from services.tour_api import fetch_attractions
from services.geo import distance_m
from datetime import datetime

NUM_OF_ROWS = 100
MAX_RETRIES = 3
REGION_INTERVAL_SECONDS = 3  # 지역 간 호출 간격 — 순간 호출량 분산

# 시도 법정동 코드 (TourAPI lDongRegnCd 기준 — 광주+전남은 통합코드 12, 세종은 36110)
AREA_CODES = [
    "11", "12", "26", "27", "28", "30", "31", "36110",
    "41", "51", "43", "44", "52", "47", "48", "50",
]

# 통합코드 12의 addr1이 실제 행정구역명 대신 TourAPI 내부 표기인
# "전남광주통합특별시"로 내려와서, 저장 시 실제 시도명으로 바로잡는다
GWANGJU_DISTRICTS = {"동구", "서구", "남구", "북구", "광산구"}


def _normalize_address(addr: str) -> str:
    prefix = "전남광주통합특별시"
    if not addr.startswith(prefix):
        return addr
    district = addr[len(prefix):].strip().split(" ", 1)[0]
    real_sido = "광주광역시" if district in GWANGJU_DISTRICTS else "전라남도"
    return real_sido + addr[len(prefix):]


def list_featured() -> list[Attraction]:
    """대표(is_featured) 관광지 전체 조회."""
    with SessionLocal() as session:
        stmt = select(Attraction).where(Attraction.is_featured.is_(True))
        return session.execute(stmt).scalars().all()


def list_nearby(lat: float, lng: float, radius_m: float, limit: int) -> list[dict]:
    """대표 관광지 중 현재 위치 기준 radius_m 이내를 가까운 순으로 최대 limit개 반환.
    (백그라운드 geofence 등록 대상 선정용 — iOS는 동시 20개 제한이라 limit으로 좁힌다)"""
    with SessionLocal() as session:
        stmt = select(Attraction).where(Attraction.is_featured.is_(True))
        candidates = session.execute(stmt).scalars().all()

    nearby = [
        {"attraction": a, "distance_m": distance_m(lat, lng, a.latitude, a.longitude)}
        for a in candidates
        if a.latitude is not None and a.longitude is not None
    ]
    nearby = [row for row in nearby if row["distance_m"] <= radius_m]
    nearby.sort(key=lambda row: row["distance_m"])

    return [
        {
            "content_id": row["attraction"].content_id,
            "title": row["attraction"].title,
            "latitude": row["attraction"].latitude,
            "longitude": row["attraction"].longitude,
            "distance_m": round(row["distance_m"]),
        }
        for row in nearby[:limit]
    ]


async def _sync_region(session, code: str) -> int:
    """한 지역을 끝까지 페이지네이션하며 DB에 merge하고, TourAPI에서 더 이상 내려오지
    않는(폐업 등) 곳은 DB에서 삭제한다. 적재 건수 반환. (실패 시 예외 전파)"""
    total = 0
    fetched_ids: set[str] = set()
    page = 1
    while True:
        items = await fetch_attractions(code, page, NUM_OF_ROWS)
        if not items:
            break
        for item in items:
            try:
                lat = float(item["mapy"])
                lng = float(item["mapx"])
            except (KeyError, ValueError, TypeError):
                continue  # 좌표 없거나 'null' 등 잘못된 항목 건너뜀
            content_id = item["contentid"]
            fetched_ids.add(content_id)
            session.merge(
                Attraction(
                    content_id=content_id,
                    title=item["title"],
                    address=_normalize_address(item.get("addr1", "")),
                    latitude=lat,
                    longitude=lng,
                    area_code=code,
                    image_url=(item.get("firstimage") or "").replace("http://", "https://") or None,
                    lcls_systm1=item.get("lclsSystm1"),
                    lcls_systm2=item.get("lclsSystm2"),
                    lcls_systm3=item.get("lclsSystm3"),
                    synced_at=datetime.now(),
                )
            )
        total += len(items)
        if len(items) < NUM_OF_ROWS:
            break
        page += 1

    _delete_stale(session, code, fetched_ids)
    return total


def _delete_stale(session, code: str, fetched_ids: set[str]) -> None:
    """이번 동기화에서 TourAPI가 더 이상 내려주지 않은 관광지를 DB에서 삭제.
    단, 유저가 이미 스탬프를 찍은 곳은 데이터 무결성(FK)을 위해 지우지 않고 남겨둔다."""
    existing_ids = set(
        session.execute(
            select(Attraction.content_id).where(Attraction.area_code == code)
        ).scalars().all()
    )
    stale_ids = existing_ids - fetched_ids
    if not stale_ids:
        return

    stamped_ids = set(
        session.execute(
            select(Stamp.content_id).where(Stamp.content_id.in_(stale_ids))
        ).scalars().all()
    )
    deletable_ids = stale_ids - stamped_ids

    if stamped_ids:
        print(f"⏭️  [삭제 보류] {code} 지역 {len(stamped_ids)}곳 — 유저 스탬프가 있어 유지")

    if not deletable_ids:
        return

    session.execute(delete(AttractionDetail).where(AttractionDetail.content_id.in_(deletable_ids)))
    session.execute(delete(Attraction).where(Attraction.content_id.in_(deletable_ids)))
    print(f"🗑️  [삭제 완료] {code} 지역 {len(deletable_ids)}곳 — TourAPI에서 더 이상 조회되지 않음")


async def sync_attractions(ldong_regn_cd: str = "11") -> int:
    """TourAPI에서 관광지를 페이지네이션으로 받아 DB에 merge. 적재 건수 반환.

    지역마다 실패하면 최대 MAX_RETRIES회까지 지수 백오프로 재시도하고,
    그래도 실패하면 해당 지역만 건너뛴다(기존 캐시는 그대로 유지).
    """
    codes = [ldong_regn_cd] if ldong_regn_cd else AREA_CODES

    total = 0
    with SessionLocal() as session:
        for i, code in enumerate(codes):
            for attempt in range(1, MAX_RETRIES + 1):
                try:
                    region_count = await _sync_region(session, code)
                    session.commit()  # 지역 단위로 커밋 → 부분 진행 보존
                    total += region_count
                    print(f"✅ [지역 동기화 완료] {code} — {region_count}건 (시도 {attempt}/{MAX_RETRIES})")
                    break
                except httpx.HTTPError as e:
                    session.rollback()
                    if attempt == MAX_RETRIES:
                        print(f"⚠️ {code} 지역 {MAX_RETRIES}회 재시도 실패({e}) — 건너뜀, 기존 캐시 유지")
                        break
                    wait = 2 ** attempt  # 2초 → 4초 → 8초
                    print(f"⚠️ {code} 지역 {attempt}번째 시도 실패({e}) — {wait}초 후 재시도")
                    await asyncio.sleep(wait)

            if i < len(codes) - 1:
                await asyncio.sleep(REGION_INTERVAL_SECONDS)  # 다음 지역 호출 전 간격
    return total
