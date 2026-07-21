import { API_URL } from "@/constants/config";
import { Attraction, AttractionDetail } from "@/types/attraction";
import { MyStamp, MyStats } from "@/types/stamp";

export async function fetchAttractions(): Promise<Attraction[]> {
  const res = await fetch(`${API_URL}/attractions/db`);
  if (!res.ok) throw new Error("서버 응답 오류");
  return res.json();
}

export async function fetchAttractionDetail(
  id: string,
): Promise<AttractionDetail> {
  const res = await fetch(`${API_URL}/attractions/${id}`);
  if (!res.ok) throw new Error("상세 조회 실패");
  return res.json();
}

export async function fetchMyStamps(token: string): Promise<MyStamp[]> {
  const res = await fetch(`${API_URL}/me/stamps`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("내 스탬프 조회 실패");
  return res.json();
}

export async function fetchMyStats(token: string): Promise<MyStats> {
  const res = await fetch(`${API_URL}/me/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("정복률 조회 실패");
  return res.json();
}
