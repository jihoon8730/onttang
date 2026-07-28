// 백그라운드 geofence 등록용 — 현재 위치 기준 가까운 대표 관광지
export type NearbyAttraction = {
  content_id: string;
  title: string;
  latitude: number;
  longitude: number;
  distance_m: number;
};
