import { Image } from "expo-image";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  onPress: () => void;
  onDismiss: () => void;
};

// 바텀시트 리스트 상단 — 로그인했지만 자동 스탬프를 아직 안 켠 사용자에게만 노출
export default function AutoStampBanner({ onPress, onDismiss }: Props) {
  return (
    <Pressable style={styles.banner} onPress={onPress}>
      <View style={styles.iconWrap}>
        <Image
          source={require("../../assets/images/clay_location.png")}
          style={{ width: 44, height: 44 }}
          contentFit="cover"
        />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title}>앱을 안 켜도 스탬프가 쾅!</Text>
        <Text style={styles.desc}>
          근처에 가면 알아서 스탬프를 찍어드려요
        </Text>
      </View>
      <Pressable
        style={styles.closeButton}
        hitSlop={10}
        onPress={(e) => {
          e.stopPropagation();
          onDismiss();
        }}
      >
        <SymbolView
          name={{ ios: "xmark", android: "close" }}
          size={13}
          tintColor={colors.muted}
        />
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: {
    flex: 1,
    gap: 3,
  },
  title: {
    ...typography.meta,
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  desc: {
    ...typography.meta,
    color: colors.muted,
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  closeButton: {
    padding: 4,
  },
});
