import { cardShadow, colors } from "@/constants/theme";
import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet } from "react-native";

type Props = {
  onPress: () => void;
};

// 지도 우측의 "내 위치" 버튼 (조준경 아이콘)
export default function MyLocationButton({ onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <SymbolView
        name={{ ios: "dot.scope", android: "gps_fixed" }}
        size={28}
        tintColor={colors.ink}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 12,
    top: 350,
    backgroundColor: colors.white,
    padding: 8,
    borderRadius: 24,
    ...cardShadow,
  },
});
