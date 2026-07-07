import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchAttractionDetail, fetchAttractions } from "@/lib/api";
import { extractHref, formatInfoText } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { Pagination } from "react-native-reanimated-carousel";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AttractionDetail() {
  // usehook
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const progress = useSharedValue(0);

  const useGlass = isLiquidGlassAvailable();
  const showBackButton = useGlass || Platform.OS === "android";

  const backButton = showBackButton ? (
    <Pressable
      onPress={() => router.back()}
      hitSlop={spacing.sm}
      style={[styles.backButton, { top: insets.top + spacing.sm }]}
    >
      {useGlass ? (
        <GlassView
          style={styles.backButtonShape}
          glassEffectStyle="clear"
          isInteractive
        >
          <Text style={styles.backIcon}>‹</Text>
        </GlassView>
      ) : (
        <View style={[styles.backButtonShape, styles.backButtonSolid]}>
          <Text style={styles.backIcon}>‹</Text>
        </View>
      )}
    </Pressable>
  ) : null;

  const { data: attractions = [] } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  const { data: detail, isLoading } = useQuery({
    queryKey: ["attraction-detail", id],
    queryFn: () => fetchAttractionDetail(id),
  });

  const attraction = attractions.find((a) => a.content_id === id);

  if (!attraction) {
    return (
      <View style={styles.center}>
        {backButton}
        <Text>관광지를 찾을 수 없어요</Text>
      </View>
    );
  }

  const images = [attraction.image_url, ...(detail?.images ?? [])].filter(
    (url, index, arr): url is string =>
      url !== null && arr.indexOf(url) === index,
  );

  const homepageUrl = detail?.homepage ? extractHref(detail.homepage) : null;

  return (
    <View style={styles.container}>
      {backButton}
      <ScrollView contentInsetAdjustmentBehavior="never">
        {images.length > 0 ? (
          <View style={styles.carouselView}>
            <Carousel
              loop={true}
              autoPlay
              autoPlayInterval={3000}
              data={images}
              width={width}
              height={width * 0.9}
              renderItem={({ item }) => (
                <Image source={item} contentFit="cover" style={styles.hero} />
              )}
              onProgressChange={progress}
            />

            <Pagination.Basic
              progress={progress}
              data={images}
              dotStyle={styles.paginationDot}
              activeDotStyle={styles.activeDot}
              containerStyle={styles.dotContainer}
            />
          </View>
        ) : (
          <View style={[styles.hero, styles.heroEmpty]} />
        )}
        <View style={styles.body}>
          <Text style={styles.title}>{attraction.title}</Text>
          {attraction.address ? (
            <Text style={styles.address}>{attraction.address}</Text>
          ) : null}

          {isLoading ? (
            <ActivityIndicator
              style={{ marginTop: 120 }}
              size={"large"}
              color={colors.accent}
            />
          ) : (
            <>
              {!!(
                detail?.usetime ||
                detail?.restdate ||
                detail?.infocenter ||
                detail?.parking
              ) && (
                <View style={styles.useTimeView}>
                  {detail?.usetime ? (
                    <InfoRow label="이용시간" value={detail.usetime} />
                  ) : null}
                  {detail?.restdate ? (
                    <InfoRow label="휴무일" value={detail.restdate} />
                  ) : null}
                  {detail?.infocenter ? (
                    <InfoRow label="문의" value={detail.infocenter} />
                  ) : null}
                  {detail?.parking ? (
                    <InfoRow label="주차" value={detail.parking} />
                  ) : null}
                </View>
              )}
              {detail?.overview ? (
                <Text style={styles.overview}>{detail.overview}</Text>
              ) : null}

              {homepageUrl ? (
                <Pressable
                  onPress={() => {
                    Linking.openURL(homepageUrl);
                  }}
                >
                  <Text>{"홈페이지 방문"}</Text>
                </Pressable>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// 운영 정보 한 줄 (라벨 + 값). 값이 길면 2줄로 접고 "더보기"로 펼침.
function InfoRow({ label, value }: { label: string; value: string }) {
  const [expanded, setExpanded] = useState(false);
  const text = formatInfoText(value);
  // 여러 줄(구간·개행)이거나 긴 텍스트일 때만 접기/더보기 노출
  const collapsible = text.includes("\n") || text.length > 45;

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueWrap}>
        <Text
          style={styles.infoValue}
          numberOfLines={collapsible && !expanded ? 2 : undefined}
        >
          {text}
        </Text>
        {collapsible ? (
          <Pressable onPress={() => setExpanded((prev) => !prev)} hitSlop={6}>
            <Text style={styles.moreButton}>
              {expanded ? "접기" : "더보기"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    width: "100%",
    height: "100%",
  },
  heroEmpty: {
    backgroundColor: colors.chip,
  },
  body: {
    padding: spacing.xl,
    gap: spacing.sm,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.background,
    marginTop: -radius.sheet,
  },
  title: { ...typography.title, color: colors.ink },
  address: { ...typography.meta, color: colors.muted },
  overview: { ...typography.body, color: colors.ink, marginTop: spacing.md },
  meta: { ...typography.meta, color: colors.muted, marginTop: spacing.sm },
  carouselView: {
    position: "relative",
  },
  paginationDot: {
    backgroundColor: colors.muted,
    borderRadius: 50,
    width: 8,
    height: 8,
  },
  activeDot: {
    backgroundColor: colors.accent,
    borderRadius: 50,
  },
  dotContainer: {
    position: "absolute",
    bottom: radius.sheet + spacing.md,
    alignSelf: "center",
    gap: 6,
  },
  backButton: {
    position: "absolute",
    left: spacing.lg,
    zIndex: 10,
  },
  backButtonShape: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonSolid: {
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  backIcon: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
    marginRight: 2,
  },
  useTimeView: {
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  infoLabel: {
    ...typography.meta,
    color: colors.accent,
    width: 56,
    paddingTop: 1,
  },
  infoValueWrap: {
    flex: 1,
    minWidth: 0, // 콘텐츠보다 작게 줄어들 수 있게 → 텍스트가 카드 안에서 줄바꿈됨
    gap: 2,
  },
  infoValue: {
    ...typography.body,
    color: colors.ink,
  },
  moreButton: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: "700",
  },
});
