export function extractHref(html: string): string | null {
  const match = html.match(/href="([^"]*)"/);
  return match ? match[1] : null;
}

/**
 * TourAPI 운영 정보 텍스트를 읽기 좋게 정리한다.
 * - <br> 태그 → 줄바꿈
 * - "[구간]" 앞에 줄바꿈 (계절별 운영시간 등이 한 줄로 붙어 오는 경우)
 * 구분자가 없으면 원문을 그대로 반환한다.
 */
export function formatInfoText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/\s*\[/g, "\n[")
    .trim();
}

/**
 * 하버사인 공식을 이용해 두 GPS 좌표 사이의 거리를 미터 단위로 계산합니다.
 */
export function getDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
