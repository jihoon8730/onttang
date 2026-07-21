import io
import httpx
from PIL import Image, ImageDraw

# 합성된 마커를 재사용 (src+selected 별로 1회만 생성)
_cache: dict[tuple[str, bool], bytes] = {}

ACCENT = (232, 100, 60, 255)  # #E8643C
ACCENT_DARK = (184, 67, 31, 255)  # #B8431F (선택)


def _cover_circle(photo: Image.Image, size: int) -> Image.Image:
    """사진을 정사각 센터크롭 후 size로 리사이즈."""
    w, h = photo.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    photo = photo.crop((left, top, left + s, top + s))
    return photo.resize((size, size), Image.LANCZOS)


def _compose(photo: Image.Image, selected: bool) -> bytes:
    SS = 3  # 슈퍼샘플링
    d = 96 * SS          # 원 지름
    ring = 7 * SS        # 링 두께
    tail = 20 * SS       # 핀 꼬리 높이
    w, h = d, d + tail
    color = ACCENT_DARK if selected else ACCENT

    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    cx = w / 2
    # 핀 꼬리(삼각형)
    draw.polygon(
        [(cx - d * 0.16, d - ring), (cx + d * 0.16, d - ring), (cx, d + tail - SS)],
        fill=color,
    )
    # 링(바깥 원)
    draw.ellipse([0, 0, d - 1, d - 1], fill=color)
    # 사진(안쪽 원)
    inner = d - 2 * ring
    circ = _cover_circle(photo, inner)
    mask = Image.new("L", (inner, inner), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, inner - 1, inner - 1], fill=255)
    canvas.paste(circ, (ring, ring), mask)

    out = canvas.resize((w // SS, h // SS), Image.LANCZOS)
    buf = io.BytesIO()
    out.save(buf, "PNG")
    return buf.getvalue()


async def build_marker(src: str, selected: bool) -> bytes:
    """원격 사진 → 원형 마커 PNG (캐시)."""
    key = (src, selected)
    if key in _cache:
        return _cache[key]

    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(src)
        res.raise_for_status()

    photo = Image.open(io.BytesIO(res.content)).convert("RGB")
    png = _compose(photo, selected)
    _cache[key] = png
    return png
