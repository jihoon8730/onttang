import { API_URL, DEV_HOST } from "@/constants/config";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchMyStamps, fetchMyStats } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { AuthRequest, makeRedirectUri } from "expo-auth-session";
import { Image } from "expo-image";
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
      <View style={styles.header}>
        <Text style={styles.title}>{user?.nickname ?? "나"}님의 영토</Text>
      </View>
      {stats ? (
        <View style={styles.statsCard}>
          <Text style={styles.statsText}>
            서울 정복 {stats.stamped} / {stats.total} (
            {Math.round(stats.rate * 100)}%)
          </Text>
        </View>
      ) : null}

      <FlashList
        data={stamps ?? []}
        keyExtractor={(item) => item.content_id}
        ListHeaderComponent={
          <Text style={styles.listHeader}>
            내 스탬프 {stamps?.length ?? 0}곳
          </Text>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>아직 찍은 스탬프가 없어요</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Image
              source={item.image_url}
              style={styles.rowImage}
              contentFit="cover"
            />
            <View style={styles.rowText}>
              <Text style={styles.rowTitle} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={styles.rowMeta} numberOfLines={1}>
                {item.address} · {item.visit_count}회 방문
              </Text>
            </View>
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.header, fontSize: 20 },
  statsCard: {
    backgroundColor: colors.chip,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.card,
    marginBottom: spacing.md,
  },
  statsText: { ...typography.body, fontWeight: "700", color: colors.ink },
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
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.chip,
  },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { ...typography.body, fontWeight: "600", color: colors.ink },
  rowMeta: { ...typography.meta, color: colors.muted },
});
