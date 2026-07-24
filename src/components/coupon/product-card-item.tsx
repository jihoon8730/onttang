import TicketPerforation from "@/components/ui/TicketPerforation";
import { colors, fontMono, radius, spacing, typography } from "@/constants/theme";
import { ProductCard } from "@/types/coupon";
import { Image } from "expo-image";
import { SymbolView } from "expo-symbols";
import { type ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

// 상품이 아이콘을 지정 안 했을 때 기본값
const DEFAULT_ICON = { ios: "gift.fill", android: "card_giftcard" };
// 메가커피 상품은 실물 사진 로고로 표시 (다른 상품은 SF/Material 심볼 아이콘 유지)
const MEGA_COFFEE_LOGO = require("../../assets/images/megacoffee.png");

type Props = {
  product: ProductCard;
  eligible: boolean;
  disabled: boolean; // 이미 다른 상품을 받아 더는 고를 수 없는 상태
  claiming: boolean;
  onClaim: (productId: number) => void;
  onInsufficient: () => void; // 스탬프 조건 미달 카드를 탭했을 때
};

// 쿠폰 이벤트 상품 카드 1개 — 절취선 아래 상태별 액션(받기/품절/조건미달/이미받음)
export default function ProductCardItem({
  product,
  eligible,
  disabled,
  claiming,
  onClaim,
  onInsufficient,
}: Props) {
  const icon =
    product.icon_ios && product.icon_android
      ? { ios: product.icon_ios, android: product.icon_android }
      : DEFAULT_ICON;
  const isMegaCoffee = product.name.includes("메가커피");
  const soldOut = product.remaining <= 0;
  // 아래에 보여줄 내용(안내문/버튼)이 있을 때만 절취선으로 구분 — 조건 미달이라 아무것도 없으면 카드가 헤더에서 바로 끝남
  const hasBottomContent = disabled || soldOut || eligible;

  const handlePress = () => {
    if (hasBottomContent) return; // 조건 미달일 때만 안내
    onInsufficient();
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={hasBottomContent}
      style={[
        styles.card,
        disabled && styles.cardDisabled,
        !hasBottomContent && styles.cardCompact,
      ]}
    >
      <View style={styles.cardHead}>
        <View style={[styles.cardIconBadge, isMegaCoffee && styles.cardIconBadgePhoto]}>
          {isMegaCoffee ? (
            <Image
              source={MEGA_COFFEE_LOGO}
              style={styles.cardLogoImage}
              contentFit="contain"
            />
          ) : (
            // icon은 DB에서 오는 자유 텍스트(관리자가 등록) — 컴파일타임에 검증 불가해 캐스팅
            <SymbolView
              name={icon as ComponentProps<typeof SymbolView>["name"]}
              size={26}
              tintColor={colors.accent}
            />
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle}>{product.name}</Text>
          {product.description ? (
            <Text style={styles.cardDesc}>{product.description}</Text>
          ) : null}
        </View>
        <Text style={styles.stockTag}>
          {product.remaining}/{product.total}
        </Text>
      </View>

      {hasBottomContent && <TicketPerforation />}

      {disabled ? (
        <Text style={styles.hintText}>이미 다른 상품을 받으셨어요</Text>
      ) : soldOut ? (
        <Text style={styles.hintText}>품절됐어요</Text>
      ) : eligible ? (
        <Pressable
          style={[styles.claimButton, claiming && { opacity: 0.6 }]}
          onPress={() => onClaim(product.product_id)}
          disabled={claiming}
        >
          <Text style={styles.claimButtonText}>
            {claiming ? "받는 중…" : "상품 받기"}
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
  cardCompact: {
    paddingBottom: spacing.lg - 6,
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
  cardIconBadgePhoto: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  cardLogoImage: {
    width: 34,
    height: 34,
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
