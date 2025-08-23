// Firebase Error Handler - Firebase/Firestore işlemleri için özelleşmiş hata yönetimi
import globalErrorHandler from "./globalErrorHandler";

class FirebaseErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 10000,
    };

    this.offlineQueue = [];
    this.isOffline = false;
  }

  // Firebase operation wrapper
  async wrapFirebaseOperation(operation, context = {}) {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await operation();

        // Başarılı işlem için timing
        const duration = Date.now() - startTime;
        if (__DEV__ && duration > 3000) {
          console.warn(
            `⚠️ Slow Firebase operation: ${
              context.operation || "Unknown"
            } took ${duration}ms`
          );
        }

        return result;
      } catch (error) {
        lastError = error;

        const isRetryable = this.isRetryableError(error);
        const shouldRetry =
          attempt < this.retryConfig.maxRetries && isRetryable;

        // Hata raporla
        globalErrorHandler.reportFirebaseError(error, {
          ...context,
          attempt,
          maxRetries: this.retryConfig.maxRetries,
          isRetryable,
          shouldRetry,
          duration: Date.now() - startTime,
          showToUser: !shouldRetry || this.isUserFacingError(error),
        });

        if (shouldRetry) {
          const delay = this.calculateDelay(attempt);
          console.log(
            `🔄 Retrying Firebase operation in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`
          );
          await this.delay(delay);
          continue;
        }

        // Son deneme de başarısız oldu
        throw this.enhanceFirebaseError(error, context, attempt);
      }
    }

    throw lastError;
  }

  // Firestore document operations
  async getDocument(docRef, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        const snapshot = await docRef.get();
        if (!snapshot.exists) {
          throw new Error(`Document not found: ${docRef.path}`);
        }
        return { id: snapshot.id, ...snapshot.data() };
      },
      {
        operation: "getDocument",
        path: docRef.path,
        ...context,
      }
    );
  }

  async setDocument(docRef, data, options = {}, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        return await docRef.set(data, options);
      },
      {
        operation: "setDocument",
        path: docRef.path,
        ...context,
      }
    );
  }

  async updateDocument(docRef, data, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        return await docRef.update(data);
      },
      {
        operation: "updateDocument",
        path: docRef.path,
        ...context,
      }
    );
  }

  async deleteDocument(docRef, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        return await docRef.delete();
      },
      {
        operation: "deleteDocument",
        path: docRef.path,
        ...context,
      }
    );
  }

  // Firestore collection operations
  async getCollection(collectionRef, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        const snapshot = await collectionRef.get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      {
        operation: "getCollection",
        path: collectionRef.path,
        ...context,
      }
    );
  }

  async queryCollection(query, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        const snapshot = await query.get();
        return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      {
        operation: "queryCollection",
        ...context,
      }
    );
  }

  // Firebase Auth operations
  async signInUser(authFunction, context = {}) {
    return this.wrapFirebaseOperation(authFunction, {
      operation: "signIn",
      ...context,
    });
  }

  async signUpUser(authFunction, context = {}) {
    return this.wrapFirebaseOperation(authFunction, {
      operation: "signUp",
      ...context,
    });
  }

  async signOutUser(authFunction, context = {}) {
    return this.wrapFirebaseOperation(authFunction, {
      operation: "signOut",
      ...context,
    });
  }

  // Firebase Storage operations
  async uploadFile(storageRef, file, metadata = {}, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        // Upload progress tracking
        const uploadTask = storageRef.put(file, metadata);

        return new Promise((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              console.log(`📤 Upload progress: ${progress.toFixed(1)}%`);

              // Progress callback varsa çağır
              if (context.onProgress) {
                context.onProgress(progress, snapshot);
              }
            },
            (error) => {
              reject(this.enhanceStorageError(error, context));
            },
            async () => {
              try {
                const downloadURL =
                  await uploadTask.snapshot.ref.getDownloadURL();
                resolve({
                  downloadURL,
                  fullPath: uploadTask.snapshot.ref.fullPath,
                  size: uploadTask.snapshot.totalBytes,
                  metadata: uploadTask.snapshot.metadata,
                });
              } catch (error) {
                reject(error);
              }
            }
          );
        });
      },
      {
        operation: "uploadFile",
        path: storageRef.fullPath,
        fileSize: file?.size,
        ...context,
      }
    );
  }

  async downloadFile(storageRef, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        const downloadURL = await storageRef.getDownloadURL();
        return downloadURL;
      },
      {
        operation: "downloadFile",
        path: storageRef.fullPath,
        ...context,
      }
    );
  }

  async deleteFile(storageRef, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        return await storageRef.delete();
      },
      {
        operation: "deleteFile",
        path: storageRef.fullPath,
        ...context,
      }
    );
  }

  // Batch operations
  async executeBatch(batchOperations, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        const batch = batchOperations.batch;
        return await batch.commit();
      },
      {
        operation: "batchCommit",
        operationCount: batchOperations.count || 0,
        ...context,
      }
    );
  }

  // Transaction operations
  async executeTransaction(transactionFunction, context = {}) {
    return this.wrapFirebaseOperation(
      async () => {
        const firestore = context.firestore;
        return await firestore.runTransaction(transactionFunction);
      },
      {
        operation: "transaction",
        ...context,
      }
    );
  }

  // Retry edilebilir hata kontrolü
  isRetryableError(error) {
    // Network errors
    if (
      error.code === "unavailable" ||
      error.code === "deadline-exceeded" ||
      error.code === "internal"
    ) {
      return true;
    }

    // Auth temporary errors
    if (
      error.code === "auth/network-request-failed" ||
      error.code === "auth/too-many-requests"
    ) {
      return true;
    }

    // Storage temporary errors
    if (
      error.code === "storage/retry-limit-exceeded" ||
      error.code === "storage/canceled"
    ) {
      return true;
    }

    // Generic network issues
    if (
      error.message?.includes("network") ||
      error.message?.includes("timeout") ||
      error.message?.includes("connection")
    ) {
      return true;
    }

    return false;
  }

  // Kullanıcıya gösterilmesi gereken hata mı?
  isUserFacingError(error) {
    const userFacingCodes = [
      "auth/user-not-found",
      "auth/wrong-password",
      "auth/email-already-in-use",
      "auth/weak-password",
      "auth/invalid-email",
      "permission-denied",
      "not-found",
      "already-exists",
      "resource-exhausted",
    ];

    return userFacingCodes.includes(error.code);
  }

  // Firebase hatasını zenginleştir
  enhanceFirebaseError(error, context = {}, attempt = 1) {
    const enhancedError = new Error(this.getFirebaseErrorMessage(error));
    enhancedError.originalError = error;
    enhancedError.code = error.code;
    enhancedError.context = context;
    enhancedError.attempt = attempt;
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.userMessage = this.getUserFriendlyMessage(error);
    enhancedError.retryable = this.isRetryableError(error);

    return enhancedError;
  }

  // Storage hatasını zenginleştir
  enhanceStorageError(error, context = {}) {
    const storageMessages = {
      "storage/object-not-found": "Dosya bulunamadı",
      "storage/bucket-not-found": "Depolama alanı bulunamadı",
      "storage/project-not-found": "Proje bulunamadı",
      "storage/quota-exceeded": "Depolama kotası aşıldı",
      "storage/unauthenticated": "Dosya yükleme izni yok",
      "storage/unauthorized": "Bu dosyaya erişim izniniz yok",
      "storage/retry-limit-exceeded": "Dosya yükleme zaman aşımı",
      "storage/invalid-checksum": "Dosya bozuk, tekrar deneyin",
      "storage/canceled": "Dosya yükleme iptal edildi",
      "storage/invalid-event-name": "Geçersiz işlem",
      "storage/invalid-url": "Geçersiz dosya adresi",
      "storage/invalid-argument": "Geçersiz dosya parametresi",
      "storage/no-default-bucket": "Varsayılan depolama alanı yok",
      "storage/cannot-slice-blob": "Dosya işlenemedi",
      "storage/server-file-wrong-size": "Dosya boyutu uyumsuz",
    };

    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.code = error.code;
    enhancedError.context = context;
    enhancedError.userMessage =
      storageMessages[error.code] || "Dosya işlemi başarısız oldu";
    enhancedError.retryable = this.isRetryableError(error);

    return enhancedError;
  }

  // Firebase error message'ını al
  getFirebaseErrorMessage(error) {
    if (error.message) return error.message;
    if (error.code) return `Firebase error: ${error.code}`;
    return "Unknown Firebase error";
  }

  // Kullanıcı dostu mesaj
  getUserFriendlyMessage(error) {
    const messages = {
      // Auth errors
      "auth/user-not-found": "Bu e-posta adresi kayıtlı değil",
      "auth/wrong-password": "Şifre hatalı",
      "auth/email-already-in-use": "Bu e-posta adresi zaten kullanımda",
      "auth/weak-password": "Şifre çok zayıf, en az 6 karakter olmalı",
      "auth/invalid-email": "Geçersiz e-posta adresi",
      "auth/user-disabled": "Bu hesap devre dışı bırakılmış",
      "auth/too-many-requests": "Çok fazla deneme yapıldı, lütfen bekleyin",
      "auth/network-request-failed": "İnternet bağlantınızı kontrol edin",

      // Firestore errors
      "permission-denied": "Bu işlem için yetkiniz yok",
      "not-found": "Veri bulunamadı",
      "already-exists": "Bu veri zaten mevcut",
      "resource-exhausted": "Kaynak limiti aşıldı",
      "failed-precondition": "İşlem koşulları sağlanmadı",
      aborted: "İşlem iptal edildi",
      "out-of-range": "Geçersiz veri aralığı",
      unimplemented: "Bu özellik henüz desteklenmiyor",
      internal: "Sunucu hatası oluştu",
      unavailable: "Hizmet şu anda kullanılamıyor",
      "data-loss": "Veri kaybı oluştu",
      unauthenticated: "Oturum açmanız gerekiyor",
      "invalid-argument": "Geçersiz parametre",
      "deadline-exceeded": "İşlem zaman aşımına uğradı",
      cancelled: "İşlem iptal edildi",
    };

    return messages[error.code] || "Bir sorun oluştu, lütfen tekrar deneyin";
  }

  // Delay utility
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Retry delay hesapla
  calculateDelay(attempt) {
    const exponentialDelay =
      this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
  }

  // Offline queue operations
  addToOfflineQueue(operation, data) {
    this.offlineQueue.push({
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    });
  }

  async processOfflineQueue() {
    console.log(`📱 Processing ${this.offlineQueue.length} offline operations`);

    const results = [];
    while (this.offlineQueue.length > 0) {
      const item = this.offlineQueue.shift();

      try {
        const result = await item.operation(item.data);
        results.push({ success: true, result, item });
      } catch (error) {
        item.retryCount++;

        if (item.retryCount < 3) {
          this.offlineQueue.push(item); // Tekrar kuyruğa ekle
        } else {
          results.push({ success: false, error, item });
          globalErrorHandler.reportFirebaseError(error, {
            operation: "offline_queue_item",
            retryCount: item.retryCount,
            showToUser: false,
          });
        }
      }
    }

    return results;
  }

  // Network durumu değiştirme
  setOfflineMode(isOffline) {
    this.isOffline = isOffline;

    if (!isOffline && this.offlineQueue.length > 0) {
      // Online olduk, kuyruğu işle
      this.processOfflineQueue();
    }
  }

  // Configuration
  configure(config) {
    if (config.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...config.retryConfig };
    }
  }
}

// Export singleton instance
const firebaseErrorHandler = new FirebaseErrorHandler();

export default firebaseErrorHandler;
