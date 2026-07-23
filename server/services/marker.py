import asyncio
import io
import httpx
from PIL import Image, ImageDraw

# 합성된 마커를 재사용 (src+selected 별로 1회만 생성)
_cache: dict[tuple[str, bool], bytes] = {}

# 같은 마커가 여러 요청에서 동시에 캐시미스 나도 한 번만 생성하도록(thundering herd 방지)
_locks: dict[tuple[str, bool], asyncio.Lock] = {}

# 연결 재사용(매 요청마다 TLS 핸드셰이크 하지 않도록) — 프로세스 생존 기간 동안 유지
_client = httpx.AsyncClient(timeout=15.0)

ACCENT = (47, 122, 85, 255)  # #2F7A55
ACCENT_DARK = (31, 91, 61, 255)  # #1F5B3D (선택)


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


def _decode_and_compose(raw: bytes, selected: bool) -> bytes:
    """CPU 연산(디코딩+크롭+합성) — 스레드에서 돌려 이벤트 루프를 막지 않는다."""
    photo = Image.open(io.BytesIO(raw)).convert("RGB")
    return _compose(photo, selected)


async def build_marker(src: str, selected: bool) -> bytes:
    """원격 사진 → 원형 마커 PNG (캐시)."""
    key = (src, selected)
    if key in _cache:
        return _cache[key]

    # 같은 키를 여러 요청이 동시에 미스해도 한 번만 생성 (나머지는 결과 대기)
    lock = _locks.setdefault(key, asyncio.Lock())
    async with lock:
        if key in _cache:  # 락 기다리는 동안 다른 요청이 이미 만들어뒀을 수 있음
            return _cache[key]

        res = await _client.get(src)
        res.raise_for_status()

        # Pillow는 CPU 바운드 동기 작업 — to_thread로 넘겨 다른 요청 처리를 막지 않음
        png = await asyncio.to_thread(_decode_and_compose, res.content, selected)
        _cache[key] = png
        return png
