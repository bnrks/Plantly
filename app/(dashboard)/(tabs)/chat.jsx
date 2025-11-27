import React, { useContext, useState, useEffect } from "react";
import {
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import { useNavigation } from "@react-navigation/native";
import { useLocalSearchParams } from "expo-router";
import ThemedView from "../../../components/ThemedView";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import Header from "../../../components/Header";
import ThemedCard from "../../../components/ThemedCard";
import PlantCard from "../../../components/PlantCard";
import CustomAlert from "../../../components/CustomAlert";
import ShowError from "../../../components/ShowError";
import ErrorBoundary from "../../../src/components/ErrorBoundary";
import { ChatErrorFallback } from "../../../src/components/ErrorFallbacks";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../../constants/Colors";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { AuthContext } from "../../../src/context/AuthContext";
import { formatChatError } from "../../../src/exceptions/chat_exceptions";
import { useCustomAlert } from "../../../src/hooks/ui/useCustomAlert";
import { useWebSocketConnection } from "../../../src/hooks/chat/useWebSocketConnection";
import { useChat } from "../../../src/hooks/chat/useChat";
import { useImageHandling } from "../../../src/hooks/media/useImageHandling";
import { useChatHistory } from "../../../src/hooks/chat/useChatHistory";
import { usePlantSelection } from "../../../src/hooks/chat/usePlantSelection";
import { useKeyboardVisibility } from "../../../src/hooks/ui/useKeyboardVisibility";
import { chatStyles as styles } from "../../../css/chatStyles";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ChatScreen() {
  const [inputPad, setInputPad] = useState(140);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const { user } = useContext(AuthContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const { alertConfig, showConfirm, hideAlert } = useCustomAlert();
  const navigation = useNavigation();

  // WebSocket error state
  const [wsError, setWsError] = useState(null);
  const [showConnectionError, setShowConnectionError] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  // Debug için state değişikliklerini takip et
  useEffect(() => {
    console.log(
      "📊 State Change - showConnectionError:",
      showConnectionError,
      "wsError:",
      wsError ? "exists" : "null",
      "connectionStatus:",
      connectionStatus
    );
  }, [showConnectionError, wsError, connectionStatus]);

  // Analysis parametrelerini al
  const { analysisImage, plantId, analysisMode } = useLocalSearchParams();

  // Klavye durumunu takip et ve tab bar'ı yönet
  const { isKeyboardVisible } = useKeyboardVisibility();

  // Custom hooks
  const {
    connectionStatus,
    statusMessage,
    reconnectWebSocket,
    getStatusColor,
    getStatusIcon,
    getDisplayMessage,
  } = useWebSocketConnection();

  const {
    messages,
    setMessages,
    inputText,
    setInputText,
    isTyping,
    setIsTyping,
    flatListRef,
    sendMessage,
    startNewChat: startNewChatFromHook,
  } = useChat(connectionStatus);

  const {
    selectedImage,
    setSelectedImage,
    isAnalyzing,
    pickImage,
    takePhoto,
    analyzeImage,
    removeSelectedImage,
  } = useImageHandling(
    connectionStatus,
    setMessages,
    setInputText,
    flatListRef
  );

  const {
    showHistoryModal,
    chatHistory,
    isLoadingHistory,
    loadChatHistory,
    loadPreviousChat,
    closeHistoryModal,
    deleteChatThread,
  } = useChatHistory(
    setMessages,
    setInputText,
    setSelectedImage,
    setIsTyping,
    flatListRef,
    showConfirm,
    hideAlert
  );

  const {
    showPlantSelectionModal,
    userPlants,
    isLoadingPlants,
    selectedNotes,
    handleSaveNotes,
    saveNotesToPlant,
    closePlantSelectionModal,
    loadUserPlants,
  } = usePlantSelection(showConfirm, hideAlert);

  // Analysis modunda gelen fotoğrafı otomatik işle
  useEffect(() => {
    if (analysisMode === "true" && analysisImage && plantId) {
      // Fotoğrafı set et
      setSelectedImage(analysisImage);
      // Otomatik gönder (input boş kalacak, sadece fotoğraf gönderilecek)
      setTimeout(() => {
        sendMessage();
      }, 500);
    }
  }, [analysisMode, analysisImage, plantId]);

  // WebSocket bağlantı durumunu izle ve error handling
  useEffect(() => {
    console.log(
      "🔍 Connection Status Changed:",
      connectionStatus,
      "Message:",
      statusMessage
    );

    if (connectionStatus === "disconnected" || connectionStatus === "error") {
      // Bağlantı koptuğunda mesajları temizle (yeni thread başlayacak)
      setMessages(() => []);
      setInputText("");
      setSelectedImage(null);
      setIsTyping(false);

      // Error durumunda hata göster
      if (connectionStatus === "error") {
        console.log("🚨 WebSocket Error Detected:", statusMessage);
        // statusMessage WebSocket hatasını içeriyor
        const errorData = formatChatError(new Error(statusMessage));
        console.log("🔧 Formatted Error Data:", errorData);
        setWsError(errorData);
        setShowConnectionError(true);
        console.log("🎯 ShowConnectionError set to true, wsError:", errorData);
      }
    } else if (connectionStatus === "connected") {
      // Bağlantı kurulduğunda error'u temizle
      console.log("✅ Connection başarılı, error state temizleniyor...");
      console.log("🔧 Önceki wsError:", wsError);
      console.log("🔧 Önceki showConnectionError:", showConnectionError);

      setWsError(null);
      setShowConnectionError(false);

      console.log("🎯 Error state temizlendi");
    }
  }, [connectionStatus, statusMessage]);

  // Messages state değişikliklerini debug et (preview build sorunları için)
  useEffect(() => {
    console.log("🔧 Chat Messages Updated - Count:", messages.length);
    console.log(
      "🔧 Messages IDs:",
      messages.map((m) => m.id)
    );

    // Preview build'de FlatList'i force update et
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    }
  }, [messages]);

  // Yeni sohbet başlatma fonksiyonu
  const startNewChat = () => {
    showConfirm(
      t('chat.newChat'),
      t('chat.newChatConfirm'),
      async () => {
        try {
          await startNewChatFromHook();
          hideAlert();
          console.log("✅ Yeni sohbet başarıyla başlatıldı");
        } catch (error) {
          console.error("❌ Yeni sohbet başlatma hatası:", error);
          hideAlert();

          // Error'ı format et ve göster
          const errorData = formatChatError(
            error,
            "Yeni sohbet başlatma hatası"
          );
          setWsError(errorData);
          setShowConnectionError(true);

          // CustomAlert ile de göster
          showConfirm(
            t('chat.chatError'),
            t('chat.newChatError'),
            () => hideAlert(),
            () => hideAlert(),
            t('common.done'),
            null
          );
        }
      },
      () => {
        hideAlert();
      }
    );
  };

  // WebSocket hata handler fonksiyonları
  const handleRetryConnection = async () => {
    try {
      console.log("🔄 Retry connection başlatılıyor...");
      setWsError(null);
      setShowConnectionError(false);

      // Reconnect işlemini await et
      await reconnectWebSocket();

      console.log("✅ Retry connection başarılı");

      // Bağlantı başarılı olduktan sonra error state'ini kesin olarak temizle
      setWsError(null);
      setShowConnectionError(false);
      console.log("🎯 Retry sonrası error state kesin olarak temizlendi");
    } catch (error) {
      console.error("❌ Retry connection hatası:", error);

      // Error'ı format et ve göster
      const errorData = formatChatError(error, "Yeniden bağlantı hatası");
      setWsError(errorData);
      setShowConnectionError(true);

      // CustomAlert ile de göster
      showConfirm(
        t('chat.connectionError'),
        t('chat.newChatError'),
        () => {
          hideAlert();
          // Tekrar denemek isterse
          handleRetryConnection();
        },
        () => {
          hideAlert();
        },
        t('chat.reconnect'),
        t('common.cancel')
      );
    }
  };

  const handleCloseConnectionError = () => {
    setWsError(null);
    setShowConnectionError(false);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === "user" || item.sender === "user";
    const isNotes = item.role === "assistant_notes";

    // Notes mesajı için özel rendering
    if (isNotes) {
      return (
        <View
          style={[styles.messageContainer, styles.assistantMessageContainer]}
        >
          <Image
            source={require("../../../assets/plantly-asistant.png")}
            style={styles.assistantAvatar}
          />
          <View style={[styles.messageBubble, styles.notesBubble]}>
            <View style={styles.notesHeader}>
              <Ionicons name="bulb" size={18} color="#FF9800" />
              <ThemedText style={styles.notesTitle}>{t('plants.careRecommendations')}</ThemedText>
            </View>
            {Array.isArray(item.content) &&
              item.content.map((note, index) => (
                <ThemedText key={index} style={styles.noteText}>
                  • {note}
                </ThemedText>
              ))}
            {item.hasActionButton && (
              <TouchableOpacity
                style={styles.saveNotesButton}
                onPress={() => handleSaveNotes(item.content)}
              >
                <Ionicons name="bookmark" size={16} color="#fff" />
                <ThemedText style={styles.saveNotesButtonText}>
                  {t('chat.saveNotes')}
                </ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

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

          {/* Analiz sonucu teşhis bilgisi varsa göster */}
          {item.type === "analysis" && item.disease && (
            <View style={styles.diagnosisContainer}>
              <View style={styles.diagnosisHeader}>
                <Ionicons name="medical" size={16} color="#4CAF50" />
                <ThemedText style={styles.diagnosisTitle}>
                  Teşhis Sonucu
                </ThemedText>
              </View>
              <ThemedText style={styles.diagnosisText}>
                {String(item.disease).replace(/_/g, " ")}
                {item.confidence
                  ? ` (%${Math.round(item.confidence * 100)} güven)`
                  : ""}
              </ThemedText>
            </View>
          )}

          {/* Analiz önerileri varsa göster */}
          {item.type === "analysis" && item.suggestions && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Ionicons name="bulb" size={16} color="#FF9800" />
                <ThemedText style={styles.suggestionsTitle}>
                  {t('plants.careRecommendations')}
                </ThemedText>
              </View>
              {item.suggestions.map((suggestion, index) => (
                <ThemedText key={index} style={styles.suggestionText}>
                  • {suggestion}
                </ThemedText>
              ))}
            </View>
          )}

          {/* Normal teşhis bilgisi (eski format için uyumluluk) */}
          {item.diagnosis && !item.type && (
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
            {item.text || item.content || ""}
          </ThemedText>

          <ThemedText
            style={[
              styles.messageTime,
              isUser ? styles.userMessageTime : styles.assistantMessageTime,
            ]}
          >
            {new Date(item.timestamp).toLocaleTimeString("tr-TR", {
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
    <ErrorBoundary
      fallback={ChatErrorFallback}
      level="component"
      name="Chat Screen"
      onError={(error, errorInfo) => {
        console.error("🚨 Chat Screen Error:", error);
        console.error("📍 Error Info:", errorInfo);
      }}
    >
      <ThemedView
        style={[styles.container, { paddingTop: insets.top + 16 }]}
        safe={false}
      >
        <Header />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          enabled
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
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
                  onPress={handleRetryConnection}
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
                    color={
                      messages.length === 0 ? theme.text + "50" : theme.text
                    }
                  />
                  <ThemedText
                    style={[
                      styles.halfButtonText,
                      messages.length === 0 && { opacity: 0.5 },
                    ]}
                  >
                    {t('chat.newChat')}
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
                    {isLoadingHistory ? t('common.loading') : t('chat.chatHistory')}
                  </ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Chat Alanı */}
          {connectionStatus === "connected" ? (
            <KeyboardAvoidingView
              style={{ flex: 1 }}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
              <ThemedView style={styles.chatContainer}>
                {/* Chat Content */}
                <View style={styles.chatContent}>
                  {/* WebSocket Bağlantı Hatası */}
                  {showConnectionError && wsError && (
                    <>
                      {console.log("🎨 Rendering ShowError component:", {
                        showConnectionError,
                        wsError: wsError ? "exists" : "null",
                        connectionStatus,
                      })}
                      <ShowError
                        title={wsError.title}
                        message={wsError.message}
                        icon={wsError.icon}
                        iconColor={wsError.color}
                        showRetry={wsError.retryable}
                        onRetry={handleRetryConnection}
                        showClose={true}
                        onClose={handleCloseConnectionError}
                        style={{ margin: 16 }}
                      />
                    </>
                  )}

                  {/* Chat Başlığı - Sadece mesaj yokken ve hata yokken göster */}
                  {messages.length === 0 && !showConnectionError && (
                    <View style={styles.chatHeader}>
                      <View style={styles.headerContent}></View>
                    </View>
                  )}

                  {/* Mesajlar Listesi */}
                  <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    style={styles.messagesList}
                    contentContainerStyle={[
                      styles.messagesContent,
                      messages.length === 0 && { flex: 1 },
                      { paddingBottom: inputPad + 16 },
                    ]}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode={
                      Platform.OS === "ios" ? "interactive" : "on-drag"
                    }
                    ListFooterComponent={renderTypingIndicator}
                    removeClippedSubviews={false}
                    extraData={messages.length} // Preview build için ekstra re-render trigger
                    maintainVisibleContentPosition={{
                      minIndexForVisible: 0,
                    }}
                    ListEmptyComponent={
                      <View style={styles.emptyChat}>
                        <View style={styles.headerIcon}>
                          <Ionicons name="leaf" size={24} color="#4CAF50" />
                        </View>
                        <ThemedTitle style={styles.title}>
                          🌱 {t('chat.title')}
                        </ThemedTitle>
                        <ThemedText style={styles.subtitle}>
                          {t('chat.subtitle')}
                        </ThemedText>
                        <Image
                          source={require("../../../assets/plantly-asistant.png")}
                          style={styles.welcomeAvatar}
                        />
                        <ThemedText style={styles.welcomeText}>
                          {t('chat.welcomeMessage')}
                        </ThemedText>
                        <ThemedText style={styles.welcomeSubtext}>
                          {t('chat.welcomeSubtext')}
                        </ThemedText>
                      </View>
                    }
                  />

                  {/* Seçili fotoğraf önizlemesi - Absolute positioned */}
                  {selectedImage && (
                    <View
                      style={[
                        styles.selectedImageContainer,
                        isKeyboardVisible && { bottom: 140, left: 40 }, // Klavye açıkken daha yukarı
                      ]}
                    >
                      <Image
                        source={{ uri: selectedImage.uri }}
                        style={styles.selectedImagePreview}
                      />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={removeSelectedImage}
                      >
                        <Ionicons
                          name="close-circle"
                          size={24}
                          color="#E53935"
                        />
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* Mesaj Input Alanı */}
                  <View
                    style={[
                      styles.inputContainer,
                      isKeyboardVisible && {
                        marginBottom: selectedImage ? 60 : 100,
                      },
                    ]}
                    onLayout={(e) => setInputPad(e.nativeEvent.layout.height)}
                  >
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
                        <Ionicons
                          name="image"
                          size={24}
                          color={theme.fourthBg}
                        />
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.imageButton}
                        onPress={takePhoto}
                      >
                        <Ionicons
                          name="camera"
                          size={24}
                          color={theme.fourthBg}
                        />
                      </TouchableOpacity>

                      <TextInput
                        style={[styles.textInput, { color: theme.fourthBg }]}
                        placeholder={t('chat.placeholder')}
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
                        onPress={
                          selectedImage
                            ? () => analyzeImage(inputText)
                            : sendMessage
                        }
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
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.waitingContainer}>
              <Image
                source={require("../../../assets/plantly-asistant.png")}
                style={styles.waitingAvatar}
              />
              <ThemedText style={styles.waitingText}>
                {t('chat.connecting')}
              </ThemedText>
              <ThemedText style={styles.waitingSubtext}>
                {t('chat.waitingSubtext')}
              </ThemedText>
            </View>
          )}

          {/* Geçmiş Sohbetler Modal */}
          <Modal
            visible={showHistoryModal}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={closeHistoryModal}
          >
            <ThemedView style={styles.modalContainer} safe={true}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <ThemedTitle style={styles.modalTitle}>
                  {t('chat.chatHistory')}
                </ThemedTitle>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={closeHistoryModal}
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
                    {t('chat.noHistory')}
                  </ThemedText>
                  <ThemedText style={styles.emptySubtext}>
                    {t('chat.startFirstChat')}
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
                        <ThemedText
                          style={styles.historyTitle}
                          numberOfLines={1}
                        >
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
                      <View style={styles.historyItemActions}>
                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={(e) => {
                            e.stopPropagation();
                            deleteChatThread(item.id, item.title);
                          }}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={20}
                            color="#FF6B6B"
                          />
                        </TouchableOpacity>
                        <View style={styles.historyItemRight}>
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color={theme.text + "70"}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )}
            </ThemedView>
          </Modal>

          {/* Plant Selection Modal */}
          <Modal
            visible={showPlantSelectionModal}
            animationType="fade"
            transparent={true}
          >
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                justifyContent: "center",
                alignItems: "center",
                paddingHorizontal: 20,
              }}
            >
              <ThemedView
                style={[
                  styles.modalContainer,
                  {
                    width: "90%",
                    maxWidth: 400,
                    height: "60%",
                    borderRadius: 25,
                    maxHeight: 500,
                    overflow: "hidden",
                    backgroundColor: theme.fourthBg,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.3,
                    shadowRadius: 20,
                    elevation: 10,
                  },
                ]}
              >
                {/* Modal Header - Güzelleştirilmiş */}
                <View
                  style={[
                    styles.modalHeader,
                    {
                      paddingVertical: 20,
                      paddingHorizontal: 20,
                      borderBottomWidth: 1,
                      borderBottomColor: theme.text + "10",
                    },
                  ]}
                >
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <View
                      style={{
                        backgroundColor: theme.thirdBg || "#34d399",
                        padding: 12,
                        borderRadius: 50,
                        marginBottom: 10,
                      }}
                    >
                      <Ionicons name="leaf" size={24} color="#FFFFFF" />
                    </View>
                    <ThemedTitle
                      style={[
                        styles.modalTitle,
                        {
                          fontSize: 22,
                          fontWeight: "700",
                          marginBottom: 0,
                        },
                      ]}
                    >
                      {t('chat.selectPlant')}
                    </ThemedTitle>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.closeButton,
                      {
                        position: "absolute",
                        top: 15,
                        right: 15,
                        backgroundColor: theme.text + "10",
                        borderRadius: 20,
                        padding: 8,
                      },
                    ]}
                    onPress={closePlantSelectionModal}
                  >
                    <Ionicons name="close" size={20} color={theme.text} />
                  </TouchableOpacity>
                </View>

                {isLoadingPlants ? (
                  <View
                    style={[
                      styles.loadingContainer,
                      {
                        backgroundColor: theme.fifthBg + "30",
                        borderRadius: 15,
                        margin: 20,
                        padding: 40,
                      },
                    ]}
                  >
                    <Ionicons
                      name="hourglass"
                      size={32}
                      color={theme.thirdBg || "#34d399"}
                    />
                    <ThemedText style={{ marginTop: 15, fontSize: 16 }}>
                      {t('common.loading')}
                    </ThemedText>
                  </View>
                ) : userPlants.length === 0 ? (
                  <View
                    style={[
                      styles.emptyContainer,
                      {
                        backgroundColor: theme.fifthBg + "30",
                        borderRadius: 15,
                        margin: 20,
                        padding: 40,
                      },
                    ]}
                  >
                    <View
                      style={{
                        backgroundColor: theme.text + "10",
                        padding: 20,
                        borderRadius: 50,
                        marginBottom: 20,
                      }}
                    >
                      <Ionicons
                        name="leaf-outline"
                        size={40}
                        color={theme.text + "70"}
                      />
                    </View>
                    <ThemedText
                      style={[
                        styles.emptyText,
                        { fontSize: 18, fontWeight: "600" },
                      ]}
                    >
                      {t('chat.noPlants')}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.emptySubtext,
                        { fontSize: 15, marginTop: 8 },
                      ]}
                    >
                      {t('chat.addPlantFirst')}
                    </ThemedText>
                  </View>
                ) : (
                  <View style={{ flex: 1, paddingTop: 10 }}>
                    <ThemedText
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        paddingHorizontal: 20,
                        paddingBottom: 15,
                        opacity: 0.8,
                      }}
                    >
                      🌱 {t('chat.yourPlants')} ({userPlants.length})
                    </ThemedText>
                    <FlatList
                      data={userPlants}
                      keyExtractor={(item) => item.id}
                      style={styles.plantsList}
                      contentContainerStyle={{
                        paddingHorizontal: 15,
                        paddingBottom: 30,
                      }}
                      showsVerticalScrollIndicator={false}
                      renderItem={({ item }) => (
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#fff",
                            borderRadius: 20,
                            marginHorizontal: 5,
                            marginVertical: 8,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 8,
                            elevation: 4,
                          }}
                        >
                          <View
                            style={{
                              flex: 1,
                              backgroundColor: theme.fourthBg,
                              flexDirection: "row",
                              alignItems: "center",
                              paddingRight: 12,
                              borderRadius: 16,
                              overflow: "hidden",
                            }}
                          >
                            <View style={{ flex: 1 }}>
                              <PlantCard
                                name={item.name}
                                description={item.description}
                                image={{ uri: item.imageUrl }}
                                onPress={() => saveNotesToPlant(item)}
                              />
                            </View>
                            <TouchableOpacity
                              onPress={() => saveNotesToPlant(item)}
                              style={{
                                backgroundColor: theme.thirdBg || "#34d399",
                                padding: 15,
                                borderRadius: 15,
                                marginLeft: 12,
                                alignItems: "center",
                                justifyContent: "center",
                                shadowColor: "#10b981",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 5,
                                elevation: 3,
                                minWidth: 50,
                              }}
                              activeOpacity={0.7}
                            >
                              <Ionicons
                                name="bookmark"
                                size={24}
                                color="#FFFFFF"
                              />
                              <ThemedText
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 11,
                                  fontWeight: "600",
                                  marginTop: 2,
                                }}
                              >
                                KAYDET
                              </ThemedText>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                    />
                  </View>
                )}
              </ThemedView>
            </View>
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
        </KeyboardAvoidingView>
      </ThemedView>
    </ErrorBoundary>
  );
}
