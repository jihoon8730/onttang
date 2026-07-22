import RegionExplorationRate from "@/components/territory/RegionExplorationRate";
import StampSeal, { EmptySeal } from "@/components/territory/StampSeal";
import { MyStamp } from "@/types/stamp";
import StatCards from "@/components/territory/StatCards";
import {
  colors,
  fontMono,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { useRouter } from "expo-router";
import { fetchMyStamps, fetchMyStats } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { SymbolView } from "expo-symbols";
import LottieView from "lottie-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 도장이 손으로 찍힌 느낌 — 인장마다 살짝 다른 기울기
const SEAL_ROTATIONS = [-6, 5, 4, -5, 3, -4];

// "다음 도장" 빈 슬롯 = 그리드 마지막에 붙이는 sentinel (실제 content_id와 충돌 안 나게)
const NEXT_SLOT_ID = "__next_slot__";
const NEXT_SLOT: MyStamp = {
  content_id: NEXT_SLOT_ID,
  title: "",
  address: null,
  image_url: null,
  category: null,
  visit_count: 0,
  stamped_at: "",
};

export default function Territory() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const router = useRouter();

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

  if (!token) {
    return (
      <View style={styles.gateContainer}>
        <View style={styles.gateIllustration}>
          <LottieView
            source={require("../../assets/lottie/map.json")}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />
          <View style={styles.gateBadge}>
            <SymbolView name="checkmark.seal.fill" size={24} tintColor={colors.white} />
          </View>
        </View>

        <Text style={styles.gateTitle}>나만의 탐험 지도</Text>
        <Text style={styles.gateHint}>
          로그인하고 전국 방방곡곡의{"\n"}특별한 장소들을 수집해 보세요
        </Text>

        <Pressable onPress={() => router.push("/login")} style={styles.kakaoButton}>
          <Text style={styles.kakaoText}>로그인하기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.dashboard, { paddingTop: insets.top + spacing.lg }]}>
      <FlashList
        data={
          (stamps?.length ?? 0) > 0 ? [...stamps!, NEXT_SLOT] : stamps ?? []
        }
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
                <Text style={styles.heroAccent}>{stats?.stamped ?? 0}곳</Text>을
                {"\n"}
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
            {stats ? <RegionExplorationRate regions={stats.regions} /> : null}

            <Text style={styles.listHeader}>
              탐험한 곳 {stamps?.length ?? 0}곳
            </Text>
          </>
        }
        numColumns={4}
        ListEmptyComponent={
          <Text style={styles.empty}>아직 탐험한 곳이 없어요</Text>
        }
        renderItem={({ item, index }) =>
          item.content_id === NEXT_SLOT_ID ? (
            <EmptySeal />
          ) : (
            <StampSeal
              stamp={item}
              rotate={SEAL_ROTATIONS[index % SEAL_ROTATIONS.length]}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
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
  gateBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentDark,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: colors.background,
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
  meterFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.accent,
  },
  nationPct: {
    fontFamily: fontMono,
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
  },
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
});
