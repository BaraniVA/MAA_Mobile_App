import { useMemo, useRef, useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { ArrowLeft, Barcode, Camera, Sparkles } from "lucide-react-native";

import { colors, fonts } from "@/constants/theme";
import { classifyFoodForPregnancy, lookupFoodFromBarcode, NutritionScanResult } from "@/services/nutritionScanner";

type ScanMode = "photo" | "barcode";

export default function NutritionScannerScreen() {
  const router = useRouter();
  const cameraRef = useRef<CameraView | null>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [mode, setMode] = useState<ScanMode>("photo");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [manualFoodName, setManualFoodName] = useState("");
  const [barcodeLocked, setBarcodeLocked] = useState(false);
  const [lastBarcode, setLastBarcode] = useState("");
  const [result, setResult] = useState<NutritionScanResult | null>(null);

  const safetyColors = useMemo(() => {
    if (!result) return { bg: "#F2F5FB", fg: "#4A5F89" };
    if (result.safety === "safe") return { bg: "#E8F7EF", fg: "#178548" };
    if (result.safety === "avoid") return { bg: "#FDECEF", fg: "#B2284C" };
    return { bg: "#FFF6E8", fg: "#B47B10" };
  }, [result]);

  const onTakePhoto = async () => {
    if (!cameraRef.current) return;
    try {
      const captured = await cameraRef.current.takePictureAsync({ quality: 0.6, skipProcessing: true });
      if (!captured?.uri) return;
      setPhotoUri(captured.uri);
      setResult(null);
    } catch {
      Alert.alert("Camera error", "Could not capture photo.");
    }
  };

  const onAnalyzePhoto = () => {
    if (!manualFoodName.trim()) {
      Alert.alert("Food name required", "After taking a photo, enter the food name for local guidance.");
      return;
    }
    setResult(classifyFoodForPregnancy(manualFoodName));
  };

  const onBarcodeScanned = (payload: { data: string }) => {
    if (mode !== "barcode" || barcodeLocked) return;
    setBarcodeLocked(true);

    const nextBarcode = payload.data;
    setLastBarcode(nextBarcode);

    const matchedFood = lookupFoodFromBarcode(nextBarcode) ?? "Unknown packaged food";
    setResult(classifyFoodForPregnancy(matchedFood));

    setTimeout(() => setBarcodeLocked(false), 1200);
  };

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.centerWrap]}>
        <Text style={styles.permissionTitle}>Camera Access Needed</Text>
        <Text style={styles.permissionText}>Enable camera permission to scan food photos or barcodes.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => requestPermission().catch(() => undefined)}>
          <Text style={styles.primaryBtnText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={18} color="#40557E" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Smart Nutrition Scanner</Text>
          <Text style={styles.subtitle}>Local guidance: safe, limit, or avoid</Text>
        </View>
      </View>

      <View style={styles.modeRow}>
        <TouchableOpacity style={[styles.modeBtn, mode === "photo" && styles.modeBtnActive]} onPress={() => setMode("photo")}>
          <Camera size={15} color={mode === "photo" ? colors.white : "#5C7098"} />
          <Text style={[styles.modeText, mode === "photo" && styles.modeTextActive]}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.modeBtn, mode === "barcode" && styles.modeBtnActive]} onPress={() => setMode("barcode")}>
          <Barcode size={15} color={mode === "barcode" ? colors.white : "#5C7098"} />
          <Text style={[styles.modeText, mode === "barcode" && styles.modeTextActive]}>Barcode</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cameraWrap}>
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onBarcodeScanned={mode === "barcode" ? onBarcodeScanned : undefined}
        />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {mode === "photo" ? (
          <>
            <TouchableOpacity style={styles.primaryBtn} onPress={() => onTakePhoto().catch(() => undefined)}>
              <Text style={styles.primaryBtnText}>Capture Photo</Text>
            </TouchableOpacity>

            {photoUri ? <Image source={{ uri: photoUri }} style={styles.previewImage} /> : null}

            <TextInput
              value={manualFoodName}
              onChangeText={setManualFoodName}
              placeholder="Enter food name from photo"
              placeholderTextColor="#9AA7C1"
              style={styles.input}
            />

            <TouchableOpacity style={styles.secondaryBtn} onPress={onAnalyzePhoto}>
              <Sparkles size={14} color="#4E648F" />
              <Text style={styles.secondaryBtnText}>Analyze with Local Rules</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.barcodeInfoCard}>
            <Text style={styles.barcodeLabel}>Last Barcode</Text>
            <Text style={styles.barcodeValue}>{lastBarcode || "Scan a package barcode"}</Text>
          </View>
        )}

        {result ? (
          <View style={styles.resultCard}>
            <View style={[styles.badge, { backgroundColor: safetyColors.bg }]}> 
              <Text style={[styles.badgeText, { color: safetyColors.fg }]}>{result.safety.toUpperCase()}</Text>
            </View>
            <Text style={styles.resultFood}>{result.matchedFood}</Text>
            <Text style={styles.resultReason}>{result.reason}</Text>
            <View style={styles.guidanceWrap}>
              {result.guidance.map((item) => (
                <Text key={item} style={styles.guidanceLine}>• {item}</Text>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    paddingTop: 22,
  },
  centerWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  permissionTitle: {
    color: "#2A3B5F",
    fontFamily: fonts.serif,
    fontSize: 22,
    marginBottom: 10,
  },
  permissionText: {
    color: "#6A7FA7",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E8ECF6",
  },
  title: {
    color: "#243456",
    fontFamily: fonts.serif,
    fontSize: 17,
  },
  subtitle: {
    color: "#7E8FAF",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 2,
  },
  modeRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 12,
  },
  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E8ECF6",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#FFFFFF",
  },
  modeBtnActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  modeText: {
    color: "#5C7098",
    fontSize: 12,
    fontWeight: "800",
  },
  modeTextActive: {
    color: colors.white,
  },
  cameraWrap: {
    height: 238,
    borderRadius: 18,
    overflow: "hidden",
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#DDE4F1",
  },
  camera: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  primaryBtn: {
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  previewImage: {
    width: "100%",
    height: 164,
    borderRadius: 14,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#243456",
    fontSize: 13,
    fontWeight: "700",
  },
  secondaryBtn: {
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  secondaryBtnText: {
    color: "#4E648F",
    fontSize: 12,
    fontWeight: "800",
  },
  barcodeInfoCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 5,
  },
  barcodeLabel: {
    color: "#7D8EB0",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  barcodeValue: {
    color: "#2D4066",
    fontSize: 13,
    fontWeight: "800",
  },
  resultCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E7ECF6",
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 8,
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.7,
  },
  resultFood: {
    color: "#233556",
    fontSize: 15,
    fontWeight: "900",
  },
  resultReason: {
    color: "#5E739B",
    fontSize: 12,
    fontWeight: "700",
  },
  guidanceWrap: {
    gap: 6,
  },
  guidanceLine: {
    color: "#4D638C",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
});
