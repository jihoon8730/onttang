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
