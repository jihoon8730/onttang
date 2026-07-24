import { colors, fontMono, spacing } from "@/constants/theme";
import { comma } from "@/lib/format";
import { RankingEntry } from "@/types/ranking";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { StyleSheet, Text, View } from "react-native";

function ChampionAvatar({ entry }: { entry: RankingEntry }) {
  if (entry.profile_image) {
    return (
      <Image
        style={styles.champAvatar}
        source={entry.profile_image}
        contentFit="cover"
      />
    );
  }
  const initial = (entry.nickname ?? "?").trim().charAt(0) || "?";
  return (
    <View style={[styles.champAvatar, styles.champAvatarFallback]}>
      <Text style={styles.champInitial}>{initial}</Text>
    </View>
  );
}

// 랭킹 1위 스포트라이트 카드
export default function ChampionCard({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.champion}>
      <View style={styles.championInner}>
        <LottieView
          source={require("../../assets/lottie/confetti.json")}
          autoPlay
          loop
          speed={0.7}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
        <Text style={styles.champLabel}>최다 탐험 챔피언</Text>
        <ChampionAvatar entry={entry} />
        <Text style={styles.champName} numberOfLines={1}>
          {entry.nickname ?? "익명의 탐험가"}
        </Text>
        <Text style={styles.champCountRow}>
          <Text style={styles.champCount}>{comma(entry.stamp_count)}</Text> 곳
          탐험
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  champion: {
    borderRadius: 24,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 1,
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  championInner: {
    alignItems: "center",
    paddingVertical: spacing.xl * 1.2,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    overflow: "hidden",
  },
  champLabel: {
    fontFamily: fontMono,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.accent,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  champAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.chip,
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 0,
  },
  champAvatarFallback: { alignItems: "center", justifyContent: "center" },
  champInitial: { fontSize: 30, fontWeight: "800", color: colors.muted },
  champName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  champCountRow: {
    fontFamily: fontMono,
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  champCount: { fontSize: 24, fontWeight: "800", color: colors.accent },
});
