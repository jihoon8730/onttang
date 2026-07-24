import { colors, fontMono } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import { StyleSheet, Text, View } from "react-native";
import RankAvatar from "./rank-avatar";

// 상위 3위 메달색 (1위 accent / 2위 골드 / 3위 브론즈)
const MEDAL: Record<number, string> = {
  1: colors.accent,
  2: "#caa86a",
  3: "#c08457",
};

export default function RankRow({ entry }: { entry: RankingEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <View style={[styles.row, isTop3 && styles.rowBordered]}>
      {isTop3 ? (
        <View style={[styles.badge, { backgroundColor: MEDAL[entry.rank] }]}>
          <Text style={styles.badgeText}>{entry.rank}</Text>
        </View>
      ) : (
        <Text style={styles.rankPlain}>{entry.rank}</Text>
      )}
      <RankAvatar entry={entry} />
      <View style={styles.info}>
        <Text
          style={[styles.name, !isTop3 && styles.nameDim]}
          numberOfLines={1}
        >
          {entry.nickname ?? "익명의 탐험가"}
        </Text>
        <Text style={styles.count}>{comma(entry.stamp_count)}곳</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 0,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  rowBordered: {
    borderWidth: 1.5,
    borderColor: colors.accentSoft,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: fontMono,
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  rankPlain: {
    width: 28,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  nameDim: { fontWeight: "600", color: colors.muted },
  count: { fontFamily: fontMono, fontSize: 12, color: colors.muted },
});
