import { colors, radius, spacing, typography } from "@/constants/theme";
import { useAppleLogin } from "@/hooks/use-apple-login";
import { useKakaoLogin } from "@/hooks/use-kakao-login";
import { useAuthStore } from "@/stores/use-auth-store";
import * as AppleAuthentication from "expo-apple-authentication";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Login() {
  const { startLogin } = useKakaoLogin();
  const { startLogin: startAppleLogin } = useAppleLogin();
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // 로그인 성공(토큰 발급) 시 모달 닫고 원래 화면으로
  useEffect(() => {
    if (token) router.back();
  }, [token, router]);

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
      ]}
    >
      <View style={styles.hero}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.logo}
          contentFit="contain"
          accessibilityLabel="온땅"
        />
        <Text style={styles.tagline}>
          관광지를 탐험하고 도장을 찍어{"\n"}전국을 나만의 영토로
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={startLogin} style={styles.kakaoButton}>
          <SymbolView
            name={{ ios: "message.fill", android: "chat" }}
            size={18}
            tintColor="#000000"
            style={styles.kakaoIcon}
          />
          <Text style={styles.kakaoText}>카카오로 시작하기</Text>
        </Pressable>

        {/* 애플 로그인은 iOS 전용 (애플 심사 4.8 대응, 공식 버튼 필수) */}
        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            cornerRadius={radius.button}
            style={styles.appleButton}
            onPress={startAppleLogin}
          />
        )}

        <Pressable onPress={() => router.back()} style={styles.guestButton}>
          <Text style={styles.guestText}>게스트로 둘러보기 →</Text>
        </Pressable>

        <Text style={styles.notice}>
          로그인하면 스탬프·내 영토·랭킹을 이용할 수 있어요
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 28,
    justifyContent: "center",
  },
  hero: {
    alignItems: "center",
    marginBottom: spacing.xl * 2.5,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 22,
    marginBottom: spacing.lg,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 6,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: colors.ink,
    textAlign: "center",
  },
  actions: { gap: spacing.md },
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    paddingVertical: 16,
    borderRadius: radius.button,
    gap: 8,
  },
  kakaoIcon: { opacity: 0.85 },
  appleButton: { height: 52, width: "100%" },
  kakaoText: {
    color: "rgba(0, 0, 0, 0.85)",
    fontWeight: "700",
    fontSize: 16,
  },
  guestButton: {
    borderWidth: 1.5,
    borderColor: colors.ink,
    paddingVertical: 15,
    borderRadius: radius.button,
    alignItems: "center",
  },
  guestText: {
    color: colors.ink,
    fontWeight: "700",
    fontSize: 15,
  },
  notice: {
    ...typography.meta,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xs,
  },
});
