from math import radians, sin, cos, asin, sqrt

EARTH_RADIUS_M = 6371000


def distance_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """두 GPS 좌표 사이 실제 거리(미터). 하버사인 공식."""
    dlat = radians(lat2 - lat1)
    dlng = radians(lng2 - lng1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlng / 2) ** 2
    return 2 * EARTH_RADIUS_M * asin(sqrt(a))
