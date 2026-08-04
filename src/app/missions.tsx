import {
  colors,
  fontMono,
  radius,
  spacing,
  typography,
} from "@/constants/theme";
import { fetchAttractions, fetchMyStamps } from "@/lib/api";
import { distanceMeters, formatDistance } from "@/lib/geo";
import { useAuthStore } from "@/stores/use-auth-store";
import { Attraction } from "@/types/attraction";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type Coords = {
  latitude: number;
  longitude: number;
};

type Mission = {
  attraction: Attraction;
  distanceM: number;
};

const MISSION_LIMIT = 12;
const PRIMARY_LIMIT = 3;
const MISSION_RADIUS_M = 10000;

export default function MissionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const token = useAuthStore((s) => s.token);
  const [location, setLocation] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);

  const { data: attractions = [], isLoading: attractionsLoading } = useQuery({
    queryKey: ["attractions"],
    queryFn: fetchAttractions,
  });

  const { data: myStamps } = useQuery({
    queryKey: ["my-stamps"],
    queryFn: () => fetchMyStamps(token!),
    enabled: !!token,
  });

  const stampMap = useMemo(() => {
    const m = new Map<string, number>();
    (myStamps ?? []).forEach((s) => m.set(s.content_id, s.visit_count));
    return m;
  }, [myStamps]);

  const refreshLocation = async () => {
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "위치 권한이 필요해요",
          "가까운 미션을 보려면 위치 권한을 허용해주세요.",
        );
        return;
      }

      if (Platform.OS === "android") {
        await Location.enableNetworkProviderAsync();
      }

      const loc = await Location.getCurrentPositionAsync();
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    } catch {
      Alert.alert("위치를 찾지 못했어요", "잠시 후 다시 시도해주세요.");
    } finally {
      setLocating(false);
    }
  };

  useEffect(() => {
    refreshLocation();
  }, []);

  const missions = useMemo<Mission[]>(() => {
    if (!location) return [];

    return attractions
      .filter((a) => !stampMap.has(a.content_id))
      .map((attraction) => ({
        attraction,
        distanceM: distanceMeters(location, {
          latitude: attraction.latitude,
          longitude: attraction.longitude,
        }),
      }))
      .filter((mission) => mission.distanceM <= MISSION_RADIUS_M)
      .sort((a, b) => a.distanceM - b.distanceM)
      .slice(0, MISSION_LIMIT);
  }, [attractions, location, stampMap]);

  const primaryMissions = missions.slice(0, PRIMARY_LIMIT);
  const restMissions = missions.slice(PRIMARY_LIMIT);
  const loading = locating || attractionsLoading;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.xl,
        paddingBottom: insets.bottom + spacing.xl * 2,
      }}
    >
      <View style={styles.hero}>
        <Text style={styles.eyebrow}>오늘의 탐험</Text>
        <Text style={styles.title}>주변 미션</Text>
        <Text style={styles.subtitle}>
          현재 위치에서 가까운 미탐험 관광지를 먼저 제안해요
        </Text>

        <View style={styles.heroStats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{missions.length}</Text>
            <Text style={styles.statLabel}>10km 안 미션</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{stampMap.size}</Text>
            <Text style={styles.statLabel}>내 스탬프</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.locationButton,
          pressed && { opacity: 0.75 },
        ]}
        onPress={refreshLocation}
        disabled={locating}
      >
        <SymbolView
          name={{ ios: "location.fill", android: "my_location" }}
          size={16}
          tintColor={colors.white}
        />
        <Text style={styles.locationButtonText}>
          {locating ? "위치 확인 중" : "현재 위치로 다시 찾기"}
        </Text>
      </Pressable>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color={colors.accent} />
          <Text style={styles.centerText}>가까운 미션을 계산하는 중</Text>
        </View>
      ) : missions.length === 0 ? (
        <View style={styles.centerBox}>
          <SymbolView
            name={{ ios: "checkmark.seal.fill", android: "verified" }}
            size={42}
            tintColor={colors.accent}
          />
          <Text style={styles.emptyTitle}>근처 미션을 찾지 못했어요</Text>
          <Text style={styles.centerText}>
            지도를 다른 지역으로 옮기거나 조금 더 이동한 뒤 다시 확인해보세요
          </Text>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>가장 가까운 3곳</Text>
          <View style={styles.primaryList}>
            {primaryMissions.map((mission, index) => (
              <MissionCard
                key={mission.attraction.content_id}
                mission={mission}
                index={index}
                onPress={() =>
                  router.push(`/attraction/${mission.attraction.content_id}`)
                }
              />
            ))}
          </View>

          {restMissions.length > 0 ? (
            <>
              <Text style={styles.sectionTitle}>더 둘러볼 곳</Text>
              <View style={styles.restList}>
                {restMissions.map((mission, index) => (
                  <MissionRow
                    key={mission.attraction.content_id}
                    mission={mission}
                    last={index === restMissions.length - 1}
                    onPress={() =>
                      router.push(`/attraction/${mission.attraction.content_id}`)
                    }
                  />
                ))}
              </View>
            </>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

function MissionCard({
  mission,
  index,
  onPress,
}: {
  mission: Mission;
  index: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.missionCard, pressed && { opacity: 0.78 }]}
      onPress={onPress}
    >
      <Image
        source={mission.attraction.image_url}
        style={styles.missionImage}
        contentFit="cover"
      />
      <View style={styles.missionBadge}>
        <Text style={styles.missionBadgeText}>{index + 1}</Text>
      </View>
      <View style={styles.missionBody}>
        <Text style={styles.missionDistance}>
          {formatDistance(mission.distanceM)}
        </Text>
        <Text style={styles.missionTitle} numberOfLines={1}>
          {mission.attraction.title}
        </Text>
        <Text style={styles.missionMeta} numberOfLines={1}>
          {mission.attraction.category ?? "관광지"}
          {mission.attraction.address
            ? ` · ${mission.attraction.address.split(" ")[0]}`
            : ""}
        </Text>
      </View>
    </Pressable>
  );
}

function MissionRow({
  mission,
  last,
  onPress,
}: {
  mission: Mission;
  last: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        last && styles.rowLast,
        pressed && styles.rowPressed,
      ]}
      onPress={onPress}
    >
      <Image
        source={mission.attraction.image_url}
        style={styles.rowImage}
        contentFit="cover"
      />
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {mission.attraction.title}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {formatDistance(mission.distanceM)}
          {mission.attraction.category
            ? ` · ${mission.attraction.category}`
            : ""}
        </Text>
      </View>
      <SymbolView
        name={{ ios: "chevron.right", android: "chevron_right" }}
        size={15}
        tintColor={colors.muted}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
  },
  hero: {
    gap: spacing.xs,
    paddingBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.chip,
    color: colors.accent,
    fontWeight: "900",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.ink,
  },
  subtitle: {
    ...typography.body,
    color: colors.muted,
  },
  heroStats: {
    flexDirection: "row",
    marginTop: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  stat: {
    flex: 1,
    padding: spacing.lg,
    gap: 2,
  },
  statValue: {
    fontFamily: fontMono,
    fontSize: 22,
    fontWeight: "900",
    color: colors.accent,
  },
  statLabel: {
    ...typography.meta,
    color: colors.muted,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.hairline,
  },
  locationButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.button,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    marginBottom: spacing.xl,
  },
  locationButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl * 3,
  },
  centerText: {
    ...typography.body,
    color: colors.muted,
    textAlign: "center",
  },
  emptyTitle: {
    ...typography.header,
    color: colors.ink,
  },
  sectionTitle: {
    ...typography.body,
    color: colors.ink,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  primaryList: {
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  missionCard: {
    minHeight: 128,
    borderRadius: radius.card,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
  },
  missionImage: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 120,
    backgroundColor: colors.chip,
  },
  missionBadge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
  },
  missionBadgeText: {
    fontFamily: fontMono,
    color: colors.white,
    fontWeight: "900",
  },
  missionBody: {
    paddingTop: spacing.xl + 24,
    paddingHorizontal: spacing.lg,
    paddingRight: 132,
    paddingBottom: spacing.lg,
    gap: 3,
  },
  missionDistance: {
    fontFamily: fontMono,
    color: colors.accent,
    fontWeight: "900",
    fontSize: 13,
  },
  missionTitle: {
    ...typography.header,
    color: colors.ink,
  },
  missionMeta: {
    ...typography.meta,
    color: colors.muted,
  },
  restList: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.hairline,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  rowPressed: {
    backgroundColor: colors.chip,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowImage: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.chip,
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    ...typography.body,
    color: colors.ink,
    fontWeight: "700",
  },
  rowMeta: {
    ...typography.meta,
    color: colors.muted,
  },
});
