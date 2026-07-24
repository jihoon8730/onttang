import ProductCardItem from "@/components/coupon/product-card-item";
import AlertModal from "@/components/ui/AlertModal";
import ProgressBar from "@/components/ui/ProgressBar";
import { colors, fontMono, radius, spacing, typography } from "@/constants/theme";
import { claimProduct, fetchCouponCatalog } from "@/lib/api";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function CouponBox() {
  const token = useAuthStore((s) => s.token);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [alert, setAlert] = useState<{ title: string; message: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["coupon-catalog"],
    queryFn: () => fetchCouponCatalog(token!),
    enabled: !!token,
  });

  const handleClaim = async (productId: number) => {
    if (!token) return;
    setClaimingId(productId);
    try {
      await claimProduct(token, productId);
      queryClient.invalidateQueries({ queryKey: ["coupon-catalog"] });
    } catch (e) {
      setAlert({
        title: "상품을 받지 못했어요",
        message: e instanceof Error ? e.message : "잠시 후 다시 시도해주세요",
      });
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <SymbolView
            name={{ ios: "ticket.fill", android: "local_activity" }}
            size={22}
            tintColor={colors.accent}
          />
          <Text style={styles.eyebrow}>스탬프 이벤트</Text>
        </View>
        <Text style={styles.headTitle}>스탬프 쿠폰 이벤트</Text>
        <Text style={styles.headSub}>
          관광지 {data?.milestone ?? 10}곳을 탐험하면{"\n"}
          원하는 상품 하나를 골라 받을 수 있어요
        </Text>

        {isLoading ? (
          <ActivityIndicator
            style={{ marginTop: 40 }}
            size="large"
            color={colors.accent}
          />
        ) : data ? (
          <>
            {/* 진행률 게이지 — claimed 여부와 무관하게 항상 표시 */}
            <View style={styles.progressCard}>
              <View style={styles.progressRow}>
                <Text style={styles.progressLabel}>내 스탬프</Text>
                <Text style={styles.progressValue}>
                  {data.stamped} / {data.milestone}곳
                </Text>
              </View>
              <ProgressBar
                progress={Math.min(data.stamped / data.milestone, 1)}
              />
            </View>

            {data.claimed && (
              <Pressable
                style={({ pressed }) => [
                  styles.claimedBanner,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => router.push("/my-coupons")}
              >
                <View style={styles.claimedBannerIcon}>
                  <SymbolView
                    name={{ ios: "gift.fill", android: "card_giftcard" }}
                    size={24}
                    tintColor={colors.accent}
                  />
                </View>
                <View style={styles.claimedBannerContent}>
                  <Text style={styles.claimedBannerTitle}>
                    🎉 {data.claimed_product_name} 획득 완료!
                  </Text>
                  <Text style={styles.claimedBannerDesc}>내 쿠폰함에서 보관 중인 쿠폰을 확인하세요</Text>
                </View>
                <SymbolView
                  name={{ ios: "chevron.right", android: "chevron_right" }}
                  size={16}
                  tintColor={colors.muted}
                />
              </Pressable>
            )}

            <Text style={styles.sectionLabel}>
              {data.claimed ? "이벤트 상품 목록" : "상품을 골라보세요"}
            </Text>
            <View style={{ width: "100%", gap: spacing.md }}>
              {data.products.map((p) => (
                <ProductCardItem
                  key={p.product_id}
                  product={p}
                  eligible={data.eligible}
                  disabled={data.claimed}
                  claiming={claimingId === p.product_id}
                  onClaim={handleClaim}
                  onInsufficient={() =>
                    setAlert({
                      title: "스탬프가 부족해요",
                      message: `관광지 ${data.milestone}곳을 탐험하면 상품을 받을 수 있어요\n(현재 ${data.stamped}/${data.milestone}곳)`,
                    })
                  }
                />
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>

      <AlertModal
        visible={!!alert}
        title={alert?.title ?? ""}
        message={alert?.message ?? ""}
        onClose={() => setAlert(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 2,
    alignItems: "center",
    gap: spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    color: colors.accent,
    textTransform: "uppercase",
  },
  headTitle: {
    ...typography.title,
    color: colors.ink,
    textAlign: "center",
    marginTop: spacing.xs,
  },
  headSub: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.sm,
  },
  progressCard: {
    width: "100%",
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  progressLabel: {
    ...typography.meta,
    color: colors.muted,
  },
  progressValue: {
    fontFamily: fontMono,
    fontSize: 15,
    fontWeight: "800",
    color: colors.accent,
  },
  claimedBanner: {
    width: "100%",
    padding: spacing.lg,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.accentSoft,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  claimedBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  claimedBannerContent: {
    flex: 1,
    gap: 4,
  },
  claimedBannerTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.ink,
  },
  claimedBannerDesc: {
    fontSize: 13,
    color: colors.muted,
  },
  sectionLabel: {
    width: "100%",
    fontSize: 14,
    fontWeight: "700",
    color: colors.ink,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  cardIconBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.ink,
  },
  stockTag: {
    fontFamily: fontMono,
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },
  cardDesc: {
    ...typography.meta,
    color: colors.muted,
    marginTop: 2,
  },
  claimButton: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
  },
  claimButtonText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 15,
  },
  hintText: {
    ...typography.meta,
    color: colors.muted,
  },
});
