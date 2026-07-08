import { colors, radius, spacing } from "@/constants/theme";
import { Attraction } from "@/types/attraction";
import { NaverMapMarkerOverlay } from "@mj-studio/react-native-naver-map";
import { SymbolView } from "expo-symbols";
import { memo } from "react";
import { StyleSheet, Text, View } from "react-native";

const FONT_SIZE = 13; // 라벨 글자 크기
const PAD_H = 10; // 라벨 좌우 여백(한쪽)
const DOT_SIZE = 20; // 미선택 상태의 점 크기
const LABEL_HEIGHT = 28; // 선택 상태의 라벨 높이
const PIN_SIZE = 18; // 라벨 안 핀 아이콘 크기
const PIN_GAP = spacing.xs; // 핀-텍스트 간격 (width 계산과 동일해야 함)

type Props = {
  attraction: Attraction;
  selected: boolean;
  onPress: (attraction: Attraction) => void;
};

function AttractionMarker({ attraction, selected, onPress }: Props) {
  const width = selected
    ? Math.round(
        PIN_SIZE + PIN_GAP + attraction.title.length * FONT_SIZE + PAD_H * 2,
      )
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
            <View style={styles.selectLabelView}>
              <SymbolView
                name={{ ios: "flag.fill", android: "flag" }}
                tintColor={colors.white}
                size={PIN_SIZE}
              />
              <Text numberOfLines={1} style={styles.label}>
                {attraction.title}
              </Text>
            </View>
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
  selectLabelView: {
    flexDirection: "row",
    gap: PIN_GAP,
    alignItems: "center",
  },
  label: {
    fontSize: FONT_SIZE,
    color: colors.white,
    fontWeight: "700",
  },
});

export default memo(AttractionMarker);
