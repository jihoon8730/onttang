from fastapi import APIRouter, Response
from services.marker import build_marker

router = APIRouter(tags=["markers"])


@router.get("/markers")
async def marker(src: str, selected: bool = False, stamped: bool = False):
    png = await build_marker(src, selected, stamped)
    return Response(
        content=png,
        media_type="image/png",
        headers={"Cache-Control": "public, max-age=86400"},
    )
