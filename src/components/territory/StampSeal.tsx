import { colors, spacing } from "@/constants/theme";
import { MyStamp } from "@/types/stamp";
import { Image } from "expo-image";
import { Platform, StyleSheet, Text, View } from "react-native";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

// 도장 찍은 날짜 → "07.19"
function stampDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

type Props = { stamp: MyStamp; rotate: number };

// 방문한 곳 = 원형 사진 인장(postmark) — 살짝 기울여 "찍힌" 느낌
export default function StampSeal({ stamp, rotate }: Props) {
  return (
    <View style={styles.cell}>
      <View style={[styles.seal, { transform: [{ rotate: `${rotate}deg` }] }]}>
        {stamp.image_url ? (
          <Image
            source={stamp.image_url}
            style={styles.photo}
            contentFit="cover"
          />
        ) : (
          <View style={styles.noPhoto}>
            <Text style={styles.flag}>⚑</Text>
          </View>
        )}
        {/* 도장 테두리(점선 링) */}
        <View style={styles.ring} pointerEvents="none" />
        {/* 하단 스크림 + 이름·날짜 */}
        <View style={styles.caption}>
          <Text style={styles.name} numberOfLines={1}>
            {stamp.title}
          </Text>
          <Text style={styles.date}>{stampDate(stamp.stamped_at)}</Text>
        </View>
      </View>
    </View>
  );
}

// 다음 탐험을 부르는 빈 도장 슬롯
export function EmptySeal() {
  return (
    <View style={styles.cell}>
      <View style={[styles.seal, styles.emptySeal]}>
        <Text style={styles.emptyPlus}>+</Text>
        <Text style={styles.emptyText}>다음 도장</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1, padding: spacing.xs, alignItems: "center" },
  seal: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: colors.accent,
    backgroundColor: colors.chip,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  photo: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  noPhoto: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  flag: { fontSize: 22, color: colors.accent },
  ring: {
    position: "absolute",
    top: 4,
    left: 4,
    right: 4,
    bottom: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.65)",
  },
  caption: {
    paddingBottom: "12%",
    paddingTop: 6,
    alignItems: "center",
    backgroundColor: "rgba(43,38,32,0.5)",
  },
  name: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
    maxWidth: "86%",
  },
  date: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: "700",
    color: colors.white,
    opacity: 0.85,
  },
  emptySeal: {
    borderStyle: "dashed",
    borderColor: colors.muted,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPlus: { fontSize: 18, color: colors.muted, fontWeight: "400" },
  emptyText: { fontSize: 10, color: colors.muted, fontWeight: "700" },
});
