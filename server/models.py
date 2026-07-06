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