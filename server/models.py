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
    synced_at : Mapped[datetime | None]

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
    last_visited_at: Mapped[datetime | None] # 가장 최근 방문 인정 시각 (재방문 쿨다운 판정용)

    # 한 유저는 한 관광지에 스탬프는 1개 (재방문 visit_count는 증가)
    __table_args__ = (UniqueConstraint("user_id", "content_id"),)

class Product(Base):
    """쿠폰 이벤트에서 고를 수 있는 상품 카드(예: 스타벅스 아메리카노, CU 상품권).
    모든 상품은 동일한 스탬프 마일스톤(COUPON_MILESTONE)을 공유하며,
    유저는 조건 달성 후 이 중 하나만 골라 받을 수 있다.
    관리자가 DB에 직접 행을 추가(별도 어드민 화면 없음)."""
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str]  # 예: "스타벅스 아메리카노"
    description: Mapped[str | None]
    icon_ios: Mapped[str | None]  # SF Symbol 이름 (없으면 프론트 기본값)
    icon_android: Mapped[str | None]  # Material Symbol 이름
    is_active: Mapped[bool] = mapped_column(server_default="true")

class CouponCode(Base):
    """상품별 실제 기프티콘 코드 풀 — 선착순 자동 배정.
    관리자가 수동으로 code를 채워 넣음(별도 발급 API 없음, DB 직접 insert)."""
    __tablename__ = "coupon_codes"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"))
    code: Mapped[str]  # 기프티콘 코드/이미지 URL 등
    # 유저 전체 통틀어 1개만 받을 수 있음(상품은 여러 개 중 하나만 선택)
    claimed_by: Mapped[int | None] = mapped_column(ForeignKey("users.id"), unique=True)
    claimed_at: Mapped[datetime | None]
