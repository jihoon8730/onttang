from fastapi import APIRouter, Depends
from routers.auth import get_current_user_id
from services import stamps as stamp_service

router = APIRouter(prefix="/me", tags=["me"])


@router.get("/stamps")
def my_stamps(user_id: int = Depends(get_current_user_id)):
    return stamp_service.list_stamps(user_id)


@router.get("/stats")
def my_stats(user_id: int = Depends(get_current_user_id)):
    return stamp_service.get_stats(user_id)
