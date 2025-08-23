// Error Handlers Index - Tüm özelleşmiş error handler'ları tek yerden export et
export { default as globalErrorHandler } from "./globalErrorHandler";
export { default as networkErrorHandler } from "./networkErrorHandler";
export { default as webSocketErrorHandler } from "./webSocketErrorHandler";
export { default as firebaseErrorHandler } from "./firebaseErrorHandler";
export { default as imageErrorHandler } from "./imageErrorHandler";

// Convenience wrapper for common operations
export const ErrorHandlers = {
  global: () => import("./globalErrorHandler").then((m) => m.default),
  network: () => import("./networkErrorHandler").then((m) => m.default),
  websocket: () => import("./webSocketErrorHandler").then((m) => m.default),
  firebase: () => import("./firebaseErrorHandler").then((m) => m.default),
  image: () => import("./imageErrorHandler").then((m) => m.default),
};

// Quick access functions
export const withErrorHandling = {
  // Network operations
  fetch: async (url, options = {}) => {
    const { networkErrorHandler } = await import("./networkErrorHandler");
    return networkErrorHandler.fetchWithErrorHandling(url, options);
  },

  // Firebase operations
  firestore: async (operation, context = {}) => {
    const { firebaseErrorHandler } = await import("./firebaseErrorHandler");
    return firebaseErrorHandler.wrapFirebaseOperation(operation, context);
  },

  // Image operations
  loadImage: async (source, options = {}) => {
    const { imageErrorHandler } = await import("./imageErrorHandler");
    return imageErrorHandler.loadImage(source, options);
  },

  // WebSocket operations
  connectWebSocket: async (url, protocols = []) => {
    const { webSocketErrorHandler } = await import("./webSocketErrorHandler");
    return webSocketErrorHandler.connectTo(url, protocols);
  },
};

// Initialize all error handlers
export const initializeErrorHandlers = () => {
  console.log("🚀 Initializing all error handlers...");

  // Global handler is already initialized via singleton
  // Others initialize on first use

  console.log("✅ Error handlers ready");
};
