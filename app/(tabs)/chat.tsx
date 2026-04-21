import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import { AlertTriangle, Heart, Mic, Plus, SendHorizontal, Volume2, VolumeX } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LanguageSelector } from "@/components/LanguageSelector";

import {
  ChatMedia,
  ChatSource,
  sendChat,
} from "@/services/api";
import { colors, fonts } from "@/constants/theme";
import foodData from "@/data/foodData";
import { foods as foodCatalog } from "@/data/foods";
import { useApp } from "@/context/AppContext";

type FoodItem = {
  id: string;
  name: string;
  vitamin: string;
  image: string;
  advantages: string[];
  disadvantages: string[];
};

type Exchange = {
  id: string;
  question: string;
  answer: string;
  sources?: ChatSource[];
  media?: ChatMedia[];
};

const quickActions = [
  "Quick Actions",
  "What should I eat today?",
  "Is light exercise safe?",
  "What are warning signs I should not ignore?",
] as const;

const introText =
  "Hello! I'm your Maternal AI assistant. Ask anything and I will respond with live, grounded support.";

const nutritionKeywords = ["eat", "eating", "food", "nutrition", "meal", "diet", "fruit", "healthy"];

const languageToLocale: Record<string, string> = {
  English: "en-US",
  தமிழ்: "ta-IN",
  "हिन्दी": "hi-IN",
  తెలుగు: "te-IN",
  मराठी: "mr-IN",
  "മലയാളം": "ml-IN",
};

type SpeechRecognitionModule = {
  requestPermissionsAsync: () => Promise<{ granted: boolean }>;
  start: (options: {
    lang: string;
    interimResults: boolean;
    continuous: boolean;
    requiresOnDeviceRecognition: boolean;
    addsPunctuation: boolean;
  }) => void;
  stop: () => void;
};

const speechRecognitionModule: SpeechRecognitionModule | null = (() => {
  try {
    const mod = require("expo-speech-recognition") as {
      ExpoSpeechRecognitionModule?: SpeechRecognitionModule;
    };
    return mod.ExpoSpeechRecognitionModule ?? null;
  } catch {
    return null;
  }
})();

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
}

function buildFoodOnlyAnswer(question: string) {
  const normalizedQuestion = normalizeText(question);
  const hasNutritionIntent = nutritionKeywords.some((keyword) => normalizedQuestion.includes(keyword));

  if (!hasNutritionIntent) return null;

  const questionTokens = normalizedQuestion
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  const directMatches = Object.entries(foodData)
    .filter(([name]) => {
      const normalizedName = normalizeText(name);
      return questionTokens.some((token) => normalizedName.includes(token));
    })
    .slice(0, 4);

  const fallbackFoods = ["avocado", "banana", "orange", "apple"];
  const selectedEntries = directMatches.length
    ? directMatches
    : fallbackFoods
        .map((key) => [key, foodData[key]] as const)
        .filter((entry) => Boolean(entry[1]))
        .slice(0, 4);

  if (selectedEntries.length === 0) {
    return "I could not find enough food details right now. Please try a specific fruit or meal item.";
  }

  const lines = selectedEntries.map(([name, details]) => {
    const safeName = name
      .split(" ")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");

    const mainBenefit = details.advantages[0] ?? "Nutritious in moderation";
    const caution = details.disadvantages[0] ?? "Use moderate portions";

    return `- ${safeName}: ${mainBenefit}. Caution: ${caution}.`;
  });

  return [
    "Based on our food data, these are relevant pregnancy-friendly options:",
    ...lines,
    "Use variety and moderate portions through the day.",
  ].join("\n");
}

export default function ChatScreen() {
  const { selectedLanguage } = useApp();
  const router = useRouter();
  const locale = languageToLocale[selectedLanguage] ?? "en-US";

  const scrollRef = useRef<ScrollView | null>(null);
  const params = useLocalSearchParams<{ q?: string }>();
  const consumedPrefillRef = useRef<string>("");

  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const canUseSpeechRecognition = Boolean(speechRecognitionModule);

  const foods = useMemo<FoodItem[]>(() => {
    const fallback = {
      advantages: ["Nutritious in moderation"],
      disadvantages: ["Check portions and individual tolerance"],
    };

    const preferredNames = ["apple", "banana", "orange"];
    const preferred = preferredNames
      .map((key) => {
        const catalogItem = foodCatalog.find((item) => item.name.toLowerCase() === key);
        const details = foodData[key];
        if (!catalogItem && !details) return null;

        return {
          id: key,
          name: key.charAt(0).toUpperCase() + key.slice(1),
          vitamin: "VITAMIN",
          image: details?.image ?? catalogItem?.image ?? "",
          advantages: details?.advantages ?? fallback.advantages,
          disadvantages: details?.disadvantages ?? fallback.disadvantages,
        };
      })
      .filter((item): item is FoodItem => item !== null);

    if (preferred.length > 0) {
      return preferred;
    }

    return foodCatalog.slice(0, 8).map((item) => {
      const key = item.name.toLowerCase();
      const details = foodData[key];
      return {
        id: key,
        name: item.name,
        vitamin: "VITAMIN",
        image: details?.image ?? item.image,
        advantages: details?.advantages ?? fallback.advantages,
        disadvantages: details?.disadvantages ?? fallback.disadvantages,
      };
    });
  }, []);

  const selectedFood = useMemo(() => foods.find((item) => item.id === selectedFoodId) ?? null, [foods, selectedFoodId]);
  const hasTypedInput = input.trim().length > 0;

  const onSelectFood = (food: FoodItem) => {
    setSelectedFoodId(food.id);
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  const onQuickAction = (action: (typeof quickActions)[number]) => {
    if (action === "Quick Actions") return;
    setInput(action);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);
  };

  const animateAnswer = async (exchangeId: string, fullText: string) => {
    const chunks = fullText.split(" ");
    let next = "";

    for (const chunk of chunks) {
      next = next ? `${next} ${chunk}` : chunk;
      setExchanges((prev) =>
        prev.map((item) => (item.id === exchangeId ? { ...item, answer: next } : item))
      );
      scrollToBottom();
      await sleep(28);
    }
  };

  const sendQuestion = useCallback(
    async (textValue: string) => {
      const text = textValue.trim();
      if (!text || loading) return;

      setInput("");

      const foodOnlyAnswer = buildFoodOnlyAnswer(text);
      if (foodOnlyAnswer) {
        setExchanges((prev) => [
          ...prev,
          {
            id: `${Date.now()}`,
            question: text,
            answer: foodOnlyAnswer,
          },
        ]);
        scrollToBottom();
        return;
      }

      const exchangeId = `${Date.now()}`;
      setExchanges((prev) => [
        ...prev,
        {
          id: exchangeId,
          question: text,
          answer: "",
          sources: [],
          media: [],
        },
      ]);
      setLoading(true);
      scrollToBottom();

      const messages = [
        {
          role: "system" as const,
          content:
            "You are Maa, a warm maternal health assistant. Keep responses concise, practical, and medically cautious.",
        },
        { role: "user" as const, content: text },
      ];

      try {
        const result = await sendChat(messages, selectedLanguage);
        const finalText = result.text?.trim() || "I hit a temporary issue. Please try again in a moment.";

        await animateAnswer(exchangeId, finalText);

        setExchanges((prev) =>
          prev.map((item) =>
            item.id === exchangeId
              ? {
                  ...item,
                  answer: finalText,
                  sources: result.sources ?? [],
                  media: result.media ?? [],
                }
              : item
          )
        );
        setLoading(false);
      } catch {
        setExchanges((prev) =>
          prev.map((item) =>
            item.id === exchangeId
              ? {
                  ...item,
                  answer: "I hit a temporary issue. Please try again in a moment.",
                }
              : item
          )
        );
        setLoading(false);
      }
    },
    [loading, selectedLanguage]
  );

  const onSend = async () => {
    await sendQuestion(input);
  };

  const onStartRecording = async () => {
    if (isRecording) return;
    if (!speechRecognitionModule) {
      Alert.alert("Voice input unavailable", "Speech recognition module is not available in this build.");
      return;
    }

    try {
      const permission = await speechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) return;

      speechRecognitionModule.start({
        lang: locale,
        interimResults: false,
        continuous: false,
        requiresOnDeviceRecognition: Platform.OS === "ios",
        addsPunctuation: true,
      });
      setIsRecording(true);
    } catch {
      setIsRecording(false);
    }
  };

  const onStopRecording = async () => {
    if (!speechRecognitionModule) {
      setIsRecording(false);
      return;
    }

    try {
      speechRecognitionModule.stop();
      setIsRecording(false);
    } catch {
      setIsRecording(false);
    }
  };

  const onToggleRecording = () => {
    if (isRecording) {
      onStopRecording().catch(() => undefined);
      return;
    }
    onStartRecording().catch(() => undefined);
  };

  const onSpeakLastAnswer = async () => {
    const lastAnswer = exchanges[exchanges.length - 1]?.answer?.trim();
    if (!lastAnswer || isSpeaking) return;

    try {
      setIsSpeaking(true);
      Speech.speak(lastAnswer, {
        language: locale,
        pitch: 1,
        rate: 0.95,
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    } catch {
      setIsSpeaking(false);
    }
  };

  useEffect(() => {
    const prefilledQuestion = typeof params.q === "string" ? params.q.trim() : "";
    if (!prefilledQuestion) return;
    if (prefilledQuestion === consumedPrefillRef.current) return;

    consumedPrefillRef.current = prefilledQuestion;
    sendQuestion(prefilledQuestion).catch(() => undefined);
  }, [params.q, sendQuestion]);

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 22 : 0}
    >
      <View style={styles.headerWrap}>
        <View style={styles.headerLeft}>
          <View style={styles.logoCircle}>
            <Heart size={16} color={colors.white} fill={colors.white} />
          </View>
          <View>
            <Text style={styles.logoText}>Maternal</Text>
            <View style={styles.aiRow}>
              <View style={styles.aiDot} />
              <Text style={styles.aiText}>AI ASSISTANT</Text>
            </View>
          </View>
        </View>

        <View style={styles.headerRight}>
          <LanguageSelector />
          <TouchableOpacity style={styles.emergencyPillBtn} onPress={() => router.push("/emergency")}>
            <AlertTriangle size={14} color={colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconPillBtn} onPress={() => onSpeakLastAnswer().catch(() => undefined)}>
            {isSpeaking ? <VolumeX size={16} color={colors.brand} /> : <Volume2 size={16} color={colors.brand} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.conversationArea}
        contentContainerStyle={styles.conversationContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.assistantIntroCard}>
          <Text style={styles.assistantIntroText}>{introText}</Text>
          <Text style={styles.languageHint}>Language: {selectedLanguage}</Text>
        </View>

        {selectedFood && (
          <>
            <View style={styles.userQuestionWrap}>
              <View style={styles.userQuestionBubble}>
                <Text style={styles.userQuestionText}>Tell me about {selectedFood.name}</Text>
              </View>
            </View>

            <View style={styles.foodAnswerCard}>
              <Text style={styles.foodAnswerIntro}>
                Here is some information about <Text style={styles.foodNameInline}>{selectedFood.name}</Text>
                {"\n"}
                during pregnancy:
              </Text>

              <Image source={{ uri: selectedFood.image }} style={styles.foodImage} />

              <View style={styles.advantagesCard}>
                <Text style={styles.advantagesTitle}>ADVANTAGES</Text>
                {selectedFood.advantages.map((item) => (
                  <Text key={item} style={styles.listRow}>•   {item}</Text>
                ))}
              </View>

              <View style={styles.disadvantagesCard}>
                <Text style={styles.disadvantagesTitle}>DISADVANTAGES</Text>
                {selectedFood.disadvantages.map((item) => (
                  <Text key={item} style={styles.listRowWarning}>•   {item}</Text>
                ))}
              </View>
            </View>
          </>
        )}

        {exchanges.map((exchange) => (
          <View key={exchange.id} style={styles.exchangeBlock}>
            <View style={styles.userQuestionWrap}>
              <View style={styles.userQuestionBubble}>
                <Text style={styles.userQuestionText}>{exchange.question}</Text>
              </View>
            </View>
            <View style={styles.assistantFollowUpCard}>
              <Text style={styles.assistantIntroText}>{exchange.answer || "..."}</Text>

              {exchange.media && exchange.media.length > 0 ? (
                <View style={styles.mediaWrap}>
                  {exchange.media.map((item) => (
                    <TouchableOpacity
                      key={`${exchange.id}-${item.url}`}
                      style={styles.mediaCard}
                      onPress={() => Linking.openURL(item.url).catch(() => undefined)}
                    >
                      {item.type === "image" ? (
                        <Image source={{ uri: item.url }} style={styles.mediaImage} />
                      ) : (
                        <View style={styles.mediaPlaceholder}>
                          <Text style={styles.mediaType}>{item.type.toUpperCase()}</Text>
                        </View>
                      )}
                      <Text numberOfLines={1} style={styles.mediaTitle}>{item.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {exchange.sources && exchange.sources.length > 0 ? (
                <View style={styles.sourcesWrap}>
                  <Text style={styles.sourcesTitle}>Sources</Text>
                  {exchange.sources.map((source) => (
                    <TouchableOpacity
                      key={`${exchange.id}-${source.url}`}
                      style={styles.sourceItem}
                      onPress={() => Linking.openURL(source.url).catch(() => undefined)}
                    >
                      <Text numberOfLines={1} style={styles.sourceText}>{source.url}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}
            </View>
          </View>
        ))}

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color={colors.brand} />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomPanel}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.foodChipsRow}>
          {foods.map((food) => {
            const active = selectedFoodId === food.id;
            return (
              <TouchableOpacity key={food.id} style={[styles.foodChip, active && styles.foodChipActive]} onPress={() => onSelectFood(food)}>
                <Image source={{ uri: food.image }} style={styles.foodChipImage} />
                <View>
                  <Text style={styles.foodChipName}>{food.name}</Text>
                  <Text style={styles.foodChipVitamin}>{food.vitamin}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickActionsRow}>
          {quickActions.map((item, index) => {
            const isPrimary = index === 0;
            return (
              <TouchableOpacity
                key={item}
                style={[styles.quickActionChip, isPrimary && styles.quickActionChipPrimary]}
                onPress={() => onQuickAction(item)}
              >
                <Text style={[styles.quickActionText, isPrimary && styles.quickActionTextPrimary]}>
                  {isPrimary ? "+   Quick Actions" : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachBtn}>
            <Plus size={18} color="#6B7A9C" />
          </TouchableOpacity>

          <View style={styles.whatsappComposer}>
            <TextInput
              value={input}
              onChangeText={setInput}
              onSubmitEditing={onSend}
              multiline
              placeholder="Ask anything..."
              placeholderTextColor="#C5CCDC"
              style={styles.whatsappInput}
              returnKeyType="send"
            />

            <TouchableOpacity
              style={[
                styles.voiceSendBtn,
                hasTypedInput && styles.voiceSendBtnSend,
                isRecording && styles.voiceSendBtnRecording,
                !hasTypedInput && !canUseSpeechRecognition && styles.sendBtnDisabled,
                loading && hasTypedInput && styles.sendBtnDisabled,
              ]}
              onPress={hasTypedInput ? onSend : onToggleRecording}
              disabled={(loading && hasTypedInput) || (!hasTypedInput && !canUseSpeechRecognition)}
            >
              {hasTypedInput ? (
                <SendHorizontal size={16} color={colors.white} />
              ) : (
                <Mic size={16} color={isRecording ? colors.white : "#6C7CA0"} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F6F6F8",
  },
  headerWrap: {
    marginTop: 12,
    position: "relative",
    zIndex: 120,
    elevation: 30,
    overflow: "visible",
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "#ECEEF4",
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    fontFamily: fonts.serif,
    fontSize: 33 / 2,
    color: "#252A39",
  },
  aiRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  aiDot: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#25C45E",
  },
  aiText: {
    color: "#8B93AE",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    position: "relative",
    zIndex: 140,
  },
  iconPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF1F5",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#FDE2EA",
  },
  emergencyPillBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#D6285A",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#D6285A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  conversationArea: {
    flex: 1,
  },
  conversationContent: {
    paddingHorizontal: 14,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 14,
  },
  assistantIntroCard: {
    width: "86%",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 28,
    borderTopLeftRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
  },
  assistantIntroText: {
    color: "#243456",
    fontSize: 30 / 2,
    lineHeight: 24,
    fontWeight: "500",
  },
  languageHint: {
    marginTop: 8,
    color: "#7D8FB1",
    fontSize: 11,
    fontWeight: "700",
  },
  userQuestionWrap: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: 4,
  },
  userQuestionBubble: {
    maxWidth: "74%",
    backgroundColor: colors.brand,
    paddingHorizontal: 16,
    minHeight: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.brand,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },
  userQuestionText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "800",
  },
  foodAnswerCard: {
    alignSelf: "center",
    width: "90%",
    backgroundColor: colors.white,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EEF0F5",
  },
  foodAnswerIntro: {
    color: "#243456",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 14,
  },
  foodNameInline: {
    color: colors.brand,
    fontWeight: "900",
  },
  foodImage: {
    width: 96,
    height: 96,
    borderRadius: 16,
    marginBottom: 14,
  },
  advantagesCard: {
    borderRadius: 15,
    backgroundColor: "#ECF7F1",
    borderWidth: 1,
    borderColor: "#D0EEDD",
    padding: 12,
    marginBottom: 10,
  },
  disadvantagesCard: {
    borderRadius: 15,
    backgroundColor: "#FFF8E9",
    borderWidth: 1,
    borderColor: "#F3E2B8",
    padding: 12,
  },
  advantagesTitle: {
    color: "#00A04B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  disadvantagesTitle: {
    color: "#E09B13",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  listRow: {
    color: "#124E2F",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  listRowWarning: {
    color: "#9E5300",
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "600",
  },
  exchangeBlock: {
    gap: 8,
  },
  assistantFollowUpCard: {
    width: "92%",
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF0F5",
    gap: 8,
  },
  mediaWrap: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  mediaCard: {
    width: 132,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E7ECF8",
    backgroundColor: "#F8FAFF",
    overflow: "hidden",
  },
  mediaImage: {
    width: "100%",
    height: 72,
  },
  mediaPlaceholder: {
    height: 72,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EEF3FF",
  },
  mediaType: {
    color: "#5E739B",
    fontSize: 10,
    fontWeight: "900",
  },
  mediaTitle: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: "#425783",
    fontSize: 11,
    fontWeight: "700",
  },
  sourcesWrap: {
    gap: 6,
  },
  sourcesTitle: {
    color: "#7487AD",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  sourceItem: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E8ECF7",
    backgroundColor: "#FAFCFF",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  sourceText: {
    color: "#60759E",
    fontSize: 11,
    fontWeight: "600",
  },
  loadingWrap: {
    paddingVertical: 10,
    alignItems: "center",
  },
  bottomPanel: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: "#ECEEF4",
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  foodChipsRow: {
    paddingHorizontal: 12,
    gap: 10,
  },
  foodChip: {
    minWidth: 112,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8EBF2",
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  foodChipActive: {
    borderWidth: 2,
    borderColor: "#1F2431",
  },
  foodChipImage: {
    width: 30,
    height: 30,
    borderRadius: 8,
  },
  foodChipName: {
    color: "#273455",
    fontSize: 12,
    fontWeight: "800",
  },
  foodChipVitamin: {
    color: "#9AA2BC",
    fontSize: 9,
    fontWeight: "700",
    marginTop: 1,
  },
  quickActionsRow: {
    paddingHorizontal: 12,
    gap: 8,
  },
  quickActionChip: {
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E7EAF1",
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionChipPrimary: {
    borderColor: "#FFD4DF",
    backgroundColor: "#FFF8FA",
  },
  quickActionText: {
    color: "#607090",
    fontSize: 12,
    fontWeight: "700",
  },
  quickActionTextPrimary: {
    color: colors.brand,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingTop: 2,
    paddingBottom: 2,
  },
  attachBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#E7EAF1",
    backgroundColor: "#F7FAFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1B2A52",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  whatsappComposer: {
    flex: 1,
    minHeight: 48,
    maxHeight: 108,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7EAF1",
    backgroundColor: "#F8FAFF",
    flexDirection: "row",
    alignItems: "flex-end",
    paddingLeft: 14,
    paddingRight: 5,
    paddingTop: 6,
    paddingBottom: 5,
    gap: 6,
  },
  whatsappInput: {
    flex: 1,
    color: "#2A3757",
    fontSize: 14,
    fontWeight: "600",
    maxHeight: 90,
    paddingTop: 3,
    paddingBottom: 3,
  },
  voiceSendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E9EEF8",
    borderWidth: 1,
    borderColor: "#DDE5F4",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceSendBtnSend: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  voiceSendBtnRecording: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  sendBtnDisabled: {
    opacity: 0.45,
  },
});
