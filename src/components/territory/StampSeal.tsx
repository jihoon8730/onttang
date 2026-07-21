import { colors, spacing } from "@/constants/theme";
import { MyStamp } from "@/types/stamp";
import { Platform, StyleSheet, Text, View } from "react-native";

const MONO = Platform.select({ ios: "Menlo", default: "monospace" });

// 도장 찍은 날짜 → "07.19"
function stampDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

type Props = { stamp: MyStamp; rotate: number };

// 방문한 곳 = 잉크 도장(postmark) 인장 — 살짝 기울여 "찍힌" 느낌
export default function StampSeal({ stamp, rotate }: Props) {
  return (
    <View style={styles.cell}>
      <View style={[styles.seal, { transform: [{ rotate: `${rotate}deg` }] }]}>
        <View style={styles.innerRing} pointerEvents="none" />
        <Text style={styles.flag}>⚑</Text>
        <Text style={styles.name} numberOfLines={1}>
          {stamp.title}
        </Text>
        <Text style={styles.date}>{stampDate(stamp.stamped_at)}</Text>
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
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  innerRing: {
    position: "absolute",
    top: 5,
    left: 5,
    right: 5,
    bottom: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.accent,
    opacity: 0.45,
  },
  flag: { fontSize: 10, color: colors.accent },
  name: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.accent,
    maxWidth: "86%",
  },
  date: {
    fontFamily: MONO,
    fontSize: 9,
    fontWeight: "700",
    color: colors.accent,
    opacity: 0.8,
  },
  emptySeal: { borderStyle: "dashed", borderColor: colors.muted, borderWidth: 2 },
  emptyPlus: { fontSize: 18, color: colors.muted, fontWeight: "400" },
  emptyText: { fontSize: 10, color: colors.muted, fontWeight: "700" },
});
