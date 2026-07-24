import { colors } from "@/constants/theme";
import { RankingEntry } from "@/types/ranking";
import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

// 랭킹 목록/내 순위 배너에서 공용으로 쓰는 아바타 (프로필 사진 or 이니셜 폴백)
export default function RankAvatar({
  entry,
  mine,
}: {
  entry: RankingEntry;
  mine?: boolean;
}) {
  if (entry.profile_image) {
    return (
      <Image
        style={styles.avatar}
        source={entry.profile_image}
        contentFit="cover"
      />
    );
  }
  const initial = (entry.nickname ?? "?").trim().charAt(0) || "?";
  return (
    <View
      style={[styles.avatar, styles.avatarFallback, mine && styles.avatarMine]}
    >
      <Text style={[styles.avatarInitial, mine && styles.avatarInitialMine]}>
        {initial}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chip,
    overflow: "hidden",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarMine: { backgroundColor: colors.accentSoft },
  avatarInitial: { fontSize: 16, fontWeight: "800", color: colors.muted },
  avatarInitialMine: { color: colors.accent },
});
