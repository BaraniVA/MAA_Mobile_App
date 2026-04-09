import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";
import { useApp } from "@/context/AppContext";
import { Card } from "@/components/Card";
import { InlineToast } from "@/components/InlineToast";
import { colors, inkBorder, radius, spacing } from "@/constants/theme";
import { ChatMessage, sendChat, requestTts } from "@/services/api";

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const speechModule: any = null;

function TypingDots() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;
  const c = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulse = (value: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, { toValue: 1, duration: 280, useNativeDriver: true }),
          Animated.timing(value, { toValue: 0.2, duration: 280, useNativeDriver: true })
        ])
      );

    const one = pulse(a, 0);
    const two = pulse(b, 120);
    const three = pulse(c, 240);
    one.start();
    two.start();
    three.start();

    return () => {
      one.stop();
      two.stop();
      three.stop();
    };
  }, [a, b, c]);

  return (
    <View style={styles.typingRow}>
      <Animated.View style={[styles.typingDot, { opacity: a }]} />
      <Animated.View style={[styles.typingDot, { opacity: b }]} />
      <Animated.View style={[styles.typingDot, { opacity: c }]} />
    </View>
  );
}

export default function ChatScreen() {
  const { profile } = useApp();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [autoPlay, setAutoPlay] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);
  const scrollRef = useRef<ScrollView | null>(null);

  const chatMessages = useMemo<ChatMessage[]>(() => {
    const system: ChatMessage = {
      role: "system",
      content:
        "You are Maa, a warm and knowledgeable maternal health companion. Answer only pregnancy, nutrition, wellness, and emotional support questions. Be concise, caring, and never alarmist."
    };

    const recent = messages.slice(-20).map((m) => ({
      role: m.role,
      content: m.content
    })) as ChatMessage[];

    return [system, ...recent];
  }, [messages]);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => undefined);
      }
    };
  }, []);

  useEffect(() => {
    if (!speechModule) return;

    const onResult = (event: any) => {
      const transcript = event?.results?.[0]?.transcript || event?.transcript || "";
      if (transcript) {
        setInput((prev) => `${prev} ${transcript}`.trim());
      }
    };

    const onEnd = () => setIsListening(false);

    speechModule.addListener?.("result", onResult);
    speechModule.addListener?.("end", onEnd);

    return () => {
      speechModule.removeAllListeners?.("result");
      speechModule.removeAllListeners?.("end");
    };
  }, []);

  const playTts = async (text: string) => {
    try {
      const voice = profile?.preferred_voice || "default";
      const blob = await requestTts(text, voice);
      const arrayBuffer = await blob.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString("base64");
      const target = `${FileSystem.cacheDirectory}maa-tts-${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(target, base64, { encoding: FileSystem.EncodingType.Base64 });

      if (soundRef.current) {
        await soundRef.current.unloadAsync();
      }

      const { sound } = await Audio.Sound.createAsync({ uri: target }, { shouldPlay: true });
      soundRef.current = sound;
    } catch {
      setToast("Could not play TTS audio.");
    }
  };

  const send = async () => {
    if (!input.trim() || loading) return;

    const userMessage: UiMessage = { id: `${Date.now()}-u`, role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setToast("");

    try {
      const response = await sendChat([
        ...chatMessages,
        { role: "user", content: userMessage.content }
      ]);

      const aiMessage: UiMessage = {
        id: `${Date.now()}-a`,
        role: "assistant",
        content: response.text
      };

      setMessages((prev) => [...prev, aiMessage]);
      if (autoPlay) {
        await playTts(response.text);
      }
    } catch {
      setToast("Unable to reach Maa AI right now.");
    } finally {
      setLoading(false);
      requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
    }
  };

  const toggleListening = async () => {
    if (!speechModule) {
      setToast("Speech recognition module is unavailable on this runtime.");
      return;
    }

    try {
      if (isListening) {
        speechModule.stop?.();
        setIsListening(false);
        return;
      }

      const permission = await speechModule.requestPermissionsAsync?.();
      if (permission && permission.granted === false) {
        setToast("Microphone permission denied.");
        return;
      }

      speechModule.start?.({
        lang: "en-US",
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        onDevice: true
      });
      setIsListening(true);
    } catch {
      setToast("Could not start speech-to-text.");
      setIsListening(false);
    }
  };

  return (
    <View style={styles.screen}>
      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>Maa Chat</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Auto-play</Text>
          <Switch
            value={autoPlay}
            onValueChange={setAutoPlay}
            thumbColor={colors.white}
            trackColor={{ false: colors.sage, true: colors.rose }}
          />
        </View>
      </View>

      {toast ? <InlineToast type="error" message={toast} /> : null}

      <ScrollView
        ref={(ref) => {
          scrollRef.current = ref;
        }}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {messages.map((message) => {
          const isUser = message.role === "user";
          return (
            <View key={message.id} style={[styles.bubbleRow, isUser ? styles.right : styles.left]}>
              <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
                <Text style={styles.bubbleText}>{message.content}</Text>
                {!isUser ? (
                  <TouchableOpacity onPress={() => playTts(message.content)} style={styles.speakerBtn}>
                    <Text style={styles.speakerText}>🔊</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          );
        })}

        {loading ? (
          <Card style={{ alignSelf: "flex-start", paddingVertical: spacing.sm }}>
            <TypingDots />
          </Card>
        ) : null}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Ask Maa anything about pregnancy wellness"
          placeholderTextColor="#7A7A7A"
          style={styles.input}
          multiline
        />
        <TouchableOpacity
          onPress={toggleListening}
          style={[styles.iconBtn, isListening && { backgroundColor: colors.blush }]}
        >
          <Text>🎤</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={send} style={styles.sendBtn} disabled={loading}>
          {loading ? <ActivityIndicator size="small" color={colors.charcoal} /> : <Text style={styles.sendText}>Send</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.ivory,
    padding: spacing.md
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm
  },
  headerTitle: {
    color: colors.charcoal,
    fontFamily: "PlayfairDisplay_600SemiBold",
    fontSize: 28
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs
  },
  toggleLabel: {
    color: colors.charcoal,
    fontFamily: "Inter_500Medium",
    fontSize: 12
  },
  list: {
    flex: 1
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  bubbleRow: {
    width: "100%"
  },
  left: {
    alignItems: "flex-start"
  },
  right: {
    alignItems: "flex-end"
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.md,
    ...inkBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  userBubble: {
    backgroundColor: colors.rose
  },
  aiBubble: {
    backgroundColor: colors.ivory
  },
  bubbleText: {
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22
  },
  speakerBtn: {
    alignSelf: "flex-end",
    marginTop: spacing.xs,
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2
  },
  speakerText: {
    fontSize: 12
  },
  typingRow: {
    flexDirection: "row",
    gap: spacing.xs,
    alignItems: "center"
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.charcoal
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm
  },
  input: {
    flex: 1,
    maxHeight: 120,
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    color: colors.charcoal,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  iconBtn: {
    width: 42,
    height: 42,
    backgroundColor: colors.white,
    ...inkBorder,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  sendBtn: {
    height: 42,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.rose,
    ...inkBorder,
    borderRadius: radius.sm,
    justifyContent: "center"
  },
  sendText: {
    color: colors.charcoal,
    fontFamily: "Inter_600SemiBold"
  }
});
