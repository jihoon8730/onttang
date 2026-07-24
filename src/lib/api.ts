import { API_URL } from "@/constants/config";
import { Attraction, AttractionDetail } from "@/types/attraction";
import { CouponCatalog } from "@/types/coupon";
import { Rankings } from "@/types/ranking";
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
  if (!res.ok) throw new Error("탐험률 조회 실패");
  return res.json();
}

export async function fetchRankings(
  token?: string | null,
): Promise<Rankings> {
  const res = await fetch(`${API_URL}/rankings`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
  if (!res.ok) throw new Error("랭킹 조회 실패");
  return res.json();
}

export async function fetchCouponCatalog(token: string): Promise<CouponCatalog> {
  const res = await fetch(`${API_URL}/coupons`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("쿠폰 상품 조회 실패");
  return res.json();
}

export async function claimProduct(
  token: string,
  productId: number,
): Promise<{ code: string; product_id: number }> {
  const res = await fetch(`${API_URL}/coupons/${productId}/claim`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "쿠폰 신청 실패");
  return data;
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/me`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("회원 탈퇴 실패");
}
