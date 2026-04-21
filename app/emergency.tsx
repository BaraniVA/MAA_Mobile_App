import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { router } from "expo-router";
import { Ambulance, ArrowLeft, Crosshair, MapPinned, PhoneCall } from "lucide-react-native";

import { colors, fonts } from "@/constants/theme";
import {
  buildDirectionsUrl,
  buildIndiaOverviewMapUrl,
  Coordinates,
  findNearbyMaternalHospitals,
  type EmergencyHospital,
} from "@/services/emergency";

const INDIA_REGION = {
  latitude: 22.5937,
  longitude: 78.9629,
  latitudeDelta: 26,
  longitudeDelta: 26,
};

const INDIA_CENTER: [number, number] = [78.9629, 22.5937];
const INDIA_BOUNDS: [number, number, number, number] = [67.0, 6.0, 98.0, 38.0];
const INDIA_OVERVIEW_ZOOM = 3.6;
const NEAR_ME_ZOOM = 10.8;
const OPEN_MAP_STYLE_URL = "https://demotiles.maplibre.org/style.json";

export default function EmergencyScreen() {
  const cameraRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  const [hospitals, setHospitals] = useState<EmergencyHospital[]>([]);

  const mapLibreModule = useMemo(() => {
    try {
      return require("@maplibre/maplibre-react-native") as typeof import("@maplibre/maplibre-react-native");
    } catch {
      return null;
    }
  }, []);

  const MapComponent = mapLibreModule?.Map;
  const CameraComponent = mapLibreModule?.Camera;
  const MarkerComponent = mapLibreModule?.Marker;
  const UserLocationComponent = mapLibreModule?.UserLocation;
  const mapAvailable = Platform.OS !== "web" && Boolean(MapComponent && CameraComponent && MarkerComponent);

  const maternalCenters = useMemo(() => hospitals.filter((item) => item.hasMaternalCare), [hospitals]);
  const visibleHospitals = maternalCenters.length > 0 ? maternalCenters : hospitals;

  const callNumber = useCallback(async (phoneNumber: string) => {
    const sanitized = phoneNumber.replace(/\s+/g, "");
    const telUrl = `tel:${sanitized}`;
    const canOpen = await Linking.canOpenURL(telUrl);

    if (!canOpen) {
      Alert.alert("Call unavailable", "Phone calling is not supported on this device.");
      return;
    }

    await Linking.openURL(telUrl);
  }, []);

  const fetchNearbyCenters = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setError("Location access is needed to find nearby maternal-care hospitals.");
        setLoading(false);
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const origin = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      setUserLocation(origin);
      if (mapAvailable) {
        cameraRef.current?.flyTo({
          center: [origin.longitude, origin.latitude],
          zoom: NEAR_ME_ZOOM,
          duration: 700,
        });
      }

      const facilities = await findNearbyMaternalHospitals(origin, {
        radiusMeters: 50000,
        limit: 36,
      });

      setHospitals(facilities);

      if (facilities.length === 0) {
        setError("No hospitals were found nearby right now. Try again or zoom out to search wider.");
      }
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "";
      if (message.includes("429")) {
        setError("Hospital service is busy right now. Please retry in a moment.");
      } else {
        setError("We could not fetch nearby hospitals right now. Please try again shortly.");
      }
    } finally {
      setLoading(false);
    }
  }, [mapAvailable]);

  useEffect(() => {
    fetchNearbyCenters().catch(() => undefined);
  }, [fetchNearbyCenters]);

  const openDirections = useCallback(async (hospital: EmergencyHospital) => {
    if (!userLocation) {
      setError("Enable location first to get directions.");
      return;
    }

    const url = buildDirectionsUrl(userLocation, {
      latitude: hospital.latitude,
      longitude: hospital.longitude,
    });

    await Linking.openURL(url);
  }, [userLocation]);

  const jumpToIndia = useCallback(() => {
    cameraRef.current?.fitBounds(INDIA_BOUNDS, {
      duration: 650,
      padding: { top: 22, right: 22, bottom: 22, left: 22 },
    });
  }, []);

  const openIndiaMap = useCallback(async () => {
    await Linking.openURL(buildIndiaOverviewMapUrl());
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#20324E" />
        </Pressable>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Emergency Support</Text>
          <Text style={styles.subtitle}>Nearby maternal care + ambulance access</Text>
        </View>

        <Pressable style={styles.hotlineButton} onPress={() => callNumber("108").catch(() => undefined)}>
          <Ambulance size={14} color={colors.white} />
          <Text style={styles.hotlineText}>108</Text>
        </Pressable>
      </View>

      <View style={styles.mapShell}>
        {mapAvailable ? (
          <MapComponent
            style={styles.map}
            mapStyle={OPEN_MAP_STYLE_URL}
            attribution
            logo
            compass
            scaleBar={false}
            touchRotate={false}
            touchPitch={false}
          >
            <CameraComponent
              ref={cameraRef}
              initialViewState={{ center: INDIA_CENTER, zoom: INDIA_OVERVIEW_ZOOM }}
              minZoom={3.4}
              maxZoom={15}
              maxBounds={INDIA_BOUNDS}
            />

            {userLocation ? <UserLocationComponent animated accuracy heading /> : null}

            {visibleHospitals.map((hospital) => (
              <MarkerComponent
                key={hospital.id}
                id={hospital.id}
                lngLat={[hospital.longitude, hospital.latitude]}
              >
                <View
                  style={[
                    styles.markerDot,
                    hospital.hasMaternalCare ? styles.markerMaternal : styles.markerGeneral,
                  ]}
                />
              </MarkerComponent>
            ))}
          </MapComponent>
        ) : (
          <View style={styles.mapFallback}>
            <Text style={styles.mapFallbackTitle}>MapLibre is not available in this build.</Text>
            <Text style={styles.mapFallbackText}>Run a custom dev client or production build, then reload this screen.</Text>
          </View>
        )}

        <View style={styles.mapControls}>
          <Pressable style={styles.controlPill} onPress={jumpToIndia}>
            <MapPinned size={14} color="#20324E" />
            <Text style={styles.controlText}>India</Text>
          </Pressable>
          <Pressable style={styles.controlPill} onPress={() => fetchNearbyCenters().catch(() => undefined)}>
            <Crosshair size={14} color="#20324E" />
            <Text style={styles.controlText}>Near Me</Text>
          </Pressable>
          <Pressable style={styles.controlPill} onPress={() => openIndiaMap().catch(() => undefined)}>
            <Text style={styles.controlText}>Open OSM</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <Pressable style={styles.emergencyAction} onPress={() => callNumber("108").catch(() => undefined)}>
          <PhoneCall size={16} color={colors.white} />
          <Text style={styles.emergencyActionText}>Book Ambulance (108)</Text>
        </Pressable>
        <Pressable
          style={[styles.emergencyAction, styles.secondaryAction]}
          onPress={() => callNumber("102").catch(() => undefined)}
        >
          <PhoneCall size={16} color="#A12344" />
          <Text style={styles.secondaryActionText}>Janani / Maternal Line (102)</Text>
        </Pressable>
      </View>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Nearby Hospitals</Text>
        {loading ? <ActivityIndicator size="small" color={colors.brand} /> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        {visibleHospitals.map((hospital) => (
          <View key={`${hospital.id}-card`} style={styles.hospitalCard}>
            <View style={styles.cardTopRow}>
              <Text style={styles.hospitalName}>{hospital.name}</Text>
              <View style={[styles.badge, hospital.hasMaternalCare ? styles.badgePink : styles.badgeBlue]}>
                <Text style={styles.badgeText}>{hospital.hasMaternalCare ? "Maternal" : "General"}</Text>
              </View>
            </View>

            <Text style={styles.hospitalMeta}>{hospital.address}</Text>
            <Text style={styles.hospitalMeta}>{hospital.distanceKm.toFixed(1)} km away</Text>

            <View style={styles.cardActions}>
              <Pressable style={styles.cardActionBtn} onPress={() => openDirections(hospital).catch(() => undefined)}>
                <Text style={styles.cardActionText}>Directions</Text>
              </Pressable>

              <Pressable
                style={[styles.cardActionBtn, styles.cardActionGhost]}
                onPress={() =>
                  callNumber(hospital.phone || "108").catch(() => undefined)
                }
              >
                <Text style={[styles.cardActionText, styles.cardActionGhostText]}>
                  {hospital.phone ? `Call ${hospital.phone}` : "Call Ambulance"}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>

      {Platform.OS === "web" ? (
        <Text style={styles.webHint}>
          Calling may be limited in browser mode. Use a real device for one-tap calling.
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFF",
  },
  header: {
    paddingHorizontal: 14,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#DEE6F3",
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  title: {
    fontFamily: fonts.serif,
    color: "#1A2A48",
    fontSize: 18,
  },
  subtitle: {
    color: "#5D6F92",
    fontWeight: "700",
    fontSize: 11,
    marginTop: 2,
  },
  hotlineButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D6285A",
  },
  hotlineText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 12,
  },
  mapShell: {
    marginTop: 10,
    marginHorizontal: 12,
    borderRadius: 22,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DDE5F4",
    backgroundColor: colors.white,
    height: 300,
  },
  map: {
    flex: 1,
  },
  markerDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.white,
  },
  markerMaternal: {
    backgroundColor: colors.brand,
  },
  markerGeneral: {
    backgroundColor: "#3C8DFF",
  },
  mapFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: "#F6FAFF",
  },
  mapFallbackTitle: {
    color: "#20324E",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },
  mapFallbackText: {
    color: "#6C7B98",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  mapControls: {
    position: "absolute",
    right: 10,
    top: 10,
    gap: 8,
  },
  controlPill: {
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderWidth: 1,
    borderColor: "#DCE4F3",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
  },
  controlText: {
    color: "#20324E",
    fontSize: 11,
    fontWeight: "800",
  },
  actionsRow: {
    marginTop: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  emergencyAction: {
    height: 44,
    borderRadius: 14,
    backgroundColor: "#D6285A",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  emergencyActionText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
  },
  secondaryAction: {
    backgroundColor: "#FFE7EF",
    borderWidth: 1,
    borderColor: "#FFC6D7",
  },
  secondaryActionText: {
    color: "#A12344",
    fontSize: 13,
    fontWeight: "900",
  },
  listHeader: {
    marginTop: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  listTitle: {
    color: "#1A2A48",
    fontSize: 16,
    fontWeight: "900",
  },
  errorText: {
    color: "#B03A56",
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 14,
    marginTop: 6,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 20,
    gap: 9,
  },
  hospitalCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E4EBF8",
    backgroundColor: colors.white,
    padding: 12,
    gap: 7,
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  hospitalName: {
    flex: 1,
    color: "#1A2A48",
    fontWeight: "800",
    fontSize: 14,
  },
  hospitalMeta: {
    color: "#677A9F",
    fontSize: 12,
    fontWeight: "600",
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  badgePink: {
    backgroundColor: "#FFE8EF",
  },
  badgeBlue: {
    backgroundColor: "#E8F2FF",
  },
  badgeText: {
    color: "#27406C",
    fontSize: 10,
    fontWeight: "800",
  },
  cardActions: {
    marginTop: 2,
    flexDirection: "row",
    gap: 8,
  },
  cardActionBtn: {
    flex: 1,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1F3968",
  },
  cardActionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  cardActionGhost: {
    backgroundColor: "#EEF3FF",
    borderWidth: 1,
    borderColor: "#D8E3FA",
  },
  cardActionGhostText: {
    color: "#27406C",
  },
  webHint: {
    paddingHorizontal: 14,
    paddingBottom: 10,
    color: "#7A869B",
    fontSize: 11,
    fontWeight: "600",
  },
});
