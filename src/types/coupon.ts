// 쿠폰 이벤트에서 고를 수 있는 상품 카드 1개
export type ProductCard = {
  product_id: number;
  name: string;
  description: string | null;
  icon_ios: string | null;
  icon_android: string | null;
  remaining: number;
  total: number;
};

// 쿠폰 이벤트 전체 — 공통 마일스톤 진행 상황 + 상품 카탈로그
export type CouponCatalog = {
  stamped: number;
  milestone: number;
  eligible: boolean;
  claimed: boolean;
  claimed_product_name: string | null;
  code: string | null;
  claimed_at: string | null;
  products: ProductCard[];
};
