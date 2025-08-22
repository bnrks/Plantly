import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebaseConfig";

class ChatService {
  /**
   * Galeriden fotoğraf seçme
   */
  async pickImage() {
    try {
      // Galeriye erişim izni kontrol et
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Galeriye erişim izni gerekli!");
        return null;
      }

      // Fotoğraf seç
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error("❌ Galeri hatası:", error);
      Alert.alert("Hata", "Galeri açılırken bir hata oluştu");
      return null;
    }
  }

  /**
   * Kamerayla fotoğraf çekme
   */
  async takePhoto() {
    try {
      // Kamera izni kontrol et
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("İzin Gerekli", "Kamera erişim izni gerekli!");
        return null;
      }

      // Fotoğraf çek
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error("❌ Kamera hatası:", error);
      Alert.alert("Hata", "Kamera açılırken bir hata oluştu");
      return null;
    }
  }

  /**
   * Fotoğraf analizi yapma
   */
  async analyzeImage(selectedImage, inputText = "") {
    try {
      // Firebase ID Token al
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("Kullanıcı bulunamadı");
      }
      const idToken = await currentUser.getIdToken();

      // FormData hazırla
      const fd = new FormData();
      fd.append("file", {
        uri: selectedImage.uri,
        name: "leaf.jpg",
        type: "image/jpeg",
      });
      fd.append("auto_reply", "true");

      // Thread ID'yi wsService'ten al (eğer varsa)
      const wsService = require("./wsService").default;
      fd.append("thread_id", wsService.threadId || "");

      console.log("📤 Fotoğraf analizi başlatılıyor...");

      // API'ye gönder
      const response = await fetch(
        "https://learning-partially-rabbit.ngrok-free.app/chat/analyze-image",
        {
          method: "POST",
          headers: {
            idToken: idToken,
          },
          body: fd,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("📥 Analiz sonucu:", result);
      console.log(
        "🔍 Diagnosis objesi:",
        JSON.stringify(result.diagnosis, null, 2)
      );

      return result;
    } catch (error) {
      console.error("❌ Fotoğraf analiz hatası:", error);
      throw error;
    }
  }

  /**
   * Kullanıcı mesajı oluşturma
   */
  createUserMessage(content, imageUri = null) {
    return {
      id: Date.now().toString(),
      role: "user",
      content: content.trim() || "🌿 Bitki analizi yapılıyor...",
      image: imageUri,
      timestamp: new Date(),
    };
  }

  /**
   * WebSocket mesajını işleme
   */
  processWebSocketMessage(data) {
    console.log("🔧 processWebSocketMessage çağrıldı, data:", data);
    console.log("🔧 data.assistant:", data.assistant);
    console.log("🔧 data.assistant?.content:", data.assistant?.content);

    // Yeni format: { assistant: {...}, diagnosis: {...}, message_id, thread_id }
    if (data.assistant && data.assistant.content) {
      const newMessage = {
        id:
          data.message_id || data.assistant.message_id || Date.now().toString(),
        role: "assistant",
        content: data.assistant.content,
        timestamp: new Date(),
      };

      // Eğer diagnosis bilgisi varsa ekle
      if (data.diagnosis) {
        newMessage.diagnosis = data.diagnosis;
      }

      console.log("✅ İşlenmiş mesaj:", newMessage);
      return newMessage;
    }

    // Eski format: { type: "message", message: {...} }
    if (data.type === "message" && data.message) {
      // SystemEvent mesajlarını filtreleme (diagnosis objeleri)
      if (data.message.role === "systemEvent") {
        console.log("⚙️ SystemEvent mesajı atlandı:", data.message);
        return null;
      }

      // İlk olarak ana mesajı oluştur
      const mainMessage = {
        id: data.message.id || Date.now().toString(),
        role: data.message.role,
        content:
          typeof data.message.content === "string"
            ? data.message.content
            : JSON.stringify(data.message.content),
        timestamp: new Date(),
      };

      // Eğer notes varsa, bunları ayrı bir array olarak döndür
      if (data.message.notes && Array.isArray(data.message.notes)) {
        const notesMessage = {
          id: `${mainMessage.id}_notes`,
          role: "assistant_notes",
          content: data.message.notes,
          timestamp: new Date(),
          hasActionButton: true,
        };

        // İki mesajı array olarak döndür
        return [mainMessage, notesMessage];
      }

      // Eğer bu bir fotoğraf analizi cevabıysa, diagnosis bilgisini de ekle
      if (data.diagnosis) {
        mainMessage.diagnosis = data.diagnosis;
      }

      return mainMessage;
    }

    // Thread ready mesajları için
    if (data.type === "thread_ready") {
      console.log("🎯 Thread hazır mesajı işlendi");
      return null;
    }

    console.log("⚠️ İşlenemeyen mesaj formatı:", data);
    return null;
  }

  /**
   * Kullanıcının geçmiş sohbetlerini getir
   */
  async getChatHistory() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Kullanıcı oturum açmamış");
      }

      console.log("📚 Geçmiş sohbetler getiriliyor...");

      // users/{userId}/threads koleksiyonunu sorgula
      const threadsRef = collection(db, "users", user.uid, "threads");
      const q = query(threadsRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const threads = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        threads.push({
          id: doc.id,
          title: data.title || "Başlıksız Sohbet",
          createdAt: data.createdAt?.toDate() || new Date(),
          lastMessage: data.lastMessage || "",
          messageCount: data.messageCount || 0,
        });
      });

      console.log(`📚 ${threads.length} adet geçmiş sohbet bulundu`);
      return threads;
    } catch (error) {
      console.error("❌ Geçmiş sohbetler getirme hatası:", error);
      throw error;
    }
  }

  /**
   * Belirli bir thread'in mesajlarını getir
   */
  async getChatMessages(threadId) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        throw new Error("Kullanıcı oturum açmamış");
      }

      console.log(`💬 Thread ${threadId} mesajları getiriliyor...`);
      console.log(
        `🔍 Aranacak yol: users/${user.uid}/threads/${threadId}/messages`
      );

      // users/{userId}/threads/{threadId}/messages koleksiyonunu sorgula
      const messagesRef = collection(
        db,
        "users",
        user.uid,
        "threads",
        threadId,
        "messages"
      );
      console.log(`📍 Messages ref oluşturuldu`);

      // createdAt'e göre sırala
      const q = query(messagesRef, orderBy("createdAt", "asc"));
      const querySnapshot = await getDocs(q);
      console.log(`📍 Query çalıştırıldı, doc sayısı: ${querySnapshot.size}`);

      const messages = [];
      querySnapshot.forEach((doc) => {
        console.log(`📄 Doc ID: ${doc.id}, Data:`, doc.data());
        const data = doc.data();
        messages.push({
          id: doc.id,
          role: data.role,
          content: data.content,
          timestamp: data.createdAt?.toDate() || new Date(),
          diagnosis: data.diagnosis || null,
        });
      });

      console.log(`💬 ${messages.length} adet mesaj getirildi`);
      return messages;
    } catch (error) {
      console.error("❌ Thread mesajları getirme hatası:", error);
      throw error;
    }
  }
}

export default new ChatService();
