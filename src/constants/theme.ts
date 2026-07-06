import type { TextStyle } from "react-native";
// 색상 토큰
export const colors = {
  accent: "#E8643C", // 점령/CTA/브랜드
  accentDark: "#b8431f", // 버튼 눌림 그림자
  accentSoft: "#fdeee7", // 선택 행 배경
  ink: "#2b2b2b", // 본문
  muted: "#9a958c", // 보조 텍스트
  hairline: "#efece6", // 구분선/테두리
  background: "#ffffff", // 페이지 배경
  chip: "#f0ede7", // 칩 배경
  gps: "#2A63C4", // 현재 위치 점
  white: "#ffffff",
} as const;

// 카테고리 (썸네일 틴트 / 아이콘색)
export const category = {
  nature: { tint: "#e7efe3", icon: "#6f8f5e" },
  history: { tint: "#efe6db", icon: "#a3835c" },
  shopping: { tint: "#efe3ea", icon: "#a76b91" },
  culture: { tint: "#e6eaf0", icon: "#6f82a8" },
  etc: { tint: "#e9e6df", icon: "#8a857c" },
} as const;

// 간격 / 반경
export const spacing = { xs: 6, sm: 8, md: 10, lg: 12, xl: 16 } as const;
export const radius = { card: 12, sheet: 22, button: 12, chip: 12 } as const;

// 그림자 (CSS boxShadow 문자열)
export const shadow = {
  card: "0 4px 14px -10px rgba(0,0,0,0.2)",
  sheet: "0 -8px 30px -8px rgba(0,0,0,0.2)",
  buttonPressed: "0 4px 0 #b8431f",
} as const;

// 타이포 프리셋 (Pretendard 스케일)
export const typography = {
  title: { fontSize: 21, fontWeight: "800" },
  header: { fontSize: 18, fontWeight: "800" },
  body: { fontSize: 14, fontWeight: "400", lineHeight: 21 },
  meta: { fontSize: 12, fontWeight: "600" },
  chip: { fontSize: 11, fontWeight: "700" },
} as const satisfies Record<string, TextStyle>;
