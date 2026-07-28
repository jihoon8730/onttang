import QuickMenuItem from "@/components/more/quick-menu-item";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { deleteAccount } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useSettingsStore } from "@/stores/use-settings-store";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import LottieView from "lottie-react-native";
import {
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// TODO: 메뉴 화면 구현 시 되살리기
// const ACCOUNT_ITEMS = ["알림", "연결된 계정"];
// const INFO_ITEMS = ["공지사항", "문의하기", "이용약관 및 개인정보처리방침"];

export default function More() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const router = useRouter();

  const backgroundStampsEnabled = useSettingsStore(
    (s) => s.backgroundStampsEnabled,
  );
  const setBackgroundStampsEnabled = useSettingsStore(
    (s) => s.setBackgroundStampsEnabled,
  );

  const insets = useSafeAreaInsets();

  // 토글 ON: "항상 허용" 위치 권한 + 알림 권한까지 받아야만 실제로 켠다.
  // 거부되면 설정값은 그대로 꺼진 채로 두고, 왜 안 켜졌는지 안내한다.
  const handleToggleBackgroundStamps = async (value: boolean) => {
    if (!value) {
      await setBackgroundStampsEnabled(false);
      return;
    }

    const { status: fgStatus } =
      await Location.requestForegroundPermissionsAsync();
    if (fgStatus !== "granted") {
      Alert.alert(
        "위치 권한이 필요해요",
        "자동 스탬프를 쓰려면 위치 권한이 필요해요",
      );
      return;
    }

    const { status: bgStatus } =
      await Location.requestBackgroundPermissionsAsync();
    if (bgStatus !== "granted") {
      Alert.alert(
        "'항상 허용'이 필요해요",
        "앱을 열지 않아도 자동으로 스탬프를 찍으려면, 설정 앱에서 온땅의 위치 권한을 '항상 허용'으로 바꿔주세요.",
        [
          { text: "취소", style: "cancel" },
          { text: "설정으로 이동", onPress: () => Linking.openSettings() },
        ],
      );
      return;
    }

    await Notifications.requestPermissionsAsync();
    await setBackgroundStampsEnabled(true);
  };

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
              Alert.alert(
                "오류",
                "탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.",
              );
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

        <Pressable
          onPress={() => router.push("/login")}
          style={styles.kakaoButton}
        >
          <Text style={styles.kakaoText}>로그인하기</Text>
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
                name={{ ios: "person.fill", android: "person" }}
                size={40}
                tintColor={colors.muted}
              />
            )}
          </View>
        </View>
        <Text style={styles.name}>{user?.nickname ?? "나"}</Text>
      </View>

      <View style={styles.quickMenu}>
        <QuickMenuItem
          icon={require("../../assets/images/clay_stamp.png")}
          label="스탬프 이벤트"
          onPress={() => router.push("/coupon-box")}
        />
        <QuickMenuItem
          icon={require("../../assets/images/clay_my_coupon.png")}
          label="내 쿠폰함"
          onPress={() => router.push("/my-coupons")}
        />
        <QuickMenuItem
          icon={require("../../assets/images/clay_headset.png")}
          label="고객센터"
          onPress={() => Alert.alert("고객센터", "준비 중 이에요 곧 만나요!")}
        />
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
                name={{ ios: "chevron.right", android: "chevron_right" }}
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
                name={{ ios: "chevron.right", android: "chevron_right" }}
                size={13}
                tintColor={colors.muted}
              />
            </Pressable>
          ))}
        </View>
      </View>
      */}

      <View style={styles.group}>
        <Text style={styles.groupLabel}>설정</Text>
        <Pressable
          style={[
            styles.autoStampCard,
            backgroundStampsEnabled && styles.autoStampCardActive,
          ]}
          onPress={() => handleToggleBackgroundStamps(!backgroundStampsEnabled)}
        >
          <View style={styles.autoStampTop}>
            <View
              style={[
                styles.autoStampIconWrap,
                backgroundStampsEnabled && styles.autoStampIconWrapActive,
                { backgroundColor: "transparent" }
              ]}
            >
              <Image
                source={require("../../assets/images/clay_location.png")}
                style={{ width: 48, height: 48, borderRadius: 24 }}
                contentFit="cover"
              />
            </View>
            <View style={styles.autoStampTextBox}>
              <Text style={styles.autoStampTitle}>자동 스탬프 찍기</Text>
              <Text style={styles.autoStampDesc}>
                근처에 가면 알아서 스탬프를 쾅!{"\n"}앱을 안 켜도 자동으로 찍어드려요
              </Text>
            </View>
            <Switch
              value={backgroundStampsEnabled}
              onValueChange={handleToggleBackgroundStamps}
              trackColor={{ true: colors.accent }}
              style={{ transform: [{ scale: 0.9 }] }}
            />
          </View>
          {backgroundStampsEnabled && (
            <View style={styles.autoStampBadge}>
              <SymbolView
                name={{ ios: "location.viewfinder", android: "my_location" }}
                size={14}
                tintColor={colors.accent}
              />
              <Text style={styles.autoStampBadgeText}>
                현재 위치 주변을 실시간으로 탐색 중이에요
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.group}>
        <Text style={styles.groupLabel}>정보</Text>
        <View style={styles.groupBody}>
          <Pressable
            onPress={() => router.push("/legal")}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            <Text style={styles.rowLabel}>이용약관 및 개인정보처리방침</Text>
            <SymbolView
              name={{ ios: "chevron.right", android: "chevron_right" }}
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
        style={({ pressed }) => [
          styles.deleteAccount,
          pressed && { opacity: 0.5 },
        ]}
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
    backgroundColor: colors.accent,
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
    color: colors.white,
    fontWeight: "700",
    fontSize: 16,
  },
  quickMenu: {
    flexDirection: "row",
    backgroundColor: colors.white,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,

    justifyContent: "space-around",
    alignItems: "flex-start",
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
  autoStampCard: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.hairline,
    padding: spacing.lg,
  },
  autoStampCardActive: {
    borderColor: colors.accent,
    backgroundColor: `${colors.accent}08`, // Slight tint for premium feel
  },
  autoStampTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  autoStampIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.chip,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  autoStampIconWrapActive: {
    backgroundColor: colors.accent,
  },
  autoStampTextBox: {
    flex: 1,
    marginRight: spacing.sm,
    gap: 4,
  },
  autoStampTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
    letterSpacing: -0.3,
  },
  autoStampDesc: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
    lineHeight: 18,
    letterSpacing: -0.2,
  },
  autoStampBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: `${colors.accent}30`,
  },
  autoStampBadgeText: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: "600",
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
