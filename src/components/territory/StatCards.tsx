import { colors, fontMono, spacing } from "@/constants/theme";
import { StyleSheet, Text, View } from "react-native";

type Props = {
  stamped: number;
  regionStamped: number;
  regionTotal: number;
  themeStamped: number;
  themeTotal: number;
};

// 여권 등록부 느낌의 스탯 레지스터 (hairline 구분 + 모노 숫자)
export default function StatCards({
  stamped,
  regionStamped,
  regionTotal,
  themeStamped,
  themeTotal,
}: Props) {
  return (
    <View style={styles.register}>
      <StatCell value={`${stamped}`} label="탐험" />
      <StatCell value={`${regionStamped}/${regionTotal}`} label="지역" divider />
      <StatCell value={`${themeStamped}/${themeTotal}`} label="테마" divider />
    </View>
  );
}

function StatCell({
  value,
  label,
  divider,
}: {
  value: string;
  label: string;
  divider?: boolean;
}) {
  return (
    <View style={[styles.cell, divider && styles.divider]}>
      <Text style={styles.num}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  register: {
    flexDirection: "row",
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.hairline,
  },
  cell: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: spacing.lg,
  },
  divider: { borderLeftWidth: 1, borderLeftColor: colors.hairline },
  num: {
    fontFamily: fontMono,
    fontSize: 24,
    fontWeight: "800",
    color: colors.accent,
  },
  label: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
});
