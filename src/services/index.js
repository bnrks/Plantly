// Services barrel
export * from "./firestore";
export * from "./firestoreService"; // backward compatibility
export * from "./authService";
export * from "./chatService";
export * from "./storageService";
export * from "./groqService";
export * from "./wsService";
export * from "./errorUtils";

// Grouped handlers and utilities
export * from "./logging/analyticsService";
export * from "./logging/globalErrorHandler";
export * from "./chat/networkErrorHandler";
export * from "./chat/webSocketErrorHandler";
export * from "./media/imageErrorHandler";
export * from "./firebase/firebaseErrorHandler";
