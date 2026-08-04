import { colors, fontMono } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import RankAvatar from "./rank-avatar";

// 티켓 스텁(내 순위 고정 바) 안에 들어가는 한 줄 — 스텁 자체가 카드이므로 배경/그림자는 없음
function MeRow({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.meRow}>
      <Text style={styles.meRank}>
        {String(entry.rank).padStart(2, "0")}
      </Text>
      <RankAvatar entry={entry} mine size={38} />
      <Text style={styles.meName} numberOfLines={1}>
        나 · {entry.nickname ?? "탐험가"}
      </Text>
      <Text style={styles.meCount}>{comma(entry.stamp_count)}곳</Text>
    </View>
  );
}

export default memo(MeRow);

const styles = StyleSheet.create({
  meRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  meRank: {
    width: 24,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 13.5,
    fontWeight: "800",
    color: colors.accentDark,
  },
  meName: {
    flex: 1,
    minWidth: 0,
    fontSize: 14.5,
    fontWeight: "800",
    color: colors.ink,
  },
  meCount: {
    fontFamily: fontMono,
    fontSize: 13,
    fontWeight: "900",
    color: colors.accentDark,
  },
});
