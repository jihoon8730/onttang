import RegionExplorationRate from "@/components/territory/RegionExplorationRate";
import StampSeal, { EmptySeal } from "@/components/territory/StampSeal";
import StatCards from "@/components/territory/StatCards";
import { API_URL, DEV_HOST } from "@/constants/config";
import { colors, fontMono, radius, spacing, typography } from "@/constants/theme";
import { fetchMyStamps, fetchMyStats } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { AuthRequest, makeRedirectUri } from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

//카카오 인증서버 주소록
const discovery = {
  authorizationEndpoint: "https://kauth.kakao.com/oauth/authorize",
  tokenEndpoint: "https://kauth.kakao.com/oauth/token",
};

const KAKAO_REST_KEY = "f7e7cb7e5451452f6be83f1d5e2066b9";
const KAKAO_REDIRECT_URI = `http://${DEV_HOST}:8081/kakao-bridge.html`;

// 도장이 손으로 찍힌 느낌 — 인장마다 살짝 다른 기울기
const SEAL_ROTATIONS = [-6, 5, 4, -5, 3, -4];

export default function Territory() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const login = useAuthStore((s) => s.login);

  const insets = useSafeAreaInsets();

  const { data: stats } = useQuery({
    queryKey: ["my-stats"],
    queryFn: () => fetchMyStats(token!),
    enabled: !!token,
  });

  const { data: stamps } = useQuery({
    queryKey: ["my-stamps"],
    queryFn: () => fetchMyStamps(token!),
    enabled: !!token,
  });

  const redirectUri = makeRedirectUri({
    scheme: "onttang", // 앱 스키마
    path: "oauth/kakao", // 리다이렉트 경로
  });

  async function startLogin() {
    const request = new AuthRequest({
      clientId: KAKAO_REST_KEY,
      redirectUri: KAKAO_REDIRECT_URI, // 카카오엔 브리지 주소를 줌
      scopes: [],
      usePKCE: false,
    });

    const authUrl = await request.makeAuthUrlAsync(discovery);

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

    if (result.type !== "success" || !result.url) return;

    const code = result.url.match(/[?&]code=([^&]+)/)?.[1];
    if (!code) return;

    const res = await fetch(`${API_URL}/auth/kakao`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ code, redirect_uri: KAKAO_REDIRECT_URI }),
    });
    const data = await res.json();
    await login(data.token, data.user);
  }

  if (!token) {
    return (
      <View style={styles.container}>
        <Text style={styles.gateTitle}>내 영토</Text>
        <Text style={styles.gateHint}>
          로그인하고 전국에 내 스탬프를 남겨보세요
        </Text>
        <Pressable onPress={startLogin} style={styles.loginButton}>
          <Text style={styles.loginText}>카카오 로그인</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.dashboard, { paddingTop: insets.top + spacing.lg }]}>
      <FlashList
        data={stamps ?? []}
        keyExtractor={(item) => item.content_id}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xl }}
        ListHeaderComponent={
          <>
            <View style={styles.hero}>
              <Text style={styles.heroEyebrow}>
                {user?.nickname ?? "나"}의 영토
              </Text>
              <Text style={styles.heroTitle}>
                전국{" "}
                <Text style={styles.heroAccent}>{stats?.stamped ?? 0}곳</Text>을{"\n"}
                탐험했어요
              </Text>
              <View style={styles.nation}>
                <View style={styles.meter}>
                  <View
                    style={[
                      styles.meterFill,
                      { width: `${Math.max((stats?.rate ?? 0) * 100, 2)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.nationPct}>
                  전국의 {((stats?.rate ?? 0) * 100).toFixed(1)}%
                </Text>
              </View>
            </View>

            {stats ? (
              <StatCards
                stamped={stats.stamped}
                regionStamped={stats.region_stamped}
                regionTotal={stats.region_total}
                themeStamped={stats.theme_stamped}
                themeTotal={stats.theme_total}
              />
            ) : null}

            {/* 지역별 탐험률 */}
            {stats ? (
              <RegionExplorationRate regions={stats.regions} />
            ) : null}

            <Text style={styles.listHeader}>
              탐험한 곳 {stamps?.length ?? 0}곳
            </Text>
          </>
        }
        numColumns={4}
        ListEmptyComponent={
          <Text style={styles.empty}>아직 탐험한 곳이 없어요</Text>
        }
        ListFooterComponent={
          (stamps?.length ?? 0) > 0 ? (
            <View style={styles.footerRow}>
              <View style={styles.footerCell}>
                <EmptySeal />
              </View>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <StampSeal stamp={item} rotate={SEAL_ROTATIONS[index % SEAL_ROTATIONS.length]} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  gateTitle: { ...typography.header, fontSize: 24 },
  gateHint: { ...typography.body, color: colors.muted, textAlign: "center" },
  loginButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
    marginTop: spacing.md,
  },
  loginText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  dashboard: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.xs,
  },
  heroEyebrow: { ...typography.meta, color: colors.muted },
  heroTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.ink,
    lineHeight: 34,
  },
  heroAccent: { color: colors.accent },
  nation: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.md,
  },
  meter: {
    flex: 1,
    height: 7,
    borderRadius: 999,
    backgroundColor: colors.chip,
    overflow: "hidden",
  },
  meterFill: { height: "100%", borderRadius: 999, backgroundColor: colors.accent },
  nationPct: { fontFamily: fontMono, fontSize: 12, color: colors.muted, fontWeight: "600" },
  listHeader: {
    ...typography.body,
    fontWeight: "600",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    padding: spacing.xl,
  },
  footerRow: { flexDirection: "row" },
  footerCell: { width: "25%" },
});
