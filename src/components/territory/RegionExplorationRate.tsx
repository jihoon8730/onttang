import {
    colors,
    fontSize,
    radius,
    spacing,
    typography,
} from "@/constants/theme";
import { RegionStat } from "@/types/stamp";
import { StyleSheet, Text, View } from "react-native";
import ProgressBar from "../ui/ProgressBar";

export default function RegionExplorationRate({
  regions,
}: {
  regions: RegionStat[];
}) {
  return (
    <View style={styles.explorationRateBox}>
      <Text style={styles.title}>지역별 탐험률</Text>
      <View style={styles.explorationRateContent}>
        {regions.map((r) => (
          <View key={r.code} style={styles.regionBox}>
            <View style={styles.regionHeader}>
              <Text style={styles.regionTitle}>{r.name}</Text>
              <Text style={styles.regionPercent}>
                {Math.round(r.rate * 100)}%
              </Text>
            </View>
            <ProgressBar progress={r.rate} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 지역별 탐험률
  explorationRateBox: {
    borderColor: colors.hairline,
    borderWidth: 1,
    borderRadius: radius.card,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
  },
  explorationRateContent: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.lg,
    marginTop: spacing.sm,
  },
  regionBox: {
    display: "flex",
    flexDirection: "column",
    gap: spacing.xs,
  },
  regionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  regionTitle: {
    ...typography.meta,
    color: colors.ink,
  },
  regionPercent: {
    ...typography.meta,
    color: colors.accent,
  },
});
