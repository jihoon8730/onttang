import { colors, radius } from "@/constants/theme";
import { Attraction } from "@/types/attraction";
import { NaverMapMarkerOverlay } from "@mj-studio/react-native-naver-map";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const FONT_SIZE = 13; // 라벨 글자 크기
const PAD_H = 8; // 라벨 좌우 여백(한쪽)
const DOT_SIZE = 20; // 미선택 상태의 점 크기
const LABEL_HEIGHT = 24; // 선택 상태의 라벨 높이

type Props = {
  attraction: Attraction;
  selected: boolean;
  onPress: (attraction: Attraction) => void;
};

function AttractionMarker({ attraction, selected, onPress }: Props) {
  const width = selected
    ? Math.round(attraction.title.length * FONT_SIZE + PAD_H * 2)
    : DOT_SIZE;
  const height = selected ? LABEL_HEIGHT : DOT_SIZE;

  return (
    <NaverMapMarkerOverlay
      latitude={attraction.latitude}
      longitude={attraction.longitude}
      anchor={{ x: 0.5, y: 0.5 }}
      onTap={() => onPress(attraction)}
      width={width}
      height={height}
    >
      <View
        key={`${attraction.content_id}-${selected}-${width}`}
        collapsable={false}
        style={{ width, height }}
      >
        <View style={styles.box}>
          {selected ? (
            <Text numberOfLines={1} style={styles.label}>
              {attraction.title}
            </Text>
          ) : null}
        </View>
      </View>
    </NaverMapMarkerOverlay>
  );
}

const styles = StyleSheet.create({
  box: {
    flex: 1,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.chip,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  label: {
    fontSize: FONT_SIZE,
    color: colors.white,
    fontWeight: "700",
  },
});

export default memo(AttractionMarker);
