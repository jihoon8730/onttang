import { StyleSheet, Text, View } from "react-native";

export default function Territory() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>내 영토 (준비 중)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  text: { fontSize: 16 },
});
