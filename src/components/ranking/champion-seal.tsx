import { colors, fontMono, spacing, typography } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import LottieView from "lottie-react-native";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";
import RankAvatar from "./rank-avatar";

function ChampionSeal({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.wrap}>
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop
        speed={0.65}
        style={styles.confetti}
      />
      <View style={styles.rankBox}>
        <Text style={styles.rankNumber}>1</Text>
        <Text style={styles.rankLabel}>위</Text>
      </View>
      <RankAvatar entry={entry} size={52} />
      <View style={styles.body}>
        <Text style={styles.label}>가장 많이 탐험했어요</Text>
        <Text style={styles.name} numberOfLines={1}>
          {entry.nickname ?? "익명의 탐험가"}
        </Text>
      </View>
      <Text style={styles.count}>{comma(entry.stamp_count)}곳</Text>
    </View>
  );
}

export default memo(ChampionSeal);

const styles = StyleSheet.create({
  wrap: {
    minHeight: 78,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
    marginBottom: spacing.lg,
    overflow: "hidden",
  },
  confetti: {
    position: "absolute",
    top: -42,
    right: -36,
    width: 150,
    height: 150,
    opacity: 0.42,
  },
  rankBox: {
    width: 36,
    alignItems: "center",
  },
  rankNumber: {
    fontFamily: fontMono,
    fontSize: 22,
    fontWeight: "800",
    color: colors.accent,
  },
  rankLabel: {
    ...typography.chip,
    color: colors.muted,
    marginTop: -2,
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    ...typography.meta,
    color: colors.muted,
  },
  name: {
    marginTop: 3,
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 0,
  },
  count: {
    fontFamily: fontMono,
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentDark,
  },
});
