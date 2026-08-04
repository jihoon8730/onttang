import ChampionSeal from "@/components/ranking/champion-seal";
import MeRow from "@/components/ranking/me-row";
import RankRow from "@/components/ranking/rank-row";
import {
  colors,
  fontMono,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { fetchRankings } from "@/lib/api";
import { comma } from "@/lib/format";
import { useAuthStore } from "@/stores/use-auth-store";
import { RankingEntry } from "@/types/ranking";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Ranking() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data, error, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ["rankings", token],
    queryFn: () => fetchRankings(token),
  });

  const rankings = useMemo(() => data?.rankings ?? [], [data?.rankings]);
  const me = data?.me ?? null;
  const champ = rankings[0] ?? null;
  const rest = useMemo(() => rankings.slice(1), [rankings]);
  const totalStamps = useMemo(
    () => rankings.reduce((sum, entry) => sum + entry.stamp_count, 0),
    [rankings],
  );

  const renderItem = useCallback(
    ({ item }: { item: RankingEntry }) => <RankRow entry={item} />,
    [],
  );

  const header = useMemo(
    () => (
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.eyebrow}>탐험 순위</Text>
            <Text style={styles.screenTitle}>랭킹</Text>
          </View>
          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>실시간</Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{rankings.length}</Text>
            <Text style={styles.metricLabel}>참여자</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{comma(totalStamps)}</Text>
            <Text style={styles.metricLabel}>누적 도장</Text>
          </View>
          <View style={styles.metricDivider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>
              {champ ? comma(champ.stamp_count) : 0}
            </Text>
            <Text style={styles.metricLabel}>최고 기록</Text>
          </View>
        </View>

        {champ ? <ChampionSeal entry={champ} /> : null}

        {rest.length > 0 ? (
          <View style={styles.sectionRow}>
            <Text style={styles.sectionLabel}>탐험가 순위</Text>
            <View style={styles.sectionLine} />
          </View>
        ) : null}
      </View>
    ),
    [champ, rankings.length, rest.length, totalStamps],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <FlashList
        data={rest}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.accent}
          />
        }
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + (me || !token ? 126 : spacing.xl),
        }}
        ListHeaderComponent={rankings.length > 0 ? header : null}
        ListEmptyComponent={
          <View style={styles.empty}>
            {isLoading ? (
              <>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.emptyTitle}>순위를 불러오는 중</Text>
              </>
            ) : error ? (
              <>
                <Text style={styles.emptyTitle}>랭킹을 불러오지 못했어요</Text>
                <Pressable onPress={() => refetch()} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>다시 시도</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.emptyTitle}>아직 순위가 비어 있어요</Text>
                <Text style={styles.emptyBody}>
                  첫 도장을 찍고 탐험 순위에 이름을 올려보세요
                </Text>
              </>
            )}
          </View>
        }
      />

      {me ? (
        <View
          style={[
            styles.stubWrap,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <View style={styles.stub}>
            <View style={styles.stubTop}>
              <Text style={styles.stubLabel}>내 위치</Text>
              <Text style={styles.stubMeta}>{me.rank}위</Text>
            </View>
            <MeRow entry={me} />
          </View>
        </View>
      ) : !token ? (
        <View
          style={[
            styles.stubWrap,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <View style={styles.stub}>
            <Text style={[styles.stubLabel, styles.loginLabel]}>
              아직 순위에 없어요
            </Text>
            <Pressable
              onPress={() => router.push("/login")}
              style={styles.loginCta}
            >
              <SymbolView
                name={{ ios: "person.fill", android: "person" }}
                size={16}
                tintColor={colors.white}
              />
              <Text style={styles.loginCtaText}>로그인하고 순위 겨루기</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingTop: spacing.xs,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: fontMono,
    fontSize: 10.5,
    fontWeight: "800",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: colors.muted,
  },
  screenTitle: {
    marginTop: 5,
    fontSize: 29,
    fontWeight: "900",
    color: colors.ink,
    letterSpacing: 0,
  },
  livePill: {
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
  },
  liveText: {
    ...typography.chip,
    color: colors.accentDark,
  },
  metrics: {
    minHeight: 74,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  metric: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  metricValue: {
    fontFamily: fontMono,
    fontSize: 22,
    fontWeight: "800",
    color: colors.accent,
  },
  metricLabel: {
    ...typography.chip,
    color: colors.muted,
  },
  metricDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.hairline,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  sectionLabel: {
    fontFamily: fontMono,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.muted,
  },
  sectionLine: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: colors.hairline,
  },
  stubWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  stub: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  stubTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  stubLabel: {
    fontFamily: fontMono,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    color: colors.accent,
  },
  stubMeta: {
    ...typography.chip,
    color: colors.ink,
  },
  empty: {
    minHeight: 360,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
  },
  emptyBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    borderRadius: radius.button,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  loginLabel: {
    marginBottom: spacing.sm,
  },
  loginCta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.accent,
    paddingVertical: 12,
    borderRadius: radius.button,
  },
  loginCtaText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
});
