
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from database import SessionLocal
from models import Stamp, Attraction
from routers.auth import get_current_user_id
from math import radians, sin, cos, asin, sqrt

def distance_m(lat1, lng1, lat2, lng2) -> float:
    """두 GPS 좌표 사이 실제 거리(미터). 하버사인 공식."""
    R = 6371000 # 지구 반지름(m)
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * R * asin(sqrt(a))

STAMP_RADIUS_M = 200

router = APIRouter(prefix="/stamps", tags=["stamps"])

class StampIn(BaseModel):
    content_id: str
    lat: float
    lng: float

@router.post("")
def create_stamp(
    body: StampIn,
    user_id: int = Depends(get_current_user_id),
):
    with SessionLocal() as session:
        attraction = session.get(Attraction, body.content_id)
        dist = distance_m(body.lat, body.lng, attraction.latitude, attraction.longitude)
        
        if dist > STAMP_RADIUS_M:
            raise HTTPException(status_code=400, detail=f"너무 멀어요 ({int(dist)}m)")
    
        stmt = select(Stamp).where(
            Stamp.user_id == user_id,
            Stamp.content_id == body.content_id,
        )
        stamp = session.execute(stmt).scalar_one_or_none()

        if stamp is None:
            stamp = Stamp(user_id=user_id, content_id=body.content_id)
            session.add(stamp)
        else:
            stamp.visit_count += 1

        session.commit()
        return {
            "id": stamp.id,
            "content_id": stamp.content_id,
            "visit_count": stamp.visit_count,
        }