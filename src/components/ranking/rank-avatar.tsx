import { colors } from "@/constants/theme";
import { RankingEntry } from "@/types/ranking";
import { Image } from "expo-image";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

// 랭킹 목록/내 순위 배너에서 공용으로 쓰는 아바타 (프로필 사진 or 이니셜 폴백)
function RankAvatar({
  entry,
  mine,
  size = 40,
}: {
  entry: RankingEntry;
  mine?: boolean;
  size?: number;
}) {
  const avatarSize = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (entry.profile_image) {
    return (
      <Image
        style={[styles.avatar, avatarSize]}
        source={entry.profile_image}
        contentFit="cover"
      />
    );
  }
  const initial = (entry.nickname ?? "?").trim().charAt(0) || "?";
  return (
    <View
      style={[
        styles.avatar,
        avatarSize,
        styles.avatarFallback,
        mine && styles.avatarMine,
      ]}
    >
      <Text
        style={[
          styles.avatarInitial,
          { fontSize: Math.max(15, size * 0.4) },
          mine && styles.avatarInitialMine,
        ]}
      >
        {initial}
      </Text>
    </View>
  );
}

export default memo(RankAvatar);

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.chip,
    overflow: "hidden",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  // "내 순위" 카드 자체가 accentSoft 톤이라, 아바타는 흰 배경+accent 테두리로 대비를 줌
  avatarMine: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.accent,
  },
  avatarInitial: { fontSize: 16, fontWeight: "800", color: colors.muted },
  avatarInitialMine: { color: colors.accent },
});
