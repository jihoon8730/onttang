import { colors, fontMono } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import { StyleSheet, Text, View } from "react-native";
import { ledger } from "./ledger-theme";
import RankAvatar from "./rank-avatar";

// 상위 3위 메달색 (1위 accent / 2위 골드 / 3위 브론즈)
const MEDAL: Record<number, string> = {
  1: colors.accent,
  2: ledger.gold,
  3: ledger.bronze,
};

// 장부 한 줄 — 점선 룰로 구분되는 여권 비자 페이지 느낌
export default function RankRow({ entry }: { entry: RankingEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <View style={styles.row}>
      {isTop3 ? (
        <View style={[styles.badge, { backgroundColor: MEDAL[entry.rank] }]}>
          <Text style={styles.badgeText}>{entry.rank}</Text>
        </View>
      ) : (
        <Text style={styles.rankPlain}>
          {String(entry.rank).padStart(2, "0")}
        </Text>
      )}
      <RankAvatar entry={entry} />
      <Text style={styles.name} numberOfLines={1}>
        {entry.nickname ?? "익명의 탐험가"}
      </Text>
      <Text style={styles.count}>{comma(entry.stamp_count)}곳</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderStyle: "dashed",
    borderColor: ledger.rule,
  },
  badge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: fontMono,
    fontSize: 12,
    fontWeight: "800",
    color: colors.white,
  },
  rankPlain: {
    width: 24,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 13.5,
    fontWeight: "700",
    color: "#b3ad9e",
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.2,
  },
  count: {
    fontFamily: fontMono,
    fontSize: 13,
    fontWeight: "700",
    color: colors.accentDark,
  },
});
