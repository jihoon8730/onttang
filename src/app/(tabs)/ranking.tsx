import ChampionSeal from "@/components/ranking/champion-seal";
import { ledger } from "@/components/ranking/ledger-theme";
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
import { useAuthStore } from "@/stores/use-auth-store";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function Ranking() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data } = useQuery({
    queryKey: ["rankings", token],
    queryFn: () => fetchRankings(token),
  });

  const rankings = data?.rankings ?? [];
  const me = data?.me ?? null;
  const champ = rankings[0] ?? null;
  const rest = rankings.slice(1);

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.lg }]}>
      <View style={styles.head}>
        <Text style={styles.eyebrow}>탐험 기록부</Text>
        <Text style={styles.screenTitle}>랭킹</Text>
        <Text style={styles.sub}>전국 관광지 개척 순위</Text>
      </View>

      <FlashList
        data={rest}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={({ item }) => <RankRow entry={item} />}
        contentContainerStyle={{
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom + 130,
        }}
        ListHeaderComponent={
          champ ? (
            <View>
              <ChampionSeal entry={champ} />
              {rest.length > 0 && (
                <View style={styles.sectionRow}>
                  <Text style={styles.sectionLabel}>전체 순위</Text>
                  <View style={styles.sectionLine} />
                </View>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          champ ? null : (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>아직 첫 줄이 비어있어요</Text>
              <Text style={styles.emptyBody}>
                관광지를 개척해 도장을 찍으면{"\n"}이 페이지의 첫 줄이 채워져요
              </Text>
            </View>
          )
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
            <Text style={styles.stubLabel}>내 순위</Text>
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
            <Text style={styles.stubLabel}>아직 순위에 없어요</Text>
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
    paddingHorizontal: spacing.xl,
    backgroundColor: ledger.paper,
  },
  head: { paddingBottom: spacing.md },
  eyebrow: {
    fontFamily: fontMono,
    fontSize: 10.5,
    fontWeight: "700",
    letterSpacing: 2.5,
    textTransform: "uppercase",
    color: colors.accent,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.6,
    marginTop: 6,
  },
  sub: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
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
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.muted,
  },
  sectionLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: ledger.ruleStrong,
  },

  // 내 순위 — 화면 하단 고정, 나머지 화이트 톤과 어울리게 차분하게
  stubWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    backgroundColor: ledger.paper,
  },
  stub: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  stubLabel: {
    fontFamily: fontMono,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.accent,
    marginBottom: spacing.sm,
  },

  empty: {
    alignItems: "center",
    marginTop: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.ink,
    marginBottom: spacing.sm,
  },
  emptyBody: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },

  // 비로그인 하단 로그인 CTA
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
