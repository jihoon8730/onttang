import { colors, spacing } from "@/constants/theme";
import { RankingEntry } from "@/types/ranking";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
  Text as SvgText,
  TextPath,
} from "react-native-svg";

// 미리 계산해둔 "손도장"처럼 살짝 일그러진 원 — 런타임 노이즈 필터 대신 고정 경로라 두 플랫폼 모두 안정적
const OUTER_RING_PATH =
  "M 194.76,100.00 C 194.57,104.79 191.81,109.68 190.19,114.28 C 188.56,118.89 186.23,122.96 185.01,127.62 C 183.79,132.28 184.49,137.71 182.88,142.23 C 181.26,146.75 178.37,151.00 175.33,154.73 C 172.29,158.47 168.37,161.61 164.63,164.63 C 160.90,167.65 156.80,170.08 152.93,172.85 C 149.06,175.62 145.41,178.58 141.40,181.26 C 137.40,183.93 133.34,187.02 128.89,188.91 C 124.43,190.80 119.48,192.19 114.67,192.59 C 109.85,193.00 104.77,192.09 100.00,191.33 C 95.23,190.57 90.78,188.74 86.05,188.05 C 81.33,187.36 76.49,187.84 71.67,187.18 C 66.86,186.51 61.76,185.78 57.17,184.06 C 52.58,182.34 47.78,180.12 44.15,176.87 C 40.52,173.63 38.30,168.55 35.39,164.61 C 32.49,160.67 30.03,156.83 26.73,153.24 C 23.42,149.64 17.80,147.20 15.56,143.03 C 13.31,138.85 13.96,133.02 13.25,128.19 C 12.55,123.36 11.92,118.74 11.34,114.04 C 10.76,109.35 10.57,104.81 9.78,100.00 C 8.99,95.19 6.15,89.94 6.61,85.21 C 7.07,80.47 10.74,76.13 12.54,71.58 C 14.35,67.04 15.41,62.31 17.46,57.94 C 19.51,53.58 21.90,49.20 24.85,45.40 C 27.79,41.59 31.75,38.62 35.12,35.12 C 38.49,31.61 41.26,27.34 45.06,24.38 C 48.85,21.42 53.61,19.75 57.89,17.36 C 62.18,14.97 66.16,11.49 70.77,10.04 C 75.38,8.59 80.66,9.29 85.53,8.64 C 90.40,7.99 95.18,6.14 100.00,6.14 C 104.82,6.15 109.72,7.61 114.47,8.65 C 119.21,9.69 123.74,11.18 128.46,12.40 C 133.19,13.62 138.58,13.73 142.81,15.98 C 147.05,18.22 150.29,22.57 153.86,25.87 C 157.43,29.17 160.57,32.60 164.22,35.78 C 167.87,38.96 173.06,41.09 175.75,44.96 C 178.45,48.84 178.02,54.74 180.38,59.04 C 182.74,63.35 188.09,66.37 189.91,70.79 C 191.74,75.20 190.53,80.66 191.34,85.53 C 192.14,90.40 194.95,95.21 194.76,100.00 Z";
const INNER_RING_PATH =
  "M 178.46,100.00 C 178.22,104.49 176.30,108.83 175.58,113.33 C 174.86,117.83 175.48,122.70 174.16,126.99 C 172.84,131.28 170.07,135.22 167.64,139.05 C 165.20,142.88 162.57,146.63 159.56,149.98 C 156.56,153.32 153.07,156.24 149.61,159.12 C 146.15,162.00 142.63,164.85 138.82,167.24 C 135.01,169.63 130.97,171.97 126.74,173.47 C 122.51,174.97 117.90,175.53 113.45,176.26 C 108.99,176.98 104.49,177.76 100.00,177.83 C 95.51,177.89 90.91,177.45 86.49,176.63 C 82.06,175.81 77.69,174.45 73.46,172.91 C 69.23,171.37 65.06,169.54 61.09,167.39 C 57.12,165.24 52.89,163.08 49.64,160.02 C 46.39,156.96 44.28,152.62 41.58,149.02 C 38.89,145.42 35.66,142.24 33.46,138.42 C 31.26,134.59 29.92,130.24 28.38,126.07 C 26.85,121.89 25.62,117.70 24.25,113.36 C 22.88,109.01 20.36,104.49 20.15,100.00 C 19.94,95.51 22.06,90.93 22.99,86.42 C 23.91,81.91 23.96,77.10 25.72,72.96 C 27.47,68.83 31.35,65.68 33.52,61.62 C 35.69,57.56 36.01,52.16 38.73,48.59 C 41.45,45.02 46.17,42.97 49.84,40.22 C 53.52,37.47 56.78,34.07 60.79,32.08 C 64.80,30.09 69.67,30.05 73.90,28.30 C 78.14,26.55 81.82,22.64 86.17,21.59 C 90.52,20.53 95.42,21.79 100.00,21.96 C 104.58,22.13 109.24,21.71 113.65,22.60 C 118.06,23.49 122.23,25.68 126.46,27.31 C 130.69,28.94 134.88,30.48 139.04,32.39 C 143.19,34.30 148.13,35.69 151.38,38.77 C 154.63,41.85 155.86,47.17 158.55,50.87 C 161.24,54.58 165.12,57.26 167.52,61.02 C 169.93,64.78 171.39,69.20 172.98,73.44 C 174.58,77.67 176.16,81.98 177.07,86.41 C 177.98,90.84 178.71,95.51 178.46,100.00 Z";

const SEAL_SIZE = 176;

// 천 단위 콤마 (Hermes Intl 미지원 대비 직접 포맷)
const comma = (n: number) => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// 랭킹 1위 = "도장이 찍힌" 인장 — 종이에 쿵 찍히는 연출(스케일+회전) 후 잉크 번짐 펄스가 한 번 퍼짐
export default function ChampionSeal({ entry }: { entry: RankingEntry }) {
  const scale = useSharedValue(1.5);
  const rotate = useSharedValue(-5);
  const opacity = useSharedValue(0);
  const pulseScale = useSharedValue(0.8);
  const pulseOpacity = useSharedValue(0.5);

  useEffect(() => {
    scale.value = withSequence(
      withTiming(0.94, { duration: 340, easing: Easing.out(Easing.cubic) }),
      withTiming(1.03, { duration: 150 }),
      withTiming(1, { duration: 130 }),
    );
    rotate.value = withSequence(
      withTiming(-6, { duration: 340 }),
      withTiming(-4, { duration: 150 }),
      withTiming(-5, { duration: 130 }),
    );
    opacity.value = withTiming(1, { duration: 200 });
    pulseScale.value = withDelay(50, withTiming(1.35, { duration: 900, easing: Easing.out(Easing.ease) }));
    pulseOpacity.value = withDelay(50, withTiming(0, { duration: 900 }));
  }, [opacity, pulseOpacity, pulseScale, rotate, scale]);

  const sealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ rotate: `${rotate.value}deg` }, { scale: scale.value }],
  }));
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  const initial = (entry.nickname ?? "?").trim().charAt(0) || "?";

  return (
    <View style={styles.wrap}>
      <LottieView
        source={require("../../assets/lottie/confetti.json")}
        autoPlay
        loop
        speed={0.7}
        style={styles.confetti}
        resizeMode="cover"
      />
      <Svg style={styles.inkBleed} width={220} height={220} viewBox="0 0 220 220">
        <Defs>
          <RadialGradient id="inkGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity={0.22} />
            <Stop offset="60%" stopColor={colors.accent} stopOpacity={0.08} />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={110} cy={110} r={110} fill="url(#inkGlow)" />
      </Svg>
      <Animated.View style={[styles.pulseRing, pulseStyle]} />
      <Animated.View style={[styles.seal, sealStyle]}>
        <Svg width={SEAL_SIZE} height={SEAL_SIZE} viewBox="0 0 200 200">
          <Defs>
            <Path id="ringPath" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
          </Defs>
          <Path d={OUTER_RING_PATH} fill="none" stroke={colors.accent} strokeWidth={3} opacity={0.9} />
          <Path d={INNER_RING_PATH} fill="none" stroke={colors.accent} strokeWidth={1.2} opacity={0.5} />
          <Circle cx={100} cy={100} r={94} fill="none" stroke={colors.accent} strokeWidth={8} opacity={0.07} />
          <SvgText fontSize={9} fontWeight="700" letterSpacing={3} fill={colors.accent} opacity={0.85}>
            <TextPath href="#ringPath" startOffset="2%">
              ONTTANG · 최다 탐험 챔피언 · ONTTANG · 최다 탐험 챔피언 ·
            </TextPath>
          </SvgText>
        </Svg>
        <View style={styles.sealFace}>
          <View style={styles.sealAvatar}>
            {entry.profile_image ? (
              <Image style={styles.sealAvatarImage} source={entry.profile_image} contentFit="cover" />
            ) : (
              <Text style={styles.sealAvatarInitial}>{initial}</Text>
            )}
          </View>
          <Text style={styles.sealName} numberOfLines={1}>
            {entry.nickname ?? "익명의 탐험가"}
          </Text>
          <Text style={styles.sealCount}>{comma(entry.stamp_count)}곳 탐험</Text>
        </View>
      </Animated.View>
      <Text style={styles.championLabel}>
        현재 <Text style={styles.championLabelStrong}>1위</Text> · 전국 최다 탐험 도장
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    marginHorizontal: -spacing.xl, // 폭죽이 화면 패딩 바깥까지 넓게 퍼지도록 화면 폭 전체로 확장
    marginBottom: spacing.xl,
    overflow: "hidden",
  },
  confetti: {
    ...StyleSheet.absoluteFill,
    transform: [{ scale: 1.4 }], // 확장된 영역만큼 폭죽도 더 넓고 크게
  },
  inkBleed: {
    position: "absolute",
    top: spacing.xl - 10,
  },
  pulseRing: {
    position: "absolute",
    top: spacing.xl,
    width: SEAL_SIZE,
    height: SEAL_SIZE,
    borderRadius: SEAL_SIZE / 2,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  seal: {
    width: SEAL_SIZE,
    height: SEAL_SIZE,
  },
  sealFace: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    borderRadius: (SEAL_SIZE - 28) / 2,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sealAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.accentSoft,
    borderWidth: 2.5,
    borderColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginBottom: 2,
  },
  sealAvatarImage: { width: "100%", height: "100%" },
  sealAvatarInitial: { fontSize: 21, fontWeight: "800", color: colors.accent },
  sealName: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.accentDark,
    letterSpacing: -0.2,
    maxWidth: 92,
  },
  sealCount: {
    fontSize: 11.5,
    fontWeight: "700",
    color: colors.accent,
  },
  championLabel: {
    marginTop: spacing.lg,
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },
  championLabelStrong: {
    color: colors.ink,
    fontWeight: "800",
  },
});
