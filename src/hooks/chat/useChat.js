import { useState, useRef } from "react";
import { Alert } from "react-native";
import chatService from "../../services/chatService";

export const useChat = (connectionStatus) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const flatListRef = useRef(null);

  const addAssistantFromResponse = (responseJson) => {
    const processed = chatService.processWebSocketMessage(responseJson);
    if (!processed) return;

    setMessages((prev) => {
      if (Array.isArray(processed)) {
        const next = [...prev];
        for (const msg of processed) {
          if (!next.some((m) => m.id === msg.id)) next.push(msg);
        }
        return next;
      }
      if (prev.some((m) => m.id === processed.id)) return prev;
      return [...prev, processed];
    });

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const ensureThread = async () => {
    if (threadId) return threadId;

    const response = await chatService.createThread();
    const newThreadId = response?.thread_id;
    if (!newThreadId) {
      throw new Error("Thread oluşturuldu ama thread_id alınamadı");
    }

    setThreadId(newThreadId);
    return newThreadId;
  };

  const sendMessage = async () => {
    const text = inputText.trim();
    if (!text || connectionStatus !== "connected") return;

    try {
      const ensuredThreadId = await ensureThread();

      const userMessage = {
        id: Date.now().toString(),
        role: "user",
        content: text,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);
      setInputText("");

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

      const response = await chatService.sendTextMessage({
        threadId: ensuredThreadId,
        text,
      });

      addAssistantFromResponse(response);
    } catch (error) {
      console.error("❌ Mesaj gönderme hatası:", error);
      Alert.alert("Hata", "Mesaj gönderilirken bir hata oluştu");
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setInputText("");
    setIsTyping(false);
  };

  const startNewChat = async () => {
    try {
      console.log("🆕 Yeni sohbet başlatılıyor...");

      // Chat'i temizle
      clearChat();

      // HTTP modunda yeni sohbet = yeni thread
      setThreadId(null);

      console.log("✅ Yeni sohbet başlatıldı");
    } catch (error) {
      console.error("❌ Yeni sohbet başlatma hatası:", error);

      // Error'ı rethrow et ki üst seviyede yakalanabilsin
      throw error;
    }
  };

  return {
    messages,
    setMessages,
    inputText,
    setInputText,
    isTyping,
    setIsTyping,
    flatListRef,
    threadId,
    setThreadId,
    ensureThread,
    sendMessage,
    clearChat,
    startNewChat,
  };
};
