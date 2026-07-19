
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from database import SessionLocal
from models import Stamp
from routers.auth import get_current_user_id


router = APIRouter(prefix="/stamps", tags=["stamps"])

class StampIn(BaseModel):
    content_id: str

@router.post("")
def create_stamp(
    body: StampIn,
    user_id: int = Depends(get_current_user_id),
):
    with SessionLocal() as session:
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