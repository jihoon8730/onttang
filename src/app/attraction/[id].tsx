import BackButton from "@/components/detail/back-button";
import ImageCarousel from "@/components/detail/image-carousel";
import InfoRow from "@/components/detail/info-row";
import StampButton from "@/components/detail/stamp-button";
import { colors, radius, spacing, typography } from "@/constants/theme";
import { fetchAttractionDetail, fetchAttractions } from "@/lib/api";
import { extractHref } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

export default function AttractionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();

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
        <BackButton />
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
      <BackButton />
      <ScrollView contentInsetAdjustmentBehavior="never">
        <ImageCarousel images={images} width={width} />

        <View style={styles.body}>
          <Text style={styles.title}>{attraction.title}</Text>
          {attraction.address ? (
            <Text style={styles.address}>{attraction.address}</Text>
          ) : null}

          <StampButton contentId={id} />

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
                <Pressable onPress={() => Linking.openURL(homepageUrl)}>
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
  title: { ...typography.title, color: colors.ink },
  address: { ...typography.meta, color: colors.muted },
  overview: { ...typography.body, color: colors.ink, marginTop: spacing.md },
  useTimeView: {
    gap: spacing.sm,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.card,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});
