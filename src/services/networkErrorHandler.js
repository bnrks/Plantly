// Network Error Handler - API çağrıları için özelleşmiş hata yönetimi
import globalErrorHandler from "./globalErrorHandler";
import {
  determineChatError,
  formatChatError,
} from "../exceptions/chat_exceptions";

class NetworkErrorHandler {
  constructor() {
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 10000, // 10 seconds
    };
  }

  // API çağrılarını wrap eden fonksiyon
  async wrapApiCall(apiFunction, context = {}) {
    const startTime = Date.now();
    let lastError = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await apiFunction();

        // Başarılı olursa timing bilgisi ile birlikte döndür
        const duration = Date.now() - startTime;
        if (__DEV__ && duration > 5000) {
          console.warn(
            `⚠️ Slow API call: ${
              context.endpoint || "Unknown"
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
        globalErrorHandler.reportNetworkError(error, {
          ...context,
          attempt,
          maxRetries: this.retryConfig.maxRetries,
          isRetryable,
          shouldRetry,
          duration: Date.now() - startTime,
          showToUser: !shouldRetry, // Son deneme hata verirse kullanıcıya göster
        });

        if (shouldRetry) {
          const delay = this.calculateDelay(attempt);
          console.log(
            `🔄 Retrying API call in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`
          );
          await this.delay(delay);
          continue;
        }

        // Son deneme de başarısız oldu
        throw this.enhanceError(error, context, attempt);
      }
    }

    throw lastError;
  }

  // Fetch wrapper'ı
  async fetchWithErrorHandling(url, options = {}) {
    const context = {
      type: "fetch",
      endpoint: url,
      method: options.method || "GET",
    };

    return this.wrapApiCall(async () => {
      const response = await fetch(url, {
        timeout: 30000, // 30 second timeout
        ...options,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        throw new Error(`HTTP ${response.status}: ${errorBody}`);
      }

      return response;
    }, context);
  }

  // Axios wrapper'ı (eğer axios kullanıyorsanız)
  wrapAxiosRequest(axiosInstance) {
    // Request interceptor
    axiosInstance.interceptors.request.use(
      (config) => {
        config.metadata = { startTime: Date.now() };
        return config;
      },
      (error) => {
        globalErrorHandler.reportNetworkError(error, {
          type: "axios_request",
          showToUser: true,
        });
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axiosInstance.interceptors.response.use(
      (response) => {
        const duration = Date.now() - response.config.metadata.startTime;
        if (__DEV__ && duration > 5000) {
          console.warn(
            `⚠️ Slow axios request: ${response.config.url} took ${duration}ms`
          );
        }
        return response;
      },
      (error) => {
        const context = {
          type: "axios_response",
          endpoint: error.config?.url,
          method: error.config?.method,
          status: error.response?.status,
          showToUser: true,
        };

        globalErrorHandler.reportNetworkError(error, context);
        return Promise.reject(this.enhanceError(error, context));
      }
    );

    return axiosInstance;
  }

  // Hata türünün retry edilebilir olup olmadığını kontrol et
  isRetryableError(error) {
    // Network bağlantı hatları
    if (error.code === "NETWORK_ERROR" || error.code === "ECONNRESET") {
      return true;
    }

    // Timeout hatları
    if (error.code === "TIMEOUT" || error.message?.includes("timeout")) {
      return true;
    }

    // 5xx server hatları (genellikle geçici)
    if (error.response?.status >= 500 && error.response?.status < 600) {
      return true;
    }

    // 429 Rate limiting
    if (error.response?.status === 429) {
      return true;
    }

    // Specific error messages
    const retryableMessages = [
      "fetch failed",
      "network request failed",
      "socket hang up",
      "econnreset",
      "etimedout",
    ];

    return retryableMessages.some((msg) =>
      error.message?.toLowerCase().includes(msg)
    );
  }

  // Retry delay hesapla (exponential backoff)
  calculateDelay(attempt) {
    const exponentialDelay =
      this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // %10 jitter
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
  }

  // Delay utility
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Hatayı daha detaylı bilgilerle zenginleştir
  enhanceError(error, context = {}, attempt = 1) {
    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.context = context;
    enhancedError.attempt = attempt;
    enhancedError.timestamp = new Date().toISOString();

    // Chat error formatting kullan
    const chatError = determineChatError(error);
    const formattedError = formatChatError(error);

    enhancedError.type = chatError.type;
    enhancedError.userMessage = formattedError.message;
    enhancedError.retryable = formattedError.retryable;
    enhancedError.icon = formattedError.icon;
    enhancedError.color = formattedError.color;

    return enhancedError;
  }

  // Özel endpoint'ler için konfigürasyon
  configureEndpoint(endpoint, config) {
    this.endpointConfigs = this.endpointConfigs || {};
    this.endpointConfigs[endpoint] = {
      maxRetries: config.maxRetries || this.retryConfig.maxRetries,
      timeout: config.timeout || 30000,
      retryable: config.retryable !== false,
      ...config,
    };
  }

  // Endpoint'e özel wrapper
  async callEndpoint(endpoint, apiFunction, customContext = {}) {
    const endpointConfig = this.endpointConfigs?.[endpoint] || {};
    const context = {
      endpoint,
      ...customContext,
      ...endpointConfig,
    };

    // Geçici olarak retry config'i değiştir
    const originalMaxRetries = this.retryConfig.maxRetries;
    if (endpointConfig.maxRetries) {
      this.retryConfig.maxRetries = endpointConfig.maxRetries;
    }

    try {
      return await this.wrapApiCall(apiFunction, context);
    } finally {
      // Retry config'i geri yükle
      this.retryConfig.maxRetries = originalMaxRetries;
    }
  }

  // Network durumu kontrolü
  async checkNetworkStatus() {
    try {
      const response = await fetch("https://www.google.com/favicon.ico", {
        method: "HEAD",
        timeout: 5000,
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Bulk operation error handler
  async handleBulkOperation(operations, context = {}) {
    const results = [];
    const errors = [];

    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await this.wrapApiCall(operations[i], {
          ...context,
          bulkIndex: i,
          bulkTotal: operations.length,
        });
        results.push({ index: i, success: true, data: result });
      } catch (error) {
        errors.push({ index: i, success: false, error });
        results.push({ index: i, success: false, error });
      }
    }

    // Bulk operation sonuçlarını raporla
    if (errors.length > 0) {
      globalErrorHandler.reportError(
        new Error(
          `Bulk operation failed: ${errors.length}/${operations.length} operations failed`
        ),
        {
          type: "bulk_operation",
          totalOperations: operations.length,
          failedOperations: errors.length,
          errors: errors.slice(0, 5), // İlk 5 hatayı raporla
          showToUser: errors.length === operations.length, // Tümü başarısız olursa kullanıcıya göster
          ...context,
        }
      );
    }

    return {
      results,
      errors,
      successCount: results.filter((r) => r.success).length,
      errorCount: errors.length,
      totalCount: operations.length,
    };
  }
}

// Export singleton instance
const networkErrorHandler = new NetworkErrorHandler();

export default networkErrorHandler;
