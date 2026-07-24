import { colors, fontMono } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import { StyleSheet, Text, View } from "react-native";
import RankAvatar from "./rank-avatar";

export default function MeRow({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.meRow}>
      <Text style={styles.meRank}>{entry.rank}</Text>
      <RankAvatar entry={entry} mine />
      <View style={styles.info}>
        <Text style={styles.meName} numberOfLines={1}>
          나 · {entry.nickname ?? "탐험가"}
        </Text>
        <Text style={styles.meCount}>{comma(entry.stamp_count)}곳</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  meRank: {
    width: 26,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  meName: { fontSize: 14, fontWeight: "700", color: colors.ink },
  meCount: { fontFamily: fontMono, fontSize: 11, color: colors.muted },
});
