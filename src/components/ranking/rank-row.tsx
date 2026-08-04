import { colors, fontMono, spacing } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { ledger } from "./ledger-theme";
import RankAvatar from "./rank-avatar";

// 상위 3위 메달색 (1위 accent / 2위 골드 / 3위 브론즈)
const MEDAL: Record<number, string> = {
  1: colors.accent,
  2: ledger.gold,
  3: ledger.bronze,
};

// 탐험가 순위 한 줄
function RankRow({ entry }: { entry: RankingEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <View style={[styles.row, entry.is_me && styles.myRow]}>
      {isTop3 ? (
        <View style={[styles.badge, { backgroundColor: MEDAL[entry.rank] }]}>
          <Text
            style={[
              styles.badgeText,
              entry.rank === 1 && styles.badgeTextDark,
            ]}
          >
            {entry.rank}
          </Text>
        </View>
      ) : (
        <Text style={styles.rankPlain}>
          {String(entry.rank).padStart(2, "0")}
        </Text>
      )}
      <RankAvatar entry={entry} />
      <Text style={styles.name} numberOfLines={1}>
        {entry.is_me ? "나 · " : ""}
        {entry.nickname ?? "익명의 탐험가"}
      </Text>
      <Text style={styles.count}>{comma(entry.stamp_count)}곳</Text>
    </View>
  );
}

export default memo(RankRow);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 58,
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  myRow: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    borderRadius: 10,
    borderBottomWidth: 0,
    marginVertical: 3,
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
  badgeTextDark: {
    color: colors.white,
  },
  rankPlain: {
    width: 28,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 13.5,
    fontWeight: "800",
    color: colors.muted,
  },
  name: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: 0,
  },
  count: {
    fontFamily: fontMono,
    fontSize: 13,
    fontWeight: "900",
    color: colors.accentDark,
  },
});
