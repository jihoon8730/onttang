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
import ChampionCard from "@/components/ranking/champion-card";
import MeRow from "@/components/ranking/me-row";
import RankRow from "@/components/ranking/rank-row";

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
        <Text style={styles.screenTitle}>랭킹</Text>
        <Text style={styles.sub}>전국 관광지 개척 순위</Text>
      </View>

      <FlashList
        data={rest}
        keyExtractor={(item) => String(item.user_id)}
        renderItem={({ item }) => <RankRow entry={item} />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.sm }} />}
        contentContainerStyle={{
          paddingTop: spacing.xs,
          paddingBottom: insets.bottom + 120,
        }}
        ListHeaderComponent={
          champ ? (
            <View>
              <ChampionCard entry={champ} />
              {rest.length > 0 && (
                <Text style={styles.sectionLabel}>전체 순위</Text>
              )}
            </View>
          ) : null
        }
        ListEmptyComponent={
          champ ? null : (
            <Text style={styles.empty}>
              아직 랭킹이 없어요.{"\n"}첫 관광지를 개척해 1위가 되어 보세요!
            </Text>
          )
        }
      />

      {me ? (
        <View
          style={[
            styles.myBanner,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
          <Text style={styles.myBannerLabel}>내 순위</Text>
          <MeRow entry={me} />
        </View>
      ) : !token ? (
        <View
          style={[
            styles.myBanner,
            { paddingBottom: insets.bottom + spacing.md },
          ]}
        >
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.background,
  },
  head: { paddingBottom: spacing.md },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.6,
  },
  sub: {
    ...typography.body,
    color: colors.muted,
    marginTop: spacing.xs,
  },

  sectionLabel: {
    fontFamily: fontMono,
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: colors.muted,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
  },

  // my rank banner
  myBanner: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  myBannerLabel: {
    fontFamily: fontMono,
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: spacing.xs,
    marginLeft: 4,
  },
  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xl * 2,
    lineHeight: 24,
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
