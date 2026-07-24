import asyncio
import io
import httpx
from PIL import Image, ImageDraw

# 합성된 마커를 재사용 (src+selected+stamped 별로 1회만 생성)
_cache: dict[tuple[str, bool, bool], bytes] = {}

# 같은 마커가 여러 요청에서 동시에 캐시미스 나도 한 번만 생성하도록(thundering herd 방지)
_locks: dict[tuple[str, bool, bool], asyncio.Lock] = {}

# 연결 재사용(매 요청마다 TLS 핸드셰이크 하지 않도록) — 프로세스 생존 기간 동안 유지
_client = httpx.AsyncClient(timeout=15.0)

ACCENT = (47, 122, 85, 255)  # #2F7A55
ACCENT_DARK = (31, 91, 61, 255)  # #1F5B3D (선택)
WHITE = (255, 255, 255, 255)


def _cover_circle(photo: Image.Image, size: int) -> Image.Image:
    """사진을 정사각 센터크롭 후 size로 리사이즈."""
    w, h = photo.size
    s = min(w, h)
    left, top = (w - s) // 2, (h - s) // 2
    photo = photo.crop((left, top, left + s, top + s))
    return photo.resize((size, size), Image.LANCZOS)


def _draw_stamped_badge(canvas: Image.Image, d: int, SS: int) -> None:
    """이미 탐험한 장소 배지 — 바텀시트 목록의 '탐험함' 깃발 씰과 동일한 톤(흰 배경 + accent 테두리 + 깃발).
    가장자리에 안 닿도록 여유 있게 안쪽에 배치."""
    bd = 26 * SS  # 배지 지름
    margin = 14 * SS  # 캔버스 가장자리에서 확실히 떨어뜨려 잘리는 느낌 방지
    bx = d - bd - margin
    by = d - bd - margin
    draw = ImageDraw.Draw(canvas)
    border = int(2 * SS)
    draw.ellipse(
        [bx, by, bx + bd, by + bd], fill=WHITE, outline=ACCENT_DARK, width=border
    )

    # 깃발 아이콘 (막대 + 삼각 깃발) — 리스트의 ⚑ 씰과 같은 모티프
    cx, cy = bx + bd / 2, by + bd / 2
    pole_h = bd * 0.5
    pole_x = cx - bd * 0.12
    top = cy - pole_h / 2
    bottom = cy + pole_h / 2
    draw.line([(pole_x, top), (pole_x, bottom)], fill=ACCENT_DARK, width=int(1.6 * SS))
    flag_w = bd * 0.34
    flag_h = bd * 0.24
    draw.polygon(
        [
            (pole_x, top),
            (pole_x + flag_w, top + flag_h * 0.5),
            (pole_x, top + flag_h),
        ],
        fill=ACCENT_DARK,
    )


def _compose(photo: Image.Image, selected: bool, stamped: bool) -> bytes:
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

    if stamped:
        _draw_stamped_badge(canvas, d, SS)

    out = canvas.resize((w // SS, h // SS), Image.LANCZOS)
    buf = io.BytesIO()
    out.save(buf, "PNG")
    return buf.getvalue()


def _decode_and_compose(raw: bytes, selected: bool, stamped: bool) -> bytes:
    """CPU 연산(디코딩+크롭+합성) — 스레드에서 돌려 이벤트 루프를 막지 않는다."""
    photo = Image.open(io.BytesIO(raw)).convert("RGB")
    return _compose(photo, selected, stamped)


async def build_marker(src: str, selected: bool, stamped: bool = False) -> bytes:
    """원격 사진 → 원형 마커 PNG (캐시)."""
    key = (src, selected, stamped)
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
        png = await asyncio.to_thread(_decode_and_compose, res.content, selected, stamped)
        _cache[key] = png
        return png
