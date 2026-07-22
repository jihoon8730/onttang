from fastapi import APIRouter, Depends
from routers.auth import get_optional_user_id
from services import stamps as stamp_service

router = APIRouter(prefix="/rankings", tags=["rankings"])


@router.get("")
def rankings(user_id: int | None = Depends(get_optional_user_id)):
    return stamp_service.get_rankings(user_id)
