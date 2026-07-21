import { colors, fontMono, spacing, typography } from "@/constants/theme";
import { RegionStat } from "@/types/stamp";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ProgressBar from "../ui/ProgressBar";

const COLLAPSED_COUNT = 5; // 접힘 상태에서 보여줄 지역 수

export default function RegionExplorationRate({
  regions,
}: {
  regions: RegionStat[];
}) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? regions : regions.slice(0, COLLAPSED_COUNT);
  const idleCount = regions.filter((r) => r.rate === 0).length;

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>지역별 탐험률</Text>
        {idleCount > 0 ? (
          <Text style={styles.hint}>미개척 {idleCount}곳</Text>
        ) : null}
      </View>

      <View style={styles.content}>
        {visible.map((r) => {
          const explored = r.rate > 0;
          return (
            <View key={r.code} style={styles.regionBox}>
              <View style={styles.regionHeader}>
                <Text
                  style={[
                    styles.regionTitle,
                    !explored && styles.regionTitleIdle,
                  ]}
                >
                  {r.name}
                </Text>
                {explored ? (
                  <Text style={styles.regionPercent}>
                    {Math.round(r.rate * 100)}%
                  </Text>
                ) : (
                  <Text style={styles.idleTag}>미개척</Text>
                )}
              </View>
              {explored ? (
                <ProgressBar progress={r.rate} />
              ) : (
                <View style={styles.idleTrack} />
              )}
            </View>
          );
        })}
      </View>

      {regions.length > COLLAPSED_COUNT ? (
        <Pressable
          onPress={() => setExpanded((prev) => !prev)}
          style={styles.toggleButton}
        >
          <Text style={styles.toggleText}>
            {expanded ? "접기" : `전체보기 (${regions.length})`}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  title: { ...typography.body, fontWeight: "700", color: colors.ink },
  hint: { fontFamily: fontMono, fontSize: 11, color: colors.muted },
  content: {
    gap: spacing.lg,
  },
  regionBox: { gap: spacing.xs },
  regionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  regionTitle: { ...typography.meta, color: colors.ink },
  regionTitleIdle: { color: colors.muted, fontWeight: "600" },
  regionPercent: {
    ...typography.meta,
    fontFamily: fontMono,
    color: colors.accent,
  },
  idleTag: {
    fontFamily: fontMono,
    fontSize: 10,
    fontWeight: "700",
    color: colors.muted,
    letterSpacing: 0.5,
  },
  idleTrack: {
    height: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.hairline,
  },
  toggleButton: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.hairline,
  },
  toggleText: { ...typography.meta, color: colors.accent },
});
