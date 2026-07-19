from datetime import datetime
from sqlalchemy import UniqueConstraint, func, ForeignKey
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
    visit_count: Mapped[str] = mapped_column(server_default="1") # 방문 횟수
    stamped_at: Mapped[datetime] = mapped_column(server_default=func.now()) # 처음 찍은 시각

    # 한 유저는 한 관광지에 스탬프는 1개 (재방문 visit_count는 증가)
    __table_args__ = (UniqueConstraint("user_id", "content_id"),)
