// Global error handler for handling various application errors
import { Alert } from "react-native";
import {
  determineChatError,
  formatChatError,
} from "../exceptions/chat_exceptions";
import { showCustomErrorAlert } from "./alertService";

class GlobalErrorHandler {
  constructor() {
    this.errorReports = [];
    this.isInitialized = false;
    this.maxErrorReports = 100; // Maximum number of errors to keep in memory
    this.errorCallbacks = []; // Callbacks to notify when errors occur
    this.appStartTime = Date.now(); // App başlangıç zamanını kaydet
    this.lastDomErrorLog = 0; // DOM error log spam'ini önlemek için

    // Initialize global error handlers
    this.initialize();
  }

  // Initialize global error handlers
  initialize() {
    if (this.isInitialized) return;

    // Handle unhandled promise rejections
    this.setupPromiseRejectionHandler();

    // Handle global JavaScript errors (additional safety)
    this.setupGlobalErrorHandler();

    this.isInitialized = true;
    console.log("✅ Global Error Handler initialized");
  }

  // Setup promise rejection handler
  setupPromiseRejectionHandler() {
    // React Native global promise rejection handler
    const originalHandler = global.ErrorUtils?.getGlobalHandler();

    global.ErrorUtils?.setGlobalHandler((error, isFatal) => {
      this.reportError(error, {
        type: "global_error",
        isFatal,
        timestamp: new Date().toISOString(),
      });

      // Call original handler if it exists
      if (originalHandler) {
        originalHandler(error, isFatal);
      }
    });

    // Handle unhandled promise rejections
    if (global.HermesInternal?.enablePromiseRejectionTracker) {
      global.HermesInternal.enablePromiseRejectionTracker({
        allRejections: true,
        onUnhandled: (id, rejection) => {
          this.reportPromiseRejection(rejection, {
            rejectionId: id,
            type: "unhandled_promise_rejection",
          });
        },
        onHandled: (id) => {
          if (__DEV__) {
            console.log(`✅ Promise rejection ${id} was handled`);
          }
        },
      });
    }
  }

  // Setup global error handler for additional safety
  setupGlobalErrorHandler() {
    // React Native already handles global errors well
    // We avoid overriding console.error to prevent recursive loops

    // Handle window errors if available (for web compatibility)
    if (typeof window !== "undefined" && window.addEventListener) {
      window.addEventListener("error", (event) => {
        this.reportError(event.error, {
          type: "window_error",
          source: "window.addEventListener",
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      window.addEventListener("unhandledrejection", (event) => {
        this.reportPromiseRejection(event.reason, {
          type: "window_unhandled_rejection",
          source: "window.addEventListener",
        });
      });
    }
  }

  // Report WebSocket errors
  reportWebSocketError(error, context = {}) {
    console.error("🚨 WebSocket Error:", error);
    console.error("📍 Context:", context);

    const errorReport = {
      type: "websocket",
      error: error.message || error.toString(),
      context,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId(),
    };

    this.addErrorReport(errorReport);
    this.notifyErrorCallbacks(errorReport);

    // Show user-friendly error for WebSocket issues
    this.showUserFriendlyError("websocket", error, context);
  }

  // Report promise rejection errors
  reportPromiseRejection(rejection, context = {}) {
    // Only log in development mode to avoid spam
    if (__DEV__) {
      console.warn("⚠️ Promise Rejection:", rejection?.message || rejection);
      console.warn("📍 Context:", context);

      // Stack trace varsa detayını da yazdır
      if (rejection?.stack) {
        console.warn("📚 Stack Trace:", rejection.stack);
      }
    }

    // Rejection'ı normalize et
    let errorMessage = "Unknown promise rejection";
    let errorStack = null;

    if (rejection instanceof Error) {
      errorMessage = rejection.message;
      errorStack = rejection.stack;
    } else if (typeof rejection === "string") {
      errorMessage = rejection;
    } else if (rejection && typeof rejection === "object") {
      errorMessage =
        rejection.message || rejection.toString() || JSON.stringify(rejection);
    }

    const errorReport = {
      type: "promise_rejection",
      error: errorMessage,
      stack: errorStack,
      context: {
        ...context,
        rejectionType: typeof rejection,
        rejectionValue: rejection,
      },
      timestamp: new Date().toISOString(),
      id: this.generateErrorId(),
    };

    this.addErrorReport(errorReport);
    this.notifyErrorCallbacks(errorReport);

    // Critical error'ları kullanıcıya göster (ama başlangıçta çok erken değilse)
    if (
      this.isCriticalPromiseRejection(rejection, context) &&
      this.shouldShowStartupError()
    ) {
      this.showUserFriendlyError(
        "promise_rejection",
        { message: errorMessage },
        {
          ...context,
          showToUser: true,
        }
      );
    }
  }

  // Startup sırasında error gösterilmeli mi?
  shouldShowStartupError() {
    // Uygulama başlatılalı en az 5 saniye geçmişse error göster
    const now = Date.now();
    const timeSinceStart = now - this.appStartTime;

    return timeSinceStart > 5000; // 5 saniye sonra
  }

  // Critical promise rejection kontrolü
  isCriticalPromiseRejection(rejection, context = {}) {
    const errorMessage = rejection?.message || rejection?.toString() || "";

    // Context'te critical olarak işaretlenmişse
    if (context.critical) return true;

    // DOM manipulation hataları - expo-image-manipulator, web libraries vb.
    const domErrors = [
      "getElementsByTagName",
      "getElementsByTa", // typo version
      "getElementById",
      "createElement",
      "document",
      "window",
      "HTMLElement",
      "Canvas",
      "canvas",
      "Image",
      "Blob",
    ];

    if (domErrors.some((pattern) => errorMessage.includes(pattern))) {
      if (__DEV__) {
        // Sadece bir kez log'la, spam'i önle
        const now = Date.now();
        if (!this.lastDomErrorLog || now - this.lastDomErrorLog > 10000) {
          // 10 saniye aralık
          console.warn("🔍 DOM manipulation error filtered (React Native)");
          console.warn("📦 Source: Web library trying to access DOM APIs");
          this.lastDomErrorLog = now;
        }
      }
      return false; // Bu hatayı kullanıcıya gösterme
    }

    // Diğer bilinen third-party library hataları
    const thirdPartyPatterns = [
      "tflite",
      "tensorflow",
      "expo-",
      "react-native-",
      "firebase",
      "node_modules",
    ];

    const isFromKnownThirdParty = thirdPartyPatterns.some(
      (pattern) =>
        errorMessage.toLowerCase().includes(pattern) ||
        stack.toLowerCase().includes(pattern)
    );

    if (isFromKnownThirdParty) {
      if (__DEV__) {
        console.warn(
          "🔍 Third-party library error detected, not showing to user:",
          errorMessage
        );
      }
      return false;
    }

    // Critical error patterns (kullanıcının kodundan geliyorsa)
    const criticalPatterns = [
      "Cannot read property",
      "Cannot access before initialization",
      "is not a function",
      "Network request failed",
      "Failed to fetch",
      "TypeError",
      "ReferenceError",
    ];

    // Sadece app kodundan gelen hatalar için kritik kabul et
    const stack = rejection?.stack || "";
    const isFromAppCode =
      stack.includes("/src/") ||
      stack.includes("/app/") ||
      stack.includes("/components/");

    // Third-party library hatalarını filtrele
    const isFromThirdParty =
      stack.includes("node_modules") || stack.includes("expo") || !stack; // Stack yoksa muhtemelen third-party

    // App kodundan gelen ve critical pattern'e uyan hatalar
    const hasCriticalPattern = criticalPatterns.some((pattern) =>
      errorMessage.toLowerCase().includes(pattern.toLowerCase())
    );

    // Sadece gerçekten kritik olan hatalar
    return isFromAppCode && !isFromThirdParty && hasCriticalPattern;
  }

  // Report general application errors (Enhanced)
  reportError(error, context = {}) {
    console.error("🚨 Application Error:", error);
    console.error("📍 Context:", context);

    const errorReport = {
      type: context.type || "general",
      error: error.message || error.toString(),
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId(),
    };

    this.addErrorReport(errorReport);
    this.notifyErrorCallbacks(errorReport);

    // Show user-friendly error if needed
    if (context.showToUser) {
      this.showUserFriendlyError(errorReport.type, error, context);
    }
  }

  // Report network errors (Enhanced)
  reportNetworkError(error, context = {}) {
    console.error("🚨 Network Error:", error);
    console.error("📍 Context:", context);

    // Use chat exceptions for better error classification
    const classifiedError = determineChatError(error);
    const formattedError = formatChatError(error);

    const errorReport = {
      type: "network",
      subType: classifiedError.type || "unknown",
      error: error.message || error.toString(),
      userMessage: formattedError.message,
      context: {
        ...context,
        retryable: formattedError.retryable,
        errorIcon: formattedError.icon,
        errorColor: formattedError.color,
      },
      timestamp: new Date().toISOString(),
      id: this.generateErrorId(),
    };

    this.addErrorReport(errorReport);
    this.notifyErrorCallbacks(errorReport);

    // Show user-friendly network error
    this.showUserFriendlyError("network", error, errorReport.context);
  }

  // Report Firebase/Firestore errors
  reportFirebaseError(error, context = {}) {
    console.error("🚨 Firebase Error:", error);
    console.error("📍 Context:", context);

    const errorReport = {
      type: "firebase",
      error: error.message || error.toString(),
      code: error.code,
      context,
      timestamp: new Date().toISOString(),
      id: this.generateErrorId(),
    };

    this.addErrorReport(errorReport);
    this.notifyErrorCallbacks(errorReport);

    // Show Firebase-specific user error
    this.showFirebaseError(error, context);
  }

  // Enhanced error report management
  addErrorReport(errorReport) {
    this.errorReports.unshift(errorReport); // Add to beginning

    // Keep only the latest errors
    if (this.errorReports.length > this.maxErrorReports) {
      this.errorReports = this.errorReports.slice(0, this.maxErrorReports);
    }
  }

  // Generate unique error ID
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Add error callback listener
  addErrorCallback(callback) {
    this.errorCallbacks.push(callback);
  }

  // Remove error callback listener
  removeErrorCallback(callback) {
    this.errorCallbacks = this.errorCallbacks.filter((cb) => cb !== callback);
  }

  // Notify all error callbacks
  notifyErrorCallbacks(errorReport) {
    this.errorCallbacks.forEach((callback) => {
      try {
        callback(errorReport);
      } catch (callbackError) {
        console.error("Error in error callback:", callbackError);
      }
    });
  }

  // Show user-friendly errors
  showUserFriendlyError(type, error, context = {}) {
    if (!context.showToUser) return;

    const userMessages = {
      websocket:
        "Bağlantı sorunu yaşanıyor. Lütfen internet bağlantınızı kontrol edin.",
      network: "İnternet bağlantısı sorunu. Lütfen tekrar deneyin.",
      firebase: "Veri kaydedilirken bir sorun oluştu. Lütfen tekrar deneyin.",
      promise_rejection: "Bir işlem tamamlanamadı. Lütfen tekrar deneyin.",
      general:
        "Beklenmeyen bir hata oluştu. Lütfen uygulamayı yeniden başlatın.",
    };

    const message = userMessages[type] || userMessages.general;

    // Don't show too many alerts in quick succession
    if (this.shouldShowAlert()) {
      // Önce CustomAlert'i dene, fallback olarak Alert.alert kullan
      const customAlertShown = showCustomErrorAlert(
        "Bir Sorun Oluştu",
        message
      );

      if (!customAlertShown) {
        // CustomAlert mevcut değilse eski yöntemi kullan
        Alert.alert("Bir Sorun Oluştu", message, [
          { text: "Tamam", style: "default" },
        ]);
      }
    }
  }

  // Show Firebase-specific errors
  showFirebaseError(error, context = {}) {
    if (!context.showToUser) return;

    const firebaseMessages = {
      "auth/network-request-failed": "İnternet bağlantınızı kontrol edin.",
      "auth/too-many-requests": "Çok fazla deneme yapıldı. Lütfen bekleyin.",
      "firestore/unavailable":
        "Hizmet şu anda kullanılamıyor. Lütfen tekrar deneyin.",
      "storage/unknown": "Dosya yüklenirken bir sorun oluştu.",
      default: "Bir sorun oluştu. Lütfen tekrar deneyin.",
    };

    const message = firebaseMessages[error.code] || firebaseMessages.default;

    if (this.shouldShowAlert()) {
      // Önce CustomAlert'i dene, fallback olarak Alert.alert kullan
      const customAlertShown = showCustomErrorAlert("Hizmet Sorunu", message);

      if (!customAlertShown) {
        // CustomAlert mevcut değilse eski yöntemi kullan
        Alert.alert("Hizmet Sorunu", message, [
          { text: "Tamam", style: "default" },
        ]);
      }
    }
  }

  // Rate limiting for alerts
  shouldShowAlert() {
    const now = Date.now();
    const lastAlert = this.lastAlertTime || 0;
    const minInterval = 3000; // 3 seconds minimum between alerts

    if (now - lastAlert > minInterval) {
      this.lastAlertTime = now;
      return true;
    }
    return false;
  }

  // Get error reports with filtering
  getErrorReports(filter = {}) {
    let reports = [...this.errorReports];

    if (filter.type) {
      reports = reports.filter((report) => report.type === filter.type);
    }

    if (filter.since) {
      reports = reports.filter(
        (report) => new Date(report.timestamp) >= filter.since
      );
    }

    if (filter.limit) {
      reports = reports.slice(0, filter.limit);
    }

    return reports;
  }

  // Get error statistics
  getErrorStats() {
    const total = this.errorReports.length;
    const byType = {};
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    this.errorReports.forEach((report) => {
      byType[report.type] = (byType[report.type] || 0) + 1;
    });

    const recent = this.errorReports.filter(
      (report) => new Date(report.timestamp) >= last24h
    ).length;

    return {
      total,
      byType,
      recent,
      recentPercentage: total > 0 ? Math.round((recent / total) * 100) : 0,
    };
  }

  // Clear error reports
  clearErrorReports() {
    this.errorReports = [];
    console.log("🧹 Error reports cleared");
  }

  // Export error reports (for debugging or sending to external service)
  exportErrorReports() {
    return {
      timestamp: new Date().toISOString(),
      deviceInfo: this.getDeviceInfo(),
      stats: this.getErrorStats(),
      reports: this.errorReports,
    };
  }

  // Get basic device info for error reports
  getDeviceInfo() {
    return {
      platform: global.Platform?.OS || "unknown",
      version: global.Platform?.Version || "unknown",
      isDev: __DEV__,
      hermes: typeof HermesInternal !== "undefined",
    };
  }

  // Force garbage collection of old error reports
  cleanup() {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days
    const initialCount = this.errorReports.length;

    this.errorReports = this.errorReports.filter(
      (report) => new Date(report.timestamp) >= cutoff
    );

    const removedCount = initialCount - this.errorReports.length;
    if (removedCount > 0) {
      console.log(`🧹 Cleaned up ${removedCount} old error reports`);
    }
  }

  // Health check
  isHealthy() {
    return {
      initialized: this.isInitialized,
      reportsCount: this.errorReports.length,
      callbacksCount: this.errorCallbacks.length,
      lastError: this.errorReports[0]?.timestamp || null,
    };
  }
}

// Export singleton instance
const globalErrorHandler = new GlobalErrorHandler();

// Cleanup old errors periodically
setInterval(() => {
  globalErrorHandler.cleanup();
}, 60 * 60 * 1000); // Every hour

export default globalErrorHandler;
