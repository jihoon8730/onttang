import BackButton from "@/components/detail/back-button";
import ImageCarousel from "@/components/detail/image-carousel";
import InfoRow from "@/components/detail/info-row";
import StampButton from "@/components/detail/stamp-button";
import { DATA_SOURCE_URL } from "@/constants/config";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchAttractionDetail, fetchAttractions, fetchMyStamps } from "@/lib/api";
import { extractHref } from "@/lib/utils";
import { useAuthStore } from "@/stores/use-auth-store";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  LayoutAnimation,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SymbolView } from "expo-symbols";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function AttractionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [isOverviewExpanded, setIsOverviewExpanded] = useState(false);

  const { data: attractions = [] } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  const { data: detail, isLoading } = useQuery({
    queryKey: ["attraction-detail", id],
    queryFn: () => fetchAttractionDetail(id),
    staleTime: 1000 * 60 * 30, // 상세 정보는 거의 안 바뀜 — 30분간 재요청 안 함
  });

  // 이 장소를 이미 몇 번 방문했는지 (버튼 배지용)
  const token = useAuthStore((s) => s.token);
  const { data: myStamps } = useQuery({
    queryKey: ["my-stamps"],
    queryFn: () => fetchMyStamps(token!),
    enabled: !!token,
  });
  const visitCount = myStamps?.find((s) => s.content_id === id)?.visit_count;

  const attraction = attractions.find((a) => a.content_id === id);

  if (!attraction) {
    return (
      <View style={styles.center}>
        <BackButton />
        <Text>관광지를 찾을 수 없어요</Text>
      </View>
    );
  }

  const images = useMemo(() => {
    return [attraction.image_url, ...(detail?.images ?? [])].filter(
      (url, index, arr): url is string =>
        url !== null && arr.indexOf(url) === index,
    );
  }, [attraction.image_url, detail?.images]);

  const homepageUrl = detail?.homepage ? extractHref(detail.homepage) : null;

  return (
    <View style={styles.container}>
      <BackButton />
      <ScrollView contentInsetAdjustmentBehavior="never">
        <ImageCarousel images={images} width={width} />

        <View style={styles.body}>
          <View style={styles.badgeRow}>
            {attraction.category ? (
              <View style={[styles.badge, styles.badgePrimary]}>
                <Text style={[styles.badgeText, styles.badgeTextPrimary]}>
                  {attraction.category}
                </Text>
              </View>
            ) : null}
            {attraction.address ? (
              <View style={[styles.badge, styles.badgeSecondary]}>
                <Text style={styles.badgeText}>
                  {attraction.address.split(" ")[0]}
                </Text>
              </View>
            ) : null}
          </View>
          
          <Text style={styles.title}>{attraction.title}</Text>
          {attraction.address ? (
            <View style={styles.addressRow}>
              <SymbolView
                name={{ ios: "map", android: "map" }}
                size={12}
                tintColor={colors.muted}
                style={{ marginTop: 3 }}
              />
              <Text style={styles.addressText}>{attraction.address}</Text>
            </View>
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
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>이용 안내</Text>
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
                </View>
              )}

              {detail?.overview ? (
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>소개</Text>
                  <Text 
                    style={styles.overview}
                    numberOfLines={isOverviewExpanded ? undefined : 4}
                  >
                    {detail.overview}
                  </Text>
                  {!isOverviewExpanded && detail.overview.length > 100 && (
                    <Pressable 
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setIsOverviewExpanded(true);
                      }} 
                      hitSlop={8} 
                      style={styles.readMoreButton}
                    >
                      <Text style={styles.readMoreText}>더보기 ▾</Text>
                    </Pressable>
                  )}
                </View>
              ) : null}

              {homepageUrl ? (
                <Pressable
                  style={styles.homepageButton}
                  onPress={() => Linking.openURL(homepageUrl)}
                >
                  <Text style={styles.homepageButtonText}>홈페이지 방문</Text>
                </Pressable>
              ) : null}

              <Pressable onPress={() => Linking.openURL(DATA_SOURCE_URL)}>
                <Text style={styles.sourceText}>
                  정보 제공: 공공데이터포털 한국관광공사 TourAPI ↗
                </Text>
              </Pressable>

              <View style={styles.bottomSpacer} />
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: spacing.lg + insets.bottom }]}>
        <StampButton
          contentId={id}
          latitude={attraction.latitude}
          longitude={attraction.longitude}
          visitCount={visitCount}
        />
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
  body: {
    padding: spacing.xl,
    gap: spacing.sm,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    backgroundColor: colors.background,
    marginTop: -radius.sheet,
  },
  badgeRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgePrimary: {
    backgroundColor: colors.accentSoft,
  },
  badgeSecondary: {
    backgroundColor: colors.chip,
  },
  badgeText: {
    ...typography.chip,
    color: colors.muted,
  },
  badgeTextPrimary: {
    color: colors.accentDark,
  },
  title: { ...typography.title, color: colors.ink },
  addressRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
    marginBottom: spacing.md,
  },
  addressText: { 
    ...typography.meta, 
    color: colors.muted, 
    flex: 1, 
    lineHeight: 18,
  },
  
  sectionContainer: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...typography.header,
    fontSize: 16,
    color: colors.ink,
  },
  overview: { 
    ...typography.body, 
    color: colors.ink, 
    lineHeight: 24,
  },
  readMoreButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  readMoreText: {
    ...typography.meta,
    color: colors.accent,
    fontWeight: "700",
  },
  useTimeView: {
    gap: spacing.sm,
    backgroundColor: colors.chip,
    borderRadius: radius.card,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  homepageButton: {
    backgroundColor: colors.chip,
    paddingVertical: 14,
    borderRadius: radius.button,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  homepageButtonText: {
    ...typography.body,
    fontWeight: "700",
    color: colors.ink,
  },
  sourceText: {
    ...typography.meta,
    color: colors.muted,
    textAlign: "center",
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: 40,
  },
  bottomBar: {
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
  },
});
