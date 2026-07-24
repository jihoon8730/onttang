import httpx
from sqlalchemy import select
from database import SessionLocal
from models import Attraction
from services.tour_api import fetch_attractions

NUM_OF_ROWS = 100

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


async def sync_attractions(ldong_regn_cd: str = "11") -> int:
    """TourAPI에서 관광지를 페이지네이션으로 받아 DB에 merge. 적재 건수 반환."""
    codes = [ldong_regn_cd] if ldong_regn_cd else AREA_CODES

    total = 0
    with SessionLocal() as session:
        for code in codes:
            try:
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
                        session.merge(
                            Attraction(
                                content_id=item["contentid"],
                                title=item["title"],
                                address=_normalize_address(item.get("addr1", "")),
                                latitude=lat,
                                longitude=lng,
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
                session.commit()  # 지역 단위로 커밋 → 부분 진행 보존
            except httpx.ReadTimeout:
                session.rollback()
                print(f"⚠️ {code} 지역 타임아웃 — 건너뜀 (재실행하면 채워짐)")
                continue
    return total
