import { colors, spacing } from "@/constants/theme";
import { StyleSheet, View } from "react-native";

// 절취선 — 정보(위)와 실제 교환 동작(아래)을 "찢어서 쓰는 표"처럼 분리하는 시그니처.
// 카드 padding만큼 음수 마진을 줘 카드 좌우 테두리까지 닿게 하고,
// 양끝 반원을 페이지 배경색으로 채워 카드 가장자리를 "펀치"한 것처럼 보이게 한다.
export default function TicketPerforation() {
  return (
    <View style={styles.row}>
      <View style={[styles.notch, styles.notchLeft]} />
      <View style={styles.dash} />
      <View style={[styles.notch, styles.notchRight]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: -spacing.lg,
  },
  dash: {
    flex: 1,
    borderTopWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.hairline,
    marginHorizontal: 2,
  },
  notch: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  notchLeft: { marginLeft: -8 },
  notchRight: { marginRight: -8 },
});
