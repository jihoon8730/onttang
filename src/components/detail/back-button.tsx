import { colors, spacing } from "@/constants/theme";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 상세화면 좌상단 뒤로가기 (iOS 리퀴드글래스 / Android·기타 솔리드)
export default function BackButton() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const useGlass = isLiquidGlassAvailable();
  const showBackButton = useGlass || Platform.OS === "android";

  if (!showBackButton) return null;

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={spacing.sm}
      style={[styles.backButton, { top: insets.top + spacing.sm }]}
    >
      {useGlass ? (
        <GlassView
          style={styles.backButtonShape}
          glassEffectStyle="clear"
          isInteractive
        >
          <Text style={styles.backIcon}>‹</Text>
        </GlassView>
      ) : (
        <View style={[styles.backButtonShape, styles.backButtonSolid]}>
          <Text style={styles.backIcon}>‹</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    position: "absolute",
    left: spacing.lg,
    zIndex: 10,
  },
  backButtonShape: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonSolid: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backIcon: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
    marginRight: 2,
  },
});
