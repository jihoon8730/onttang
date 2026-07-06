from pydantic import BaseModel

class AttractionOut(BaseModel):
    content_id: str
    title: str
    category: str | None
    address: str | None
    latitude: float | None
    longitude: float | None
    image_url: str | None
    model_config = {"from_attributes": True}

class AttractionDetailOut(BaseModel):
    content_id: str
    overview: str | None
    homepage: str | None
    usetime: str | None
    restdate: str | None
    infocenter: str | None
    parking: str | None
    images: list[str]