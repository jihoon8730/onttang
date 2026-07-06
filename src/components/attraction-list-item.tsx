import { colors, radius, spacing, typography } from "@/constants/theme";
import { Attraction } from "@/types/attraction";
import { Image } from "expo-image";
import { memo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  attraction: Attraction;
  selected: boolean;
  onPress: (attraction: Attraction) => void;
  onOccupy: (attraction: Attraction) => void;
};

function AttractionListItem({
  attraction,
  selected,
  onPress,
  onOccupy,
}: Props) {
  return (
    <Pressable
      style={[
        styles.box,
        { borderColor: selected ? colors.accent : colors.chip },
      ]}
      onPress={() => onPress(attraction)}
    >
      <View style={styles.content}>
        <Image
          style={styles.image}
          source={attraction.image_url}
          contentFit="cover"
        />
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {attraction.title}
          </Text>
          <Text style={styles.address} numberOfLines={1} ellipsizeMode="tail">
            {attraction.address}
          </Text>
        </View>
      </View>

      <Pressable style={styles.button} onPress={() => onOccupy(attraction)}>
        <Text style={styles.buttonText}>점령하기</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    borderRadius: radius.card,
  },
  content: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: radius.card,
  },
  info: {
    flex: 1,
    flexDirection: "column",
    gap: spacing.xs,
  },
  title: typography.header,
  address: {
    ...typography.chip,
    color: colors.muted,
    fontWeight: "400",
  },
  button: {
    backgroundColor: colors.accent,
    padding: spacing.sm,
    borderRadius: spacing.md,
  },
  buttonText: {
    ...typography.body,
    color: colors.accentSoft,
  },
});

export default memo(AttractionListItem);
