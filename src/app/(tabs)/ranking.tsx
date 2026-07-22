import { colors, fontMono, radius, spacing, typography } from "@/constants/theme";
import { useKakaoLogin } from "@/hooks/use-kakao-login";
import { fetchRankings } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { RankingEntry } from "@/types/ranking";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import LottieView from "lottie-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// 상위 3위 메달색 (1위 accent / 2위 골드 / 3위 브론즈)
const MEDAL: Record<number, string> = {
  1: colors.accent,
  2: "#caa86a",
  3: "#c08457",
};

// 천 단위 콤마 (Hermes Intl 미지원 대비 직접 포맷)
const comma = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

function Avatar({ entry, mine }: { entry: RankingEntry; mine?: boolean }) {
  if (entry.profile_image) {
    return (
      <Image style={styles.avatar} source={entry.profile_image} contentFit="cover" />
    );
  }
  const initial = (entry.nickname ?? "?").trim().charAt(0) || "?";
  return (
    <View style={[styles.avatar, styles.avatarFallback, mine && styles.avatarMine]}>
      <Text style={[styles.avatarInitial, mine && styles.avatarInitialMine]}>
        {initial}
      </Text>
    </View>
  );
}

function RankRow({ entry }: { entry: RankingEntry }) {
  const isTop3 = entry.rank <= 3;

  return (
    <View style={[styles.row, isTop3 && styles.rowBordered]}>
      {isTop3 ? (
        <View style={[styles.badge, { backgroundColor: MEDAL[entry.rank] }]}>
          <Text style={styles.badgeText}>{entry.rank}</Text>
        </View>
      ) : (
        <Text style={styles.rankPlain}>{entry.rank}</Text>
      )}
      <Avatar entry={entry} />
      <View style={styles.info}>
        <Text style={[styles.name, !isTop3 && styles.nameDim]} numberOfLines={1}>
          {entry.nickname ?? "익명의 탐험가"}
        </Text>
        <Text style={styles.count}>{comma(entry.stamp_count)}곳</Text>
      </View>
    </View>
  );
}

function MeRow({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.meRow}>
      <Text style={styles.meRank}>{entry.rank}</Text>
      <Avatar entry={entry} mine />
      <View style={styles.info}>
        <Text style={styles.meName} numberOfLines={1}>
          나 · {entry.nickname ?? "탐험가"}
        </Text>
        <Text style={styles.meCount}>{comma(entry.stamp_count)}곳</Text>
      </View>
    </View>
  );
}

function ChampionAvatar({ entry }: { entry: RankingEntry }) {
  if (entry.profile_image) {
    return (
      <Image style={styles.champAvatar} source={entry.profile_image} contentFit="cover" />
    );
  }
  const initial = (entry.nickname ?? "?").trim().charAt(0) || "?";
  return (
    <View style={[styles.champAvatar, styles.champAvatarFallback]}>
      <Text style={styles.champInitial}>{initial}</Text>
    </View>
  );
}

function ChampionCard({ entry }: { entry: RankingEntry }) {
  return (
    <View style={styles.champion}>
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop
        speed={0.7}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      <Text style={styles.champLabel}>최다 탐험 챔피언</Text>
      <ChampionAvatar entry={entry} />
      <Text style={styles.champName} numberOfLines={1}>
        {entry.nickname ?? "익명의 탐험가"}
      </Text>
      <Text style={styles.champCountRow}>
        <Text style={styles.champCount}>{comma(entry.stamp_count)}</Text> 곳 개척
      </Text>
    </View>
  );
}

export default function Ranking() {
  const token = useAuthStore((s) => s.token);
  const { startLogin } = useKakaoLogin();
  const insets = useSafeAreaInsets();

  const { data } = useQuery({
    queryKey: ["rankings"],
    queryFn: () => fetchRankings(token!),
    enabled: !!token,
  });

  if (!token) {
    return (
      <View style={styles.gateContainer}>
        <View style={styles.gateBadge}>
          <SymbolView name="trophy.fill" size={44} tintColor={colors.accent} />
        </View>
        <Text style={styles.gateTitle}>탐험가 랭킹</Text>
        <Text style={styles.gateHint}>
          로그인하고 다른 탐험가들과{"\n"}개척한 관광지 수를 겨뤄 보세요
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
              {rest.length > 0 && <Text style={styles.sectionLabel}>전체 순위</Text>}
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

      {me && (
        <View style={[styles.myBanner, { paddingBottom: insets.bottom + spacing.md }]}>
          <Text style={styles.myBannerLabel}>내 순위</Text>
          <MeRow entry={me} />
        </View>
      )}
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

  // rows
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  rowBordered: {
    borderWidth: 1.5,
    borderColor: colors.accentSoft,
  },
  rowChampion: {
    backgroundColor: "#FFFAF0",
    borderColor: colors.accent,
    borderWidth: 1.5,
    overflow: "hidden", // Lottie 애니메이션이 카드 영역 밖으로 나가지 않도록
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontFamily: fontMono,
    fontSize: 13,
    fontWeight: "800",
    color: colors.white,
  },
  rankPlain: {
    width: 28,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.chip,
    overflow: "hidden",
  },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarMine: { backgroundColor: colors.accentSoft },
  avatarInitial: { fontSize: 16, fontWeight: "800", color: colors.muted },
  avatarInitialMine: { color: colors.accent },
  info: { flex: 1, minWidth: 0, gap: 2 },
  name: { fontSize: 16, fontWeight: "700", color: colors.ink, letterSpacing: -0.2 },
  nameDim: { fontWeight: "600", color: colors.muted },
  count: { fontFamily: fontMono, fontSize: 12, color: colors.muted },

  // champion spotlight (1위)
  champion: {
    alignItems: "center",
    paddingVertical: spacing.xl * 1.2,
    paddingHorizontal: spacing.lg,
    borderRadius: 24,
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
    overflow: "hidden",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
  },
  champLabel: {
    fontFamily: fontMono,
    fontSize: 10,
    letterSpacing: 3,
    textTransform: "uppercase",
    color: colors.accent,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  champAvatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.chip,
    borderWidth: 4,
    borderColor: colors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  champAvatarFallback: { alignItems: "center", justifyContent: "center" },
  champInitial: { fontSize: 30, fontWeight: "800", color: colors.muted },
  champName: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: -0.5,
    marginTop: spacing.md,
  },
  champCountRow: {
    fontFamily: fontMono,
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
  },
  champCount: { fontSize: 24, fontWeight: "800", color: colors.accent },
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
  meRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  meRank: {
    width: 26,
    textAlign: "center",
    fontFamily: fontMono,
    fontSize: 14,
    fontWeight: "800",
    color: colors.ink,
  },
  meName: { fontSize: 14, fontWeight: "700", color: colors.ink },
  meCount: { fontFamily: fontMono, fontSize: 11, color: colors.muted },

  empty: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.xl * 2,
    lineHeight: 24,
  },

  // login gate
  gateContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  gateBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.accentSoft,
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
  kakaoIcon: { opacity: 0.85 },
  kakaoText: {
    color: "rgba(0, 0, 0, 0.85)",
    fontWeight: "700",
    fontSize: 16,
  },
});
