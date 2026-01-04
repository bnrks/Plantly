import { useState, useContext } from "react";
import chatService from "../../services/chatService";
import { deleteThread } from "../../services/firestoreService";
import { AuthContext } from "../../context/AuthContext";

export const useChatHistory = (
  setMessages,
  setInputText,
  setSelectedImage,
  setIsTyping,
  flatListRef,
  showConfirm,
  hideAlert,
  setThreadId
) => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const { user } = useContext(AuthContext);

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

      // Chat'i temizle
      setMessages([]);
      setInputText("");
      setSelectedImage(null);
      setIsTyping(false);

      // Aktif thread'i seç
      if (typeof setThreadId === "function") {
        setThreadId(threadId);
      }

      // Geçmiş mesajları getir
      const previousMessages = await chatService.getChatMessages(threadId);
      console.log("📥 Geçmiş mesajlar yüklendi:", previousMessages.length);

      // Mesajları ekle
      setMessages(previousMessages);

      // Mesaj listesini sona kaydır
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 1000);
    } catch (error) {
      console.error("❌ Geçmiş sohbet yüklenirken hata:", error);
    }
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
  };

  // Thread silme fonksiyonu
  const deleteChatThread = async (threadId, threadTitle) => {
    if (!user) return;

    showConfirm(
      "Sohbeti Sil",
      `"${threadTitle}" adlı sohbeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`,
      async () => {
        try {
          await deleteThread(user.uid, threadId);
          // Chat listesini güncelle
          setChatHistory((prevHistory) =>
            prevHistory.filter((chat) => chat.id !== threadId)
          );
        } catch (error) {
          showConfirm(
            "Hata",
            "Sohbet silinirken bir hata oluştu.",
            () => {
              hideAlert();
            },
            () => {
              hideAlert();
            }
          );
          console.error("Thread silme hatası:", error);
        }
      },
      () => {
        // İptal butonuna basıldığında alert'i kapat
        hideAlert();
      }
    );
  };

  return {
    showHistoryModal,
    setShowHistoryModal,
    chatHistory,
    setChatHistory,
    isLoadingHistory,
    loadChatHistory,
    loadPreviousChat,
    closeHistoryModal,
    deleteChatThread,
  };
};
