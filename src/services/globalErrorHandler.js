// Global error handler for handling various application errors
class GlobalErrorHandler {
  constructor() {
    this.errorReports = [];
  }

  // Report WebSocket errors
  reportWebSocketError(error, context = {}) {
    console.error("🚨 WebSocket Error:", error);
    console.error("📍 Context:", context);

    // In a production app, you might want to send this to a crash reporting service
    // like Sentry, Crashlytics, etc.
    this.errorReports.push({
      type: "websocket",
      error: error.message || error.toString(),
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Report general application errors
  reportError(error, context = {}) {
    console.error("🚨 Application Error:", error);
    console.error("📍 Context:", context);

    this.errorReports.push({
      type: "general",
      error: error.message || error.toString(),
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Report network errors
  reportNetworkError(error, context = {}) {
    console.error("🚨 Network Error:", error);
    console.error("📍 Context:", context);

    this.errorReports.push({
      type: "network",
      error: error.message || error.toString(),
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // Get all error reports
  getErrorReports() {
    return this.errorReports;
  }

  // Clear error reports
  clearErrorReports() {
    this.errorReports = [];
  }
}

// Export singleton instance
const globalErrorHandler = new GlobalErrorHandler();
export default globalErrorHandler;
