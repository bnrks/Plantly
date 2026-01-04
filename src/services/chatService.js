import * as ImagePicker from "expo-image-picker";
import { getAuth } from "firebase/auth";
import { Alert } from "react-native";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "./firebaseConfig";

class ChatService {
  async getIdToken() {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("Kullanıcı bulunamadı");
    }
    return currentUser.getIdToken();
  }

  async resolveApiUrl() {
    // settings/api_settings api_url
    const { doc, getDoc } = require("firebase/firestore");
    const settingsRef = doc(db, "settings", "api_settings");
    const snap = await getDoc(settingsRef);
    const apiUrl = snap.exists() ? snap.data()?.api_url : null;

    if (!apiUrl || typeof apiUrl !== "string") {
      throw new Error(
        "Firestore settings/api_settings içinde geçerli api_url bulunamadı"
      );
    }
    return apiUrl.trim();
  }

  buildHttpBaseUrl(apiUrl) {
    const trimmed = (apiUrl || "").trim();
    if (!trimmed) throw new Error("Geçersiz api_url");

    let normalized = trimmed;
    // ws(s) -> http(s)
    if (normalized.startsWith("ws://")) {
      normalized = `http://${normalized.slice("ws://".length)}`;
    } else if (normalized.startsWith("wss://")) {
      normalized = `https://${normalized.slice("wss://".length)}`;
    } else if (!normalized.startsWith("http://") && !normalized.startsWith("https://")) {
      // Şema yoksa https varsay
      normalized = `https://${normalized}`;
    }

    // /ws/chat gibi suffix'leri temizle
    try {
      const url = new URL(normalized);
      if (url.pathname && url.pathname.endsWith("/ws/chat")) {
        url.pathname = url.pathname.replace(/\/ws\/chat$/, "");
      }
      // trailing slash'ı normalize et
      url.pathname = (url.pathname || "/").replace(/\/+$/, "");
      return url.toString().replace(/\/+$/, "");
    } catch {
      return normalized.replace(/\/ws\/chat\/?$/, "").replace(/\/+$/, "");
    }
  }

  buildHttpUrl(baseUrl, path) {
    const base = (baseUrl || "").replace(/\/+$/, "");
    const p = (path || "").startsWith("/") ? path : `/${path}`;
    return `${base}${p}`;
  }

  async createThread({ title = "Bitki Bakımı", new_thread = true } = {}) {
    const idToken = await this.getIdToken();
    const apiUrl = await this.resolveApiUrl();
    const baseUrl = this.buildHttpBaseUrl(apiUrl);

    const response = await fetch(this.buildHttpUrl(baseUrl, "/chat/threads"), {
      method: "POST",
      headers: {
        idToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ title, new_thread }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const json = await response.json();
    return json;
  }

  async sendTextMessage({ threadId, text }) {
    const idToken = await this.getIdToken();
    const apiUrl = await this.resolveApiUrl();
    const baseUrl = this.buildHttpBaseUrl(apiUrl);

    const response = await fetch(this.buildHttpUrl(baseUrl, "/chat/message"), {
      method: "POST",
      headers: {
        idToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ thread_id: threadId, text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async sendDiagnosis({ threadId, cls, confidence, auto_reply = true }) {
    const idToken = await this.getIdToken();
    const apiUrl = await this.resolveApiUrl();
    const baseUrl = this.buildHttpBaseUrl(apiUrl);

    const response = await fetch(this.buildHttpUrl(baseUrl, "/chat/diagnosis"), {
      method: "POST",
      headers: {
        idToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        thread_id: threadId,
        cls,
        confidence,
        auto_reply,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
  /**
   * Markdown içindeki JSON'ı parse eder
   */
  parseMarkdownJson(content) {
    try {
      // Eğer content markdown json formatında ise (```json ... ```)
      if (typeof content === "string" && content.includes("```json")) {
        // Markdown'dan JSON kısmını çıkar
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const jsonString = jsonMatch[1].trim();
          console.log("🔍 Markdown'dan çıkarılan JSON:", jsonString);
          return JSON.parse(jsonString);
        }
      }

      // Eğer normal JSON string ise
      if (typeof content === "string") {
        try {
          return JSON.parse(content);
        } catch (e) {
          // Parse edilemezse content'i döndür
          return { content: content };
        }
      }

      // Eğer zaten obje ise
      if (typeof content === "object") {
        return content;
      }

      return { content: content };
    } catch (error) {
      console.error("❌ Markdown JSON parse hatası:", error);
      return { content: content };
    }
  }

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
  async analyzeImage(selectedImage, inputText = "", options = {}) {
    try {
      const idToken = await this.getIdToken();
      const { plantId, threadId } = options || {};

      // FormData hazırla
      const fd = new FormData();
      fd.append("file", {
        uri: selectedImage.uri,
        name: "leaf.jpg",
        type: "image/jpeg",
      });
      fd.append("auto_reply", "true");

      // Thread ID (HTTP modelinde client tarafında tutulur)
      fd.append("thread_id", threadId ? String(threadId) : "");

      // (Optional) Plant ID'yi backend'e ilet
      if (plantId) {
        fd.append("plant_id", String(plantId));
      }

      console.log("📤 Fotoğraf analizi başlatılıyor...", {
        threadId: threadId || "",
        plantId: plantId || "",
      });

      const apiUrl = await this.resolveApiUrl();
      const baseUrl = this.buildHttpBaseUrl(apiUrl);

      // API'ye gönder
      const response = await fetch(this.buildHttpUrl(baseUrl, "/chat/analyze-image"), {
        method: "POST",
        headers: {
          idToken,
        },
        body: fd,
      });

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

    const applyDiagnosisToMessage = (targetMessage, diagnosisLike) => {
      if (!diagnosisLike || typeof diagnosisLike !== "object") return;

      // Yeni WS şemasıyla gelen diagnosis object / alanları normalize et
      const classValue =
        diagnosisLike.classTr ||
        diagnosisLike.diagnosisTr ||
        diagnosisLike.class ||
        diagnosisLike.type;
      const confidenceValue =
        typeof diagnosisLike.confidence === "number"
          ? diagnosisLike.confidence
          : undefined;

      targetMessage.type = "analysis";
      targetMessage.disease = classValue;
      if (confidenceValue !== undefined) {
        targetMessage.confidence = confidenceValue;
      }

      // İstersen UI tarafında daha zengin kullanılsın diye ham objeyi de tut
      targetMessage.diagnosis = diagnosisLike;
    };

    // Yeni format: { assistant: {...}, diagnosis: {...}, message_id, thread_id }
    if (data.assistant && data.assistant.content) {
      const parsedContent = this.parseMarkdownJson(data.assistant.content);
      console.log("🔍 Assistant parsed content:", parsedContent);

      const latencyMs =
        typeof data?.assistant?.latency_ms === "number"
          ? data.assistant.latency_ms
          : typeof data?.latency_ms === "number"
            ? data.latency_ms
            : undefined;

      const newMessage = {
        id:
          data.message_id ||
          data.assistant.message_id ||
          data.assistant.id ||
          Date.now().toString(),
        role: "assistant",
        content: parsedContent.content || data.assistant.content,
        timestamp: new Date(),
        ...(latencyMs !== undefined ? { latencyMs } : {}),
      };

      // Eğer diagnosis bilgisi varsa ekle
      if (data.diagnosis) {
        applyDiagnosisToMessage(newMessage, data.diagnosis);
      }

      const notesFromAssistant =
        Array.isArray(parsedContent.notes)
          ? parsedContent.notes
          : Array.isArray(data.assistant.notes)
            ? data.assistant.notes
            : null;

      // Eğer notes varsa ayrı mesaj olarak döndür
      if (notesFromAssistant) {
        const notesMessage = {
          id: `${newMessage.id}_notes`,
          role: "assistant_notes",
          content: notesFromAssistant,
          timestamp: new Date(),
          hasActionButton: true,
        };

        console.log("✅ İşlenmiş mesajlar (ana + notes):", [
          newMessage,
          notesMessage,
        ]);
        return [newMessage, notesMessage];
      }

      console.log("✅ İşlenmiş mesaj:", newMessage);
      return newMessage;
    }

    // Alternatif format kontrolleri - bazen assistant obje olarak değil direkt content olarak gelebilir
    if (data.content && typeof data.content === "string") {
      console.log("🔍 Direkt content formatı algılandı");
      const parsedContent = this.parseMarkdownJson(data.content);

      const latencyMs =
        typeof data?.latency_ms === "number" ? data.latency_ms : undefined;

      const newMessage = {
        id: data.message_id || Date.now().toString(),
        role: "assistant",
        content: parsedContent.content || data.content,
        timestamp: new Date(),
        ...(latencyMs !== undefined ? { latencyMs } : {}),
      };

      if (data.diagnosis) {
        applyDiagnosisToMessage(newMessage, data.diagnosis);
      }

      if (parsedContent.notes && Array.isArray(parsedContent.notes)) {
        const notesMessage = {
          id: `${newMessage.id}_notes`,
          role: "assistant_notes",
          content: parsedContent.notes,
          timestamp: new Date(),
          hasActionButton: true,
        };
        return [newMessage, notesMessage];
      }

      return newMessage;
    }

    // Eski format: { type: "message", message: {...} }
    if (data.type === "message" && data.message) {
      // Yeni şema: SystemEvent diagnosis yayınını message olarak UI'ya çevir
      if (data.message.role === "systemEvent") {
        const content = data.message.content;
        if (content && typeof content === "object" && content.type === "diagnosis") {
          const diagnosisMessage = {
            id: data.message.id || Date.now().toString(),
            role: "assistant",
            content:
              content.classTr ||
              content.class ||
              "Teşhis sonucu alındı.",
            timestamp: new Date(),
          };

          applyDiagnosisToMessage(diagnosisMessage, content);

          // Ek alanları da sakla (opsiyonel)
          diagnosisMessage.thread_id = data.thread_id;
          return diagnosisMessage;
        }

        // Diagnosis dışındaki systemEvent'leri sessizce yok say
        console.log("⚙️ SystemEvent mesajı atlandı:", data.message);
        return null;
      }

      // İçeriği parse et (markdown JSON olabilir)
      const parsedContent = this.parseMarkdownJson(data.message.content);
      console.log("🔍 Message parsed content:", parsedContent);

      // İlk olarak ana mesajı oluştur
      const mainMessage = {
        id: data.message.id || Date.now().toString(),
        role: data.message.role,
        content: parsedContent.content || data.message.content,
        timestamp: new Date(),
        ...(typeof data?.message?.latency_ms === "number"
          ? { latencyMs: data.message.latency_ms }
          : {}),
      };

      // Yeni şema: assistant mesajı üzerinde diagnosis alanları gelebilir
      if (
        data.message.class ||
        data.message.classTr ||
        typeof data.message.confidence === "number" ||
        data.message.diagnosisTr
      ) {
        applyDiagnosisToMessage(mainMessage, {
          type: "diagnosis",
          class: data.message.class,
          classTr: data.message.classTr,
          diagnosisTr: data.message.diagnosisTr,
          confidence: data.message.confidence,
          notes: data.message.notes,
        });
      }

      const notesFromMessage =
        Array.isArray(parsedContent.notes)
          ? parsedContent.notes
          : Array.isArray(data.message.notes)
            ? data.message.notes
            : null;

      // Eğer notes varsa ayrı mesaj olarak döndür
      if (notesFromMessage) {
        const notesMessage = {
          id: `${mainMessage.id}_notes`,
          role: "assistant_notes",
          content: notesFromMessage,
          timestamp: new Date(),
          hasActionButton: true,
        };

        console.log("✅ İşlenmiş mesajlar (message ana + notes):", [
          mainMessage,
          notesMessage,
        ]);
        return [mainMessage, notesMessage];
      }

      // Yeni şema: notes array direkt message üzerinde gelebilir
      if (Array.isArray(data.message.notes) && data.message.notes.length > 0) {
        const notesMessage = {
          id: `${mainMessage.id}_notes`,
          role: "assistant_notes",
          content: data.message.notes,
          timestamp: new Date(),
          hasActionButton: true,
        };
        return [mainMessage, notesMessage];
      }

      // Eğer bu bir fotoğraf analizi cevabıysa, diagnosis bilgisini de ekle
      if (data.diagnosis) {
        applyDiagnosisToMessage(mainMessage, data.diagnosis);
      }

      console.log("✅ İşlenmiş mesaj (message):", mainMessage);
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
