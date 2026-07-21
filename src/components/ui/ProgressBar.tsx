import { colors } from "@/constants/theme";
import { View } from "react-native";
import Animated, {
    useAnimatedStyle,
    withSpring,
} from "react-native-reanimated";

export default function ProgressBar({ progress }: { progress: number }) {
  // progress: 0 ~ 1
  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(`${progress * 100}%`),
  }));

  return (
    <View
      style={{
        width: "100%",
        height: 10,
        backgroundColor: colors.chip,
        borderRadius: 12,
      }}
    >
      <Animated.View
        style={[
          { height: "100%", backgroundColor: colors.accent, borderRadius: 12 },
          animatedStyle,
        ]}
      />
    </View>
  );
}
