// 천 단위 콤마 (Hermes Intl 미지원 대비 직접 포맷)
export function comma(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
