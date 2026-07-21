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
};
