from datetime import datetime
from sqlalchemy import JSON, UniqueConstraint, func, ForeignKey
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class Attraction(Base):
    __tablename__ = "attractions"

    content_id: Mapped[str] = mapped_column(primary_key=True)
    title: Mapped[str]
    address: Mapped[str | None]
    latitude: Mapped[float | None]
    longitude: Mapped[float | None]
    area_code: Mapped[str | None]
    image_url: Mapped[str | None]
    lcls_systm1: Mapped[str | None]
    lcls_systm2: Mapped[str | None]
    lcls_systm3: Mapped[str | None]
    is_featured: Mapped[bool] = mapped_column(server_default="false")

class AttractionDetail(Base):
    """TourAPI 상세(개요·이용안내·이미지) 영구 캐시.
    메모리 캐시와 달리 서버 재배포에도 남아있어, 한 번 조회된 곳은 계속 빠름."""
    __tablename__ = "attraction_details"

    content_id: Mapped[str] = mapped_column(
        ForeignKey("attractions.content_id"), primary_key=True
    )
    overview: Mapped[str | None]
    homepage: Mapped[str | None]
    usetime: Mapped[str | None]
    restdate: Mapped[str | None]
    infocenter: Mapped[str | None]
    parking: Mapped[str | None]
    images: Mapped[list[str]] = mapped_column(JSON, default=list)
    cached_at: Mapped[datetime] = mapped_column(server_default=func.now())

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider: Mapped[str]
    provider_user_id: Mapped[str]
    nickname: Mapped[str | None]
    profile_image: Mapped[str | None]
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())

    __table_args__ = (UniqueConstraint("provider", "provider_user_id"),)

class Stamp(Base):
    __tablename__ = "stamps"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id")) 
    content_id: Mapped[str] = mapped_column(ForeignKey("attractions.content_id")) # 장소
    visit_count: Mapped[int] = mapped_column(default=1) # 방문 횟수
    stamped_at: Mapped[datetime] = mapped_column(server_default=func.now()) # 처음 찍은 시각

    # 한 유저는 한 관광지에 스탬프는 1개 (재방문 visit_count는 증가)
    __table_args__ = (UniqueConstraint("user_id", "content_id"),)
