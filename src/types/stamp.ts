// 내가 찍은 스탬프 한 개
export type MyStamp = {
  content_id: string;
  title: string;
  address: string | null;
  image_url: string | null;
  category: string | null;
  visit_count: number;
  stamped_at: string;
};

// 지역별 탐험률 한 개
export type RegionStat = {
  code: string;
  name: string;
  stamped: number;
  total: number;
  rate: number;
};

// 탐험률
export type MyStats = {
  stamped: number;
  total: number;
  rate: number;
  regions: RegionStat[];
  region_stamped: number; // 밟은 지역 수
  region_total: number; // 전체 지역 수 (16)
  theme_stamped: number; // 찍은 테마 수
  theme_total: number; // 전체 테마 수 (4)
};
