import { colors, radius, spacing, typography } from "@/constants/theme";
import { useKakaoLogin } from "@/hooks/use-kakao-login";
import { deleteAccount } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import LottieView from "lottie-react-native";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// TODO: 메뉴 화면 구현 시 되살리기
// const ACCOUNT_ITEMS = ["알림", "연결된 계정"];
// const INFO_ITEMS = ["공지사항", "문의하기", "이용약관 및 개인정보처리방침"];

export default function More() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { startLogin } = useKakaoLogin();
  const router = useRouter();

  const insets = useSafeAreaInsets();

  const handleDeleteAccount = () => {
    Alert.alert(
      "회원 탈퇴",
      "탈퇴하면 내 스탬프와 탐험 기록이 모두 삭제되며 되돌릴 수 없어요. 정말 탈퇴할까요?",
      [
        { text: "취소", style: "cancel" },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              await deleteAccount(token);
              await logout(); // 서버 삭제 성공 후 로컬 세션(토큰·유저) 정리
            } catch {
              Alert.alert("오류", "탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.");
            }
          },
        },
      ],
    );
  };

  if (!token) {
    return (
      <View style={styles.gateContainer}>
        <View style={styles.gateIllustration}>
          <LottieView
            source={require("../../assets/lottie/profile.json")}
            autoPlay
            loop
            style={{ width: 140, height: 140 }}
          />
        </View>

        <Text style={styles.gateTitle}>프로필 및 설정</Text>
        <Text style={styles.gateHint}>
          로그인하고 내 정보와{"\n"}앱 설정을 관리해 보세요
        </Text>

        <Pressable onPress={startLogin} style={styles.kakaoButton}>
          <SymbolView
            name="message.fill"
            size={18}
            tintColor="#000000"
            style={styles.kakaoIcon}
          />
          <Text style={styles.kakaoText}>카카오 로그인</Text>
        </Pressable>
      </View>
    );
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl,
      }}
    >
      <Text style={styles.screenTitle}>더보기</Text>

      <View style={styles.profile}>
        <View style={styles.avatar}>
          <View style={styles.avatarClip}>
            {user?.profile_image ? (
              <Image
                style={styles.avatarImage}
                source={user.profile_image}
                contentFit="cover"
              />
            ) : (
              <SymbolView
                name="person.fill"
                size={40}
                tintColor={colors.muted}
              />
            )}
          </View>
        </View>
        <Text style={styles.name}>{user?.nickname ?? "나"}</Text>
      </View>

      {/* TODO: 실제 화면 연결 시 되살리기 (알림/연결된 계정/공지/문의/약관)
      <View style={styles.group}>
        <Text style={styles.groupLabel}>계정</Text>
        <View style={styles.groupBody}>
          {ACCOUNT_ITEMS.map((label, i) => (
            <Pressable
              key={label}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowLabel}>{label}</Text>
              <SymbolView
                name="chevron.right"
                size={13}
                tintColor={colors.muted}
              />
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>정보</Text>
        <View style={styles.groupBody}>
          {INFO_ITEMS.map((label, i) => (
            <Pressable
              key={label}
              style={({ pressed }) => [
                styles.row,
                i > 0 && styles.rowDivider,
                pressed && styles.rowPressed,
              ]}
            >
              <Text style={styles.rowLabel}>{label}</Text>
              <SymbolView
                name="chevron.right"
                size={13}
                tintColor={colors.muted}
              />
            </Pressable>
          ))}
        </View>
      </View>
      */}

      <View style={styles.group}>
        <Text style={styles.groupLabel}>정보</Text>
        <View style={styles.groupBody}>
          <Pressable
            onPress={() => router.push("/legal")}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.rowLabel}>이용약관 및 개인정보처리방침</Text>
            <SymbolView
              name="chevron.right"
              size={13}
              tintColor={colors.muted}
            />
          </Pressable>
        </View>
      </View>

      <Pressable onPress={logout} style={styles.logoutButton}>
        <Text style={styles.logoutText}>로그아웃</Text>
      </Pressable>

      <Pressable
        onPress={handleDeleteAccount}
        style={({ pressed }) => [styles.deleteAccount, pressed && { opacity: 0.5 }]}
      >
        <Text style={styles.deleteAccountText}>회원 탈퇴</Text>
      </Pressable>

      <Text style={styles.version}>ONTTANG v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  gateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  gateIllustration: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  gateTitle: {
    ...typography.title,
    fontSize: 28,
    color: colors.ink,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  gateHint: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: spacing.xl * 1.5,
  },
  kakaoButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FEE500",
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    width: "100%",
    borderRadius: radius.button,
    gap: 8,
  },
  kakaoIcon: {
    opacity: 0.85,
  },
  kakaoText: {
    color: "rgba(0, 0, 0, 0.85)",
    fontWeight: "700",
    fontSize: 16,
  },
  group: {
    marginTop: spacing.xl,
  },
  groupLabel: {
    ...typography.meta,
    fontSize: 13,
    fontWeight: "600",
    color: colors.muted,
    letterSpacing: 0.3,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },
  groupBody: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
  },
  rowDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  rowPressed: {
    backgroundColor: colors.chip,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  logoutButton: {
    marginTop: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.hairline,
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.button,
  },
  logoutText: {
    color: colors.muted,
    fontWeight: "600",
    fontSize: 15,
    letterSpacing: -0.2,
  },
  deleteAccount: {
    alignItems: "center",
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  deleteAccountText: {
    ...typography.meta,
    color: colors.muted,
    textDecorationLine: "underline",
  },
  version: {
    ...typography.meta,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xl,
    letterSpacing: 1.0,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    paddingVertical: spacing.md,
  },
  profile: {
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.lg,
  },
  avatar: {
    width: 92,
    height: 92,
  },
  avatarClip: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 3,
    borderColor: colors.accent,
    backgroundColor: colors.chip,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.4,
  },
});
