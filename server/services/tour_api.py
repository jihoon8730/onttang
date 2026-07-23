import httpx
import asyncio
from fastapi import HTTPException
from config import settings
from database import SessionLocal
from models import AttractionDetail

TOUR_API_BASE = "https://apis.data.go.kr/B551011/KorService2"

# 상세 조회는 연결을 재사용 (매 요청마다 TLS 핸드셰이크 반복 방지)
_detail_client = httpx.AsyncClient(timeout=30.0)

async def fetch_attractions(ldong_regn_cd: str = "11", page: int = 1, num_of_rows: int = 100) -> list[dict]:
    params = {
        "serviceKey": settings.tour_api_key,
        "MobileOS": "ETC",
        "MobileApp": "onttang",
        "_type": "json",
        "pageNo": page,
        "numOfRows": num_of_rows,
        "contentTypeId": 12,  # 12 = 관광지
        "lDongRegnCd": ldong_regn_cd,
        "arrange": "O",
    }
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.get(f"{TOUR_API_BASE}/areaBasedList2", params=params)

    data = res.json()
    if "response" not in data:  # 방어: 정상 구조인지 확인
        raise HTTPException(status_code=502, detail=f"TourAPI 응답 이상: {data}")

    return _items(data)  # 결과 없는 지역/페이지의 "items":"" 도 안전 처리

def _items(data: dict) -> list[dict]:
    if "response" not in data:
        return []
    body_items = data["response"]["body"].get("items")
    if not body_items:
        return []
    item = body_items.get("item")
    if item is None:
        return []
    return item if isinstance(item, list) else [item]

_DETAIL_CACHE = {}


def _db_get_detail(content_id: str) -> dict | None:
    """DB 영구 캐시 조회 (동기 — to_thread로 호출)."""
    with SessionLocal() as session:
        row = session.get(AttractionDetail, content_id)
        if row is None:
            return None
        return {
            "overview": row.overview,
            "homepage": row.homepage,
            "usetime": row.usetime,
            "restdate": row.restdate,
            "infocenter": row.infocenter,
            "parking": row.parking,
            "images": row.images,
        }


def _db_save_detail(content_id: str, result: dict) -> None:
    """DB 영구 캐시 저장 (동기 — to_thread로 호출)."""
    with SessionLocal() as session:
        session.merge(AttractionDetail(content_id=content_id, **result))
        session.commit()


async def fetch_attraction_detail(content_id: str) -> dict:
    # 1. 캐시 히트: 이미 메모리에 있으면 즉시 반환 (속도 대폭 향상)
    if content_id in _DETAIL_CACHE:
        return _DETAIL_CACHE[content_id]

    # 2. DB 영구 캐시 확인 — 서버 재배포로 메모리 캐시가 비워져도 여기서 즉시 반환
    db_result = await asyncio.to_thread(_db_get_detail, content_id)
    if db_result is not None:
        _DETAIL_CACHE[content_id] = db_result
        return db_result

    # 3. 캐시 완전 미스 — TourAPI 실시간 조회 (여기만 느림, 최초 1회뿐)
    base = {
        "serviceKey": settings.tour_api_key,
        "MobileOS": "ETC",
        "MobileApp": "onttang",
        "_type": "json",
        "contentId": content_id,
    }
    common_res, intro_res, image_res = await asyncio.gather(     # 세 요청 병렬
        _detail_client.get(f"{TOUR_API_BASE}/detailCommon2", params=base),
        _detail_client.get(f"{TOUR_API_BASE}/detailIntro2", params={**base, "contentTypeId": "12"}),
        _detail_client.get(f"{TOUR_API_BASE}/detailImage2", params={**base, "imageYN": "Y"}),
    )

    common_list = _items(common_res.json())
    common = common_list[0] if common_list else {}
    intro_list = _items(intro_res.json())
    intro = intro_list[0] if intro_list else {}
    images = _items(image_res.json())

    result = {
        "overview": common.get("overview") or None,
        "homepage": common.get("homepage") or None,
        "usetime": intro.get("usetime") or None,
        "restdate": intro.get("restdate") or None,
        "infocenter": intro.get("infocenter") or None,
        "parking": intro.get("parking") or None,
        "images": [
            img["originimgurl"].replace("http://", "https://")
            for img in images if img.get("originimgurl")
        ],
    }

    # 4. 메모리 캐시(최대 1000개) + DB 영구 캐시에 모두 저장
    _DETAIL_CACHE[content_id] = result
    if len(_DETAIL_CACHE) > 1000:
        _DETAIL_CACHE.pop(next(iter(_DETAIL_CACHE)))
    await asyncio.to_thread(_db_save_detail, content_id, result)

    return result

