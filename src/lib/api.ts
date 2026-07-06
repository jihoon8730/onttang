import { API_URL } from "@/constants/config";
import { Attraction, AttractionDetail } from "@/types/attraction";

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
