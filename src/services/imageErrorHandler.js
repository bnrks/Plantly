// Image Error Handler - Görsel yükleme ve işleme için özelleşmiş hata yönetimi
import globalErrorHandler from "./globalErrorHandler";

class ImageErrorHandler {
  constructor() {
    this.loadingCache = new Map();
    this.errorCache = new Map();
    this.retryConfig = {
      maxRetries: 3,
      baseDelay: 1000,
      maxDelay: 5000,
    };

    // Image quality fallback levels
    this.qualityLevels = [
      { suffix: "_high", quality: 0.9 },
      { suffix: "_medium", quality: 0.7 },
      { suffix: "_low", quality: 0.5 },
      { suffix: "_thumb", quality: 0.3 },
    ];
  }

  // Ana image loading wrapper'ı
  async loadImage(source, options = {}) {
    const cacheKey = this.getCacheKey(source, options);

    // Cache'den kontrol et
    if (this.loadingCache.has(cacheKey)) {
      return this.loadingCache.get(cacheKey);
    }

    const loadPromise = this.performImageLoad(source, options);
    this.loadingCache.set(cacheKey, loadPromise);

    try {
      const result = await loadPromise;
      return result;
    } catch (error) {
      this.loadingCache.delete(cacheKey);
      throw error;
    }
  }

  // Gerçek image loading işlemi
  async performImageLoad(source, options = {}) {
    const context = {
      type: "image_load",
      source: typeof source === "string" ? source : "blob/file",
      width: options.width,
      height: options.height,
      ...options.context,
    };

    let lastError = null;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.attemptImageLoad(source, options, attempt);

        // Başarılı yükleme
        this.errorCache.delete(this.getCacheKey(source, options));
        return result;
      } catch (error) {
        lastError = error;

        const isRetryable = this.isRetryableImageError(error);
        const shouldRetry =
          attempt < this.retryConfig.maxRetries && isRetryable;

        // Hata raporla
        globalErrorHandler.reportError(error, {
          ...context,
          attempt,
          maxRetries: this.retryConfig.maxRetries,
          isRetryable,
          shouldRetry,
          showToUser: !shouldRetry && !options.silent,
        });

        if (shouldRetry) {
          const delay = this.calculateDelay(attempt);
          console.log(
            `🔄 Retrying image load in ${delay}ms (attempt ${attempt}/${this.retryConfig.maxRetries})`
          );
          await this.delay(delay);
          continue;
        }

        // Quality fallback denemeye çalış
        if (
          options.enableQualityFallback !== false &&
          typeof source === "string"
        ) {
          const fallbackResult = await this.tryQualityFallback(
            source,
            options,
            error
          );
          if (fallbackResult) {
            return fallbackResult;
          }
        }

        // Son çare placeholder
        if (options.placeholder && !options.disablePlaceholder) {
          console.log("📷 Using placeholder image due to load failure");
          return {
            uri: options.placeholder,
            isPlaceholder: true,
            originalError: error,
          };
        }

        break;
      }
    }

    // Hata cache'e ekle
    this.errorCache.set(this.getCacheKey(source, options), {
      error: lastError,
      timestamp: Date.now(),
    });

    throw this.enhanceImageError(lastError, source, options);
  }

  // Tek bir image load denemesi
  async attemptImageLoad(source, options, attempt) {
    return new Promise((resolve, reject) => {
      const timeout = options.timeout || 10000; // 10 second default
      let timeoutId;

      if (typeof source === "string") {
        // URL'den yükleme - Web environment kontrolü
        if (typeof Image === "undefined") {
          // React Native environment
          return this.loadReactNativeImage(
            { uri: source },
            options,
            resolve,
            reject,
            timeout
          );
        }

        const image = new Image();

        timeoutId = setTimeout(() => {
          reject(new Error(`Image load timeout: ${source}`));
        }, timeout);

        image.onload = () => {
          clearTimeout(timeoutId);
          resolve({
            uri: source,
            width: image.naturalWidth || image.width,
            height: image.naturalHeight || image.height,
            loaded: true,
            attempt,
          });
        };

        image.onerror = (event) => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load image: ${source}`));
        };

        image.src = source;
      } else if (source?.uri) {
        // React Native Image source
        this.loadReactNativeImage(source, options, resolve, reject, timeout);
      } else {
        // Blob/File object
        this.loadBlobImage(source, options, resolve, reject, timeout);
      }
    });
  }

  // React Native image loading
  loadReactNativeImage(source, options, resolve, reject, timeout) {
    // React Native'de Image.getSize kullanılabilir
    if (typeof Image !== "undefined" && Image.getSize) {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Image load timeout: ${source.uri}`));
      }, timeout);

      Image.getSize(
        source.uri,
        (width, height) => {
          clearTimeout(timeoutId);
          resolve({
            ...source,
            width,
            height,
            loaded: true,
          });
        },
        (error) => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to get image size: ${error.message}`));
        }
      );
    } else {
      // Fallback: sadece source'u döndür
      resolve({
        ...source,
        loaded: true,
        fallback: true,
      });
    }
  }

  // Blob/File image loading
  loadBlobImage(blob, options, resolve, reject, timeout) {
    if (!(blob instanceof Blob) && !(blob instanceof File)) {
      reject(new Error("Invalid blob/file object"));
      return;
    }

    const timeoutId = setTimeout(() => {
      reject(new Error("Blob image load timeout"));
    }, timeout);

    const reader = new FileReader();

    reader.onload = (event) => {
      clearTimeout(timeoutId);

      const img = new Image();
      img.onload = () => {
        resolve({
          uri: event.target.result,
          width: img.naturalWidth,
          height: img.naturalHeight,
          loaded: true,
          size: blob.size,
          type: blob.type,
        });
      };

      img.onerror = () => {
        reject(new Error("Invalid image blob"));
      };

      img.src = event.target.result;
    };

    reader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error("Failed to read image blob"));
    };

    reader.readAsDataURL(blob);
  }

  // Quality fallback deneme
  async tryQualityFallback(originalUrl, options, originalError) {
    if (!originalUrl || typeof originalUrl !== "string") {
      return null;
    }

    console.log("📷 Trying quality fallback for failed image load");

    for (const level of this.qualityLevels) {
      try {
        // URL'yi quality level'ına göre modifiye et
        const fallbackUrl = this.generateFallbackUrl(originalUrl, level);

        if (fallbackUrl === originalUrl) continue; // Aynı URL'yi tekrar deneme

        const result = await this.attemptImageLoad(
          fallbackUrl,
          {
            ...options,
            enableQualityFallback: false, // Infinite loop önleme
          },
          1
        );

        console.log(`✅ Loaded image with quality fallback: ${level.suffix}`);

        return {
          ...result,
          qualityFallback: level,
          originalUrl,
          originalError,
        };
      } catch (fallbackError) {
        // Bu quality level de başarısız, bir sonrakine geç
        continue;
      }
    }

    return null; // Hiçbir fallback çalışmadı
  }

  // Fallback URL generate et
  generateFallbackUrl(originalUrl, qualityLevel) {
    try {
      const url = new URL(originalUrl);
      const pathname = url.pathname;
      const extension = pathname.split(".").pop();
      const basePath = pathname.replace(`.${extension}`, "");

      // Farklı fallback stratejileri
      const strategies = [
        // Strategy 1: Add quality suffix
        `${basePath}${qualityLevel.suffix}.${extension}`,
        // Strategy 2: Add query parameter
        `${pathname}?quality=${qualityLevel.quality}`,
        // Strategy 3: Thumbnail subdomain
        pathname.replace("/images/", "/thumbnails/"),
      ];

      for (const strategy of strategies) {
        const fallbackUrl = `${url.protocol}//${url.host}${strategy}`;
        if (fallbackUrl !== originalUrl) {
          return fallbackUrl;
        }
      }

      return originalUrl;
    } catch (error) {
      return originalUrl;
    }
  }

  // Image preprocessing
  async preprocessImage(source, options = {}) {
    try {
      // Image'ı yükle
      const loadedImage = await this.loadImage(source, {
        ...options,
        silent: true,
      });

      // Resize gerekli mi?
      if (options.maxWidth || options.maxHeight) {
        return this.resizeImage(loadedImage, options);
      }

      // Compress gerekli mi?
      if (options.compress && options.quality) {
        return this.compressImage(loadedImage, options);
      }

      return loadedImage;
    } catch (error) {
      globalErrorHandler.reportError(error, {
        type: "image_preprocess",
        source: typeof source === "string" ? source : "blob",
        options,
        showToUser: !options.silent,
      });
      throw this.enhanceImageError(error, source, options);
    }
  }

  // Image resize
  async resizeImage(imageData, options) {
    // React Native'de canvas yok, bu web-only feature
    if (typeof document === "undefined") {
      console.warn("Image resize not supported in React Native environment");
      return {
        ...imageData,
        resized: false,
        warning: "Resize not supported in React Native",
      };
    }

    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();

        img.onload = () => {
          const { width, height } = this.calculateResizeDimensions(
            img.width,
            img.height,
            options.maxWidth,
            options.maxHeight
          );

          canvas.width = width;
          canvas.height = height;

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve({
                  ...imageData,
                  uri: URL.createObjectURL(blob),
                  width,
                  height,
                  size: blob.size,
                  resized: true,
                });
              } else {
                reject(new Error("Failed to resize image"));
              }
            },
            "image/jpeg",
            options.quality || 0.8
          );
        };

        img.onerror = () =>
          reject(new Error("Failed to load image for resize"));
        img.src = imageData.uri;
      } catch (error) {
        reject(error);
      }
    });
  }

  // Resize boyutları hesapla
  calculateResizeDimensions(
    originalWidth,
    originalHeight,
    maxWidth,
    maxHeight
  ) {
    let { width, height } = { width: originalWidth, height: originalHeight };

    if (maxWidth && width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }

    if (maxHeight && height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }

    return { width: Math.round(width), height: Math.round(height) };
  }

  // Image compress
  async compressImage(imageData, options) {
    // Canvas kullanarak compression
    return this.resizeImage(imageData, {
      maxWidth: imageData.width,
      maxHeight: imageData.height,
      quality: options.quality || 0.7,
    });
  }

  // Retry edilebilir hata kontrolü
  isRetryableImageError(error) {
    const retryableMessages = [
      "network error",
      "timeout",
      "failed to fetch",
      "load timeout",
      "connection",
    ];

    return retryableMessages.some((msg) =>
      error.message?.toLowerCase().includes(msg)
    );
  }

  // Image error'ını zenginleştir
  enhanceImageError(error, source, options = {}) {
    const enhancedError = new Error(error.message);
    enhancedError.originalError = error;
    enhancedError.source = source;
    enhancedError.options = options;
    enhancedError.timestamp = new Date().toISOString();
    enhancedError.userMessage = this.getUserFriendlyImageMessage(error);
    enhancedError.retryable = this.isRetryableImageError(error);

    return enhancedError;
  }

  // Kullanıcı dostu image error mesajları
  getUserFriendlyImageMessage(error) {
    if (error.message?.includes("timeout")) {
      return "Görsel yükleme zaman aşımına uğradı";
    }
    if (error.message?.includes("network")) {
      return "İnternet bağlantısı sorunu nedeniyle görsel yüklenemedi";
    }
    if (
      error.message?.includes("not found") ||
      error.message?.includes("404")
    ) {
      return "Görsel bulunamadı";
    }
    if (
      error.message?.includes("invalid") ||
      error.message?.includes("corrupt")
    ) {
      return "Görsel dosyası bozuk";
    }

    return "Görsel yüklenirken bir sorun oluştu";
  }

  // Cache key generate
  getCacheKey(source, options) {
    const sourceKey =
      typeof source === "string" ? source : "blob_" + Date.now();
    const optionsKey = JSON.stringify(options || {});
    return `${sourceKey}_${btoa(optionsKey)}`;
  }

  // Utility functions
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  calculateDelay(attempt) {
    const exponentialDelay =
      this.retryConfig.baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay;
    return Math.min(exponentialDelay + jitter, this.retryConfig.maxDelay);
  }

  // Cache temizleme
  clearCache() {
    this.loadingCache.clear();
    this.errorCache.clear();
    console.log("🧹 Image cache cleared");
  }

  // Error cache temizleme
  clearErrorCache() {
    this.errorCache.clear();
    console.log("🧹 Image error cache cleared");
  }

  // Cache durumu
  getCacheStats() {
    return {
      loadingCacheSize: this.loadingCache.size,
      errorCacheSize: this.errorCache.size,
      totalCacheSize: this.loadingCache.size + this.errorCache.size,
    };
  }

  // Configuration
  configure(config) {
    if (config.retryConfig) {
      this.retryConfig = { ...this.retryConfig, ...config.retryConfig };
    }
    if (config.qualityLevels) {
      this.qualityLevels = config.qualityLevels;
    }
  }
}

// Export singleton instance
const imageErrorHandler = new ImageErrorHandler();

export default imageErrorHandler;
