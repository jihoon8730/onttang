import { colors, radius, spacing } from "@/constants/theme";
import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";
import { useSharedValue } from "react-native-reanimated";
import Carousel, { Pagination } from "react-native-reanimated-carousel";

type Props = {
  images: string[];
  width: number;
};

// 상세 상단 이미지 갤러리 (없으면 빈 히어로)
export default function ImageCarousel({ images, width }: Props) {
  const progress = useSharedValue(0);

  if (images.length === 0) {
    return <View style={[styles.hero, styles.heroEmpty]} />;
  }

  return (
    <View style={styles.carouselView}>
      <Carousel
        loop
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
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    height: "100%",
  },
  heroEmpty: {
    backgroundColor: colors.chip,
  },
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
});
