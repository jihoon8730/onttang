import TicketPerforation from "@/components/ui/TicketPerforation";
import { colors, fontMono, radius, spacing, typography } from "@/constants/theme";
import { fetchCouponCatalog } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`;
}

export default function MyCoupons() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["coupon-catalog"],
    queryFn: () => fetchCouponCatalog(token!),
    enabled: !!token,
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!data?.claimed) {
    return (
      <View style={styles.center}>
        <SymbolView
          name={{ ios: "ticket", android: "local_activity" }}
          size={44}
          tintColor={colors.muted}
        />
        <Text style={styles.emptyTitle}>아직 받은 쿠폰이 없어요</Text>
        <Text style={styles.emptyHint}>
          스탬프를 모아 이벤트에서{"\n"}쿠폰을 받아보세요
        </Text>
        <Pressable
          style={styles.goButton}
          onPress={() => router.push("/coupon-box")}
        >
          <Text style={styles.goButtonText}>스탬프 이벤트 보러가기</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.ticket}>
        <View style={styles.ticketHead}>
          <View style={styles.ticketIconBadge}>
            <SymbolView
              name={{ ios: "checkmark.seal.fill", android: "verified" }}
              size={22}
              tintColor={colors.accent}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ticketProduct}>{data.claimed_product_name}</Text>
            {data.claimed_at ? (
              <Text style={styles.ticketDate}>
                {formatDate(data.claimed_at)} 받음
              </Text>
            ) : null}
          </View>
        </View>

        <TicketPerforation />

        <Text style={styles.codeValue} selectable>
          {data.code}
        </Text>
        <Text style={styles.codeHint}>
          길게 눌러 복사한 뒤 사용처에서 등록해주세요
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.sm,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    ...typography.title,
    fontSize: 20,
    color: colors.ink,
    marginTop: spacing.sm,
  },
  emptyHint: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
  },
  goButton: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.button,
  },
  goButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  content: {
    padding: spacing.xl,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  ticket: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  ticketHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  ticketIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  ticketProduct: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
  },
  ticketDate: {
    ...typography.meta,
    color: colors.accentDark,
    marginTop: 2,
  },
  codeValue: {
    fontFamily: fontMono,
    fontSize: 20,
    fontWeight: "800",
    color: colors.ink,
    letterSpacing: 1,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  codeHint: {
    ...typography.meta,
    color: colors.muted,
    textAlign: "center",
  },
});
