from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from routers.auth import get_current_user_id
from services import stamps as stamp_service

router = APIRouter(prefix="/stamps", tags=["stamps"])


class StampIn(BaseModel):
    content_id: str
    lat: float
    lng: float


@router.post("")
def create_stamp(body: StampIn, user_id: int = Depends(get_current_user_id)):
    try:
        return stamp_service.create_stamp(user_id, body.content_id, body.lat, body.lng)
    except stamp_service.TooFarError as e:
        raise HTTPException(status_code=400, detail=f"너무 멀어요 ({e.distance_m}m)")
