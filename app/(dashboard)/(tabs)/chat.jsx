import React, { useState, useEffect, useContext, useRef } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Keyboard,
  Modal,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { getAuth } from "firebase/auth";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import Header from "../../../components/Header";
import ThemedCard from "../../../components/ThemedCard";
import CustomAlert from "../../../components/CustomAlert";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { AuthContext } from "../../../src/context/AuthContext";
import { useCustomAlert } from "../../../src/hooks/useCustomAlert";
import wsService from "../../../src/services/wsService";
import chatService from "../../../src/services/chatService";

export default function ChatScreen() {
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const [statusMessage, setStatusMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const flatListRef = useRef(null);
  const { alertConfig, showConfirm, hideAlert } = useCustomAlert();
  const navigation = useNavigation();

  useEffect(() => {
    // Bağlantı durumu dinleyicisi ekle
    const handleConnectionChange = (status, message) => {
      setConnectionStatus(status);
      setStatusMessage(message);
    };

    // Mesaj dinleyicisi ekle
    const handleMessage = (data) => {
      console.log("📥 Alınan mesaj:", data);

      const newMessage = chatService.processWebSocketMessage(data);
      if (!newMessage) return;

      setMessages((prev) => {
        // Aynı ID'li mesaj zaten var mı kontrol et
        const existingMessage = prev.find((msg) => msg.id === newMessage.id);
        if (existingMessage) {
          console.log("⚠️ Aynı ID'li mesaj zaten mevcut:", newMessage.id);
          return prev;
        }
        return [...prev, newMessage];
      });

      setIsTyping(false);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    wsService.addConnectionListener(handleConnectionChange);
    wsService.addMessageListener(handleMessage);

    // Kullanıcı varsa WebSocket bağlantısını kur (thread olmadan)
    if (user) {
      wsService.connect();
    }

    // Cleanup
    return () => {
      wsService.removeConnectionListener(handleConnectionChange);
      wsService.removeMessageListener(handleMessage);
    };
  }, [user]);

  // Klavye dinleyicileri
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      "keyboardDidShow",
      (event) => {
        setKeyboardHeight(event.endCoordinates.height);
        // Tab bar'ı gizle
        navigation.getParent()?.setOptions({
          tabBarStyle: { display: "none" },
        });
      }
    );

    const keyboardDidHideListener = Keyboard.addListener(
      "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
        // Tab bar'ı göster
        navigation.getParent()?.setOptions({
          tabBarStyle: {
            display: "flex",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 60,
            backgroundColor: "#FFFFFF",
            borderTopWidth: 1,
            borderTopColor: "rgba(0,0,0,0.1)",
          },
        });
      }
    );

    return () => {
      keyboardDidShowListener?.remove();
      keyboardDidHideListener?.remove();
    };
  }, [navigation]);

  // WebSocket yeniden bağlanma fonksiyonu
  const reconnectWebSocket = () => {
    if (user) {
      wsService.disconnect();
      setTimeout(() => {
        wsService.connect();
      }, 1000);
    }
  };

  // Yeni sohbet başlatma fonksiyonu
  const startNewChat = () => {
    showConfirm(
      "Yeni Sohbet",
      "Yeni bir sohbet başlatmak istediğinize emin misiniz? Mevcut konuşma geçmişi kaybolacak.",
      () => {
        // Chat'i temizle
        setMessages([]);
        setInputText("");
        setSelectedImage(null);
        setIsTyping(false);

        // WebSocket'i yeniden başlat ve yeni thread oluştur
        wsService.disconnect();
        setTimeout(() => {
          wsService.connect();
        }, 500);

        hideAlert();
      },
      () => {
        hideAlert();
      }
    );
  };

  // Geçmiş sohbetleri getir
  const loadChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const history = await chatService.getChatHistory();
      setChatHistory(history);
      setShowHistoryModal(true);
    } catch (error) {
      console.error("❌ Geçmiş sohbetler yüklenirken hata:", error);
      // Hata mesajı göster (isteğe bağlı)
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Geçmiş sohbeti yükle
  const loadPreviousChat = async (threadId) => {
    try {
      console.log("🔄 Geçmiş sohbet yükleniyor:", threadId);

      // Modal'ı kapat
      setShowHistoryModal(false);

      // Mevcut bağlantıyı kes
      wsService.disconnect();

      // Chat'i temizle
      setMessages([]);
      setInputText("");
      setSelectedImage(null);
      setIsTyping(false);

      // Geçmiş mesajları getir
      const previousMessages = await chatService.getChatMessages(threadId);
      console.log("📥 Geçmiş mesajlar yüklendi:", previousMessages.length);

      // Mesajları ekle
      setMessages(previousMessages);

      // Thread ID ile WebSocket bağlantısı kur
      setTimeout(() => {
        wsService.connect(threadId);
      }, 500);

      // Mesaj listesini sona kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 1000);
    } catch (error) {
      console.error("❌ Geçmiş sohbet yüklenirken hata:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || connectionStatus !== "connected") return;

    // Eğer henüz thread yoksa, thread oluştur
    if (!wsService.threadId) {
      console.log("🧵 İlk mesaj: Thread oluşturuluyor...");
      await wsService.initializeThread();
    }

    // Kullanıcı mesajını ekle
    const userMessage = {
      id: Date.now().toString(),
      role: "user",
      content: inputText.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsTyping(true);

    // WebSocket'e gönder
    wsService.sendUserMessage(inputText.trim());

    // Input'u temizle
    setInputText("");

    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const pickImage = async () => {
    const result = await chatService.pickImage();
    if (result) {
      setSelectedImage(result);
    }
  };

  const takePhoto = async () => {
    const result = await chatService.takePhoto();
    if (result) {
      setSelectedImage(result);
    }
  };

  const analyzeImage = async () => {
    if (!selectedImage || connectionStatus !== "connected") return;

    try {
      setIsAnalyzing(true);

      // Eğer henüz thread yoksa, thread oluştur
      if (!wsService.threadId) {
        console.log("🧵 Fotoğraf analizi için thread oluşturuluyor...");
        await wsService.initializeThread();
      }

      // Kullanıcı mesajını ekle (fotoğraf ve metin)
      const userMessage = chatService.createUserMessage(
        inputText,
        selectedImage.uri
      );
      setMessages((prev) => [...prev, userMessage]);

      // Fotoğraf analizi yap
      await chatService.analyzeImage(selectedImage, inputText);

      // Input ve seçili fotoğrafı temizle
      setInputText("");
      setSelectedImage(null);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert("Hata", "Fotoğraf analizi yapılırken bir hata oluştu");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case "connecting":
        return "#FFA500"; // Orange
      case "connected":
        return "#4CAF50"; // Green
      case "error":
        return "#F44336"; // Red
      default:
        return "#9E9E9E"; // Gray
    }
  };

  const getStatusIcon = () => {
    switch (connectionStatus) {
      case "connecting":
        return "sync";
      case "connected":
        return "checkmark-circle";
      case "error":
        return "close-circle";
      default:
        return "ellipse";
    }
  };

  const getDisplayMessage = () => {
    switch (connectionStatus) {
      case "connecting":
        return "Bağlantı kuruluyor...";
      case "connected":
        return "Bağlantı kuruldu";
      case "error":
        return "Bağlantı hatası";
      default:
        return "Bağlantı bekleniyor...";
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user";

    return (
      <View
        style={[
          styles.messageContainer,
          isUser
            ? styles.userMessageContainer
            : styles.assistantMessageContainer,
        ]}
      >
        {!isUser && (
          <Image
            source={require("../../../assets/plantly-asistant.png")}
            style={styles.assistantAvatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isUser ? styles.userBubble : styles.assistantBubble,
          ]}
        >
          {/* Fotoğraf varsa göster */}
          {item.image && (
            <Image
              source={{ uri: item.image }}
              style={styles.messageImage}
              resizeMode="cover"
            />
          )}

          {/* Teşhis bilgisi varsa göster */}
          {item.diagnosis && (
            <View style={styles.diagnosisContainer}>
              <View style={styles.diagnosisHeader}>
                <Ionicons name="medical" size={16} color="#4CAF50" />
                <ThemedText style={styles.diagnosisTitle}>
                  Teşhis Sonucu
                </ThemedText>
              </View>
              <ThemedText style={styles.diagnosisText}>
                {item.diagnosis.class
                  ? String(item.diagnosis.class).replace(/_/g, " ")
                  : "Teşhis yapılıyor..."}
                {item.diagnosis.confidence
                  ? ` (${Math.round(item.diagnosis.confidence * 100)}%)`
                  : ""}
              </ThemedText>
            </View>
          )}

          <ThemedText
            style={[
              styles.messageText,
              isUser ? styles.userMessageText : styles.assistantMessageText,
            ]}
          >
            {typeof item.content === "string"
              ? item.content
              : JSON.stringify(item.content)}
          </ThemedText>
          <ThemedText
            style={[
              styles.messageTime,
              isUser ? styles.userMessageTime : styles.assistantMessageTime,
            ]}
          >
            {item.timestamp.toLocaleTimeString("tr-TR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </ThemedText>
        </View>

        {isUser && (
          <View style={styles.userAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={[styles.messageContainer, styles.assistantMessageContainer]}>
        <Image
          source={require("../../../assets/plantly-asistant.png")}
          style={styles.assistantAvatar}
        />
        <View
          style={[
            styles.messageBubble,
            styles.assistantBubble,
            styles.typingBubble,
          ]}
        >
          <View style={styles.typingIndicator}>
            <View style={[styles.dot, { animationDelay: "0ms" }]} />
            <View style={[styles.dot, { animationDelay: "150ms" }]} />
            <View style={[styles.dot, { animationDelay: "300ms" }]} />
          </View>
        </View>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container} safe={true}>
      <Header />

      {/* Bağlantı Durumu */}
      <View style={styles.statusContainer}>
        <ThemedCard
          style={[styles.statusCard, { borderLeftColor: getStatusColor() }]}
        >
          <View style={styles.statusRow}>
            <Ionicons
              name={getStatusIcon()}
              size={20}
              color={getStatusColor()}
            />
            <ThemedText
              style={[styles.statusText, { color: getStatusColor() }]}
            >
              {getDisplayMessage()}
            </ThemedText>

            {/* Yeniden Bağlan Butonu */}
            <TouchableOpacity
              style={styles.reconnectButton}
              onPress={reconnectWebSocket}
            >
              <Ionicons name="refresh" size={18} color={theme.text} />
            </TouchableOpacity>
          </View>
        </ThemedCard>

        {/* Yeni Sohbet ve Geçmiş Sohbetler Butonları */}
        {connectionStatus === "connected" && (
          <View style={styles.buttonRow}>
            {/* Yeni Sohbet Butonu - Sadece mesaj varken aktif */}
            <TouchableOpacity
              style={[
                styles.halfButton,
                { backgroundColor: theme.fourthBg },
                messages.length === 0 && styles.disabledButton,
              ]}
              onPress={startNewChat}
              disabled={messages.length === 0}
            >
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={messages.length === 0 ? theme.text + "50" : theme.text}
              />
              <ThemedText
                style={[
                  styles.halfButtonText,
                  messages.length === 0 && { opacity: 0.5 },
                ]}
              >
                Yeni Sohbet
              </ThemedText>
            </TouchableOpacity>

            {/* Geçmiş Sohbetler Butonu */}
            <TouchableOpacity
              style={[
                styles.halfButton,
                styles.historyButton,
                { backgroundColor: theme.fourthBg },
              ]}
              onPress={loadChatHistory}
              disabled={isLoadingHistory}
            >
              <Ionicons
                name={isLoadingHistory ? "refresh" : "time-outline"}
                size={20}
                color={theme.text}
              />
              <ThemedText style={styles.halfButtonText}>
                {isLoadingHistory ? "Yükleniyor..." : "Geçmiş Sohbetler"}
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Chat Alanı */}
      {connectionStatus === "connected" ? (
        <ThemedView style={styles.chatContainer} safe={true}>
          {/* Chat Content */}
          <View style={styles.chatContent}>
            {/* Chat Başlığı - Sadece mesaj yokken göster */}
            {messages.length === 0 && (
              <View style={styles.chatHeader}>
                <View style={styles.headerContent}>
                  <View style={styles.headerIcon}>
                    <Ionicons name="leaf" size={24} color="#4CAF50" />
                  </View>
                  <ThemedTitle style={styles.title}>
                    🌱 Plantly AI Asistan
                  </ThemedTitle>
                  <ThemedText style={styles.subtitle}>
                    Bitkilerinizin uzmanı yanınızda! Hastalık teşhisi, bakım
                    önerileri ve daha fazlası için fotoğraf çekin veya soru
                    sorun.
                  </ThemedText>
                </View>
              </View>
            )}

            {/* Mesajlar Listesi */}
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              renderItem={renderMessage}
              style={[
                styles.messagesList,
                {
                  marginBottom: keyboardHeight > 0 ? keyboardHeight + 90 : 150,
                },
              ]}
              contentContainerStyle={[
                styles.messagesContent,
                messages.length === 0 && { flex: 1 },
              ]}
              showsVerticalScrollIndicator={false}
              ListFooterComponent={renderTypingIndicator}
              removeClippedSubviews={false}
              maintainVisibleContentPosition={{
                minIndexForVisible: 0,
              }}
              ListEmptyComponent={
                <View style={styles.emptyChat}>
                  <Image
                    source={require("../../../assets/plantly-asistant.png")}
                    style={styles.welcomeAvatar}
                  />
                  <ThemedText style={styles.welcomeText}>
                    Merhaba! Ben Plantly asistanınızım. 🌱
                  </ThemedText>
                  <ThemedText style={styles.welcomeSubtext}>
                    Bitkileriniz hakkında sorularınızı sorabilirsiniz.
                  </ThemedText>
                </View>
              }
            />

            {/* Mesaj Input Alanı */}
            <View
              style={[
                styles.inputContainer,
                {
                  position: "absolute",
                  bottom: keyboardHeight > 0 ? keyboardHeight - 275 : 80,
                  left: 16,
                  right: 16,
                },
              ]}
            >
              {/* Seçili fotoğraf önizlemesi */}
              {selectedImage && (
                <View style={styles.selectedImageContainer}>
                  <Image
                    source={{ uri: selectedImage.uri }}
                    style={styles.selectedImagePreview}
                  />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Ionicons name="close-circle" size={24} color="#E53935" />
                  </TouchableOpacity>
                </View>
              )}

              <View
                style={[
                  styles.inputWrapper,
                  { backgroundColor: theme.fifthBg },
                ]}
              >
                {/* Fotoğraf seçme butonları */}
                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={24} color={theme.fourthBg} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.imageButton}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={24} color={theme.fourthBg} />
                </TouchableOpacity>

                <TextInput
                  style={[styles.textInput, { color: theme.fourthBg }]}
                  placeholder="Mesajınızı yazın..."
                  placeholderTextColor={theme.fourthBg + "80"}
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                  maxLength={500}
                />

                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: theme.fourthBg },
                  ]}
                  onPress={selectedImage ? analyzeImage : sendMessage}
                  disabled={
                    (!inputText.trim() && !selectedImage) || isAnalyzing
                  }
                >
                  {isAnalyzing ? (
                    <Ionicons name="hourglass" size={20} color="#fff" />
                  ) : selectedImage ? (
                    <Ionicons name="search" size={20} color="#fff" />
                  ) : (
                    <Ionicons name="send" size={20} color="#fff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ThemedView>
      ) : (
        <View style={styles.waitingContainer}>
          <Image
            source={require("../../../assets/plantly-asistant.png")}
            style={styles.waitingAvatar}
          />
          <ThemedText style={styles.waitingText}>
            Asistan bağlantısı kuruluyor...
          </ThemedText>
          <ThemedText style={styles.waitingSubtext}>
            Lütfen bekleyin, size yardım etmek için hazırlanıyorum.
          </ThemedText>
        </View>
      )}

      {/* Geçmiş Sohbetler Modal */}
      <Modal
        visible={showHistoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowHistoryModal(false)}
      >
        <ThemedView style={styles.modalContainer} safe={true}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <ThemedTitle style={styles.modalTitle}>
              Geçmiş Sohbetler
            </ThemedTitle>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHistoryModal(false)}
            >
              <Ionicons name="close" size={24} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* Sohbet Listesi */}
          {chatHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons
                name="chatbubbles-outline"
                size={60}
                color={theme.text + "50"}
              />
              <ThemedText style={styles.emptyText}>
                Henüz geçmiş sohbet bulunmuyor
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                İlk sohbetinizi başlatın!
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={chatHistory}
              keyExtractor={(item) => item.id}
              style={styles.historyList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.historyItem,
                    { backgroundColor: theme.fourthBg },
                  ]}
                  onPress={() => {
                    loadPreviousChat(item.id);
                  }}
                >
                  <View style={styles.historyItemContent}>
                    <ThemedText style={styles.historyTitle} numberOfLines={1}>
                      {item.title}
                    </ThemedText>
                    <ThemedText style={styles.historyDate}>
                      {item.createdAt.toLocaleDateString("tr-TR")}
                    </ThemedText>
                    {item.lastMessage && (
                      <ThemedText
                        style={styles.historyLastMessage}
                        numberOfLines={1}
                      >
                        {item.lastMessage}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.historyItemRight}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.text + "70"}
                    />
                  </View>
                </TouchableOpacity>
              )}
            />
          )}
        </ThemedView>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        showCancel={alertConfig.showCancel}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  statusCard: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  reconnectButton: {
    marginLeft: "auto",
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  statusText: {
    fontSize: 14,
    fontWeight: "600",
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatHeader: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 10,
  },
  headerContent: {
    alignItems: "center",
    maxWidth: "85%",
  },
  headerIcon: {
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    marginBottom: 8,
    textAlign: "center",
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    textAlign: "center",
    opacity: 0.8,
    lineHeight: 22,
    paddingHorizontal: 5,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeAvatar: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  messageContainer: {
    flexDirection: "row",
    marginVertical: 4,
    paddingHorizontal: 8,
  },
  userMessageContainer: {
    justifyContent: "flex-end",
  },
  assistantMessageContainer: {
    justifyContent: "flex-start",
  },
  assistantAvatar: {
    width: 32,
    height: 32,
    marginRight: 8,
    marginTop: 4,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#A0C878",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    marginTop: 4,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 2,
  },
  userBubble: {
    backgroundColor: "#A0C878",
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: "#F0F0F0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userMessageText: {
    color: "#fff",
  },
  assistantMessageText: {
    color: "#333",
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  userMessageTime: {
    color: "rgba(255,255,255,0.7)",
    textAlign: "right",
  },
  assistantMessageTime: {
    color: "rgba(0,0,0,0.5)",
  },
  typingBubble: {
    paddingVertical: 16,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#999",
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedImageContainer: {
    marginBottom: 8,
    position: "relative",
  },
  selectedImagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    marginHorizontal: 16,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 12,
  },
  imageButton: {
    padding: 8,
    marginRight: 4,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  diagnosisContainer: {
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4CAF50",
  },
  diagnosisHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  diagnosisTitle: {
    fontWeight: "600",
    marginLeft: 6,
    fontSize: 14,
    color: "#4CAF50",
  },
  diagnosisText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  waitingAvatar: {
    width: 100,
    height: 100,
    marginBottom: 24,
    opacity: 0.6,
  },
  waitingText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  waitingSubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
  newChatButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  newChatButtonText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 6,
  },
  buttonRow: {
    flexDirection: "row",
    marginTop: 8,
    gap: 8,
  },
  halfButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  halfButtonText: {
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  historyButton: {
    // Özel stil eklenebilir
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  historyList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  historyItem: {
    flexDirection: "row",
    padding: 16,
    marginVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  historyItemContent: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 4,
  },
  historyLastMessage: {
    fontSize: 14,
    opacity: 0.8,
  },
  historyItemRight: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: "center",
    opacity: 0.7,
  },
});
