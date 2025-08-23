// Error utility functions for common error handling patterns
import globalErrorHandler from "./globalErrorHandler";

/**
 * Async function wrapper that automatically reports errors
 */
export const withErrorHandling = (asyncFn, context = {}) => {
  return async (...args) => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      globalErrorHandler.reportError(error, {
        ...context,
        functionName: asyncFn.name || "anonymous",
        arguments: __DEV__ ? args : "hidden",
      });
      throw error; // Re-throw so calling code can handle it
    }
  };
};

/**
 * Network request wrapper with automatic error reporting
 */
export const withNetworkErrorHandling = (networkFn, context = {}) => {
  return async (...args) => {
    try {
      return await networkFn(...args);
    } catch (error) {
      globalErrorHandler.reportNetworkError(error, {
        ...context,
        url: context.url || args[0],
        method: context.method || "unknown",
      });
      throw error;
    }
  };
};

/**
 * Firebase operation wrapper with automatic error reporting
 */
export const withFirebaseErrorHandling = (firebaseFn, context = {}) => {
  return async (...args) => {
    try {
      return await firebaseFn(...args);
    } catch (error) {
      globalErrorHandler.reportFirebaseError(error, {
        ...context,
        operation: context.operation || firebaseFn.name,
      });
      throw error;
    }
  };
};

/**
 * Safe function execution that doesn't throw
 */
export const safeExecute = async (fn, fallbackValue = null, context = {}) => {
  try {
    return await fn();
  } catch (error) {
    globalErrorHandler.reportError(error, {
      ...context,
      safeExecution: true,
    });
    return fallbackValue;
  }
};

/**
 * Retry function with exponential backoff
 */
export const withRetry = (fn, maxAttempts = 3, baseDelay = 1000) => {
  return async (...args) => {
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error;

        if (attempt === maxAttempts) {
          globalErrorHandler.reportError(error, {
            retryAttempts: maxAttempts,
            finalAttempt: true,
          });
          break;
        }

        // Exponential backoff delay
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        console.log(
          `Retry attempt ${attempt} failed, retrying in ${delay}ms...`
        );
      }
    }

    throw lastError;
  };
};

/**
 * Debounced error reporting (prevent spam)
 */
export const createDebouncedErrorReporter = (delay = 1000) => {
  const errorCounts = new Map();

  return (error, context = {}) => {
    const errorKey = error.message || error.toString();
    const now = Date.now();

    if (!errorCounts.has(errorKey)) {
      errorCounts.set(errorKey, { count: 1, lastReport: now });
      globalErrorHandler.reportError(error, context);
    } else {
      const errorData = errorCounts.get(errorKey);
      errorData.count++;

      if (now - errorData.lastReport > delay) {
        globalErrorHandler.reportError(error, {
          ...context,
          duplicateCount: errorData.count,
        });
        errorData.lastReport = now;
        errorData.count = 1;
      }
    }
  };
};

/**
 * Component error boundary trigger helper
 */
export const triggerErrorBoundary = (error, context = {}) => {
  // Report to global handler first
  globalErrorHandler.reportError(error, {
    ...context,
    triggeredBoundary: true,
  });

  // Throw error to trigger React Error Boundary
  setTimeout(() => {
    throw error;
  }, 0);
};

/**
 * Error classification helpers
 */
export const isNetworkError = (error) => {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("network") ||
    message.includes("fetch") ||
    message.includes("timeout") ||
    error.code === "NETWORK_ERROR"
  );
};

export const isAuthError = (error) => {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("auth") ||
    message.includes("unauthorized") ||
    message.includes("permission") ||
    error.code?.startsWith("auth/")
  );
};

export const isValidationError = (error) => {
  const message = error.message?.toLowerCase() || "";
  return (
    message.includes("validation") ||
    message.includes("invalid") ||
    message.includes("required")
  );
};

/**
 * Error formatting for user display
 */
export const formatErrorForUser = (error, context = {}) => {
  if (isNetworkError(error)) {
    return "İnternet bağlantınızı kontrol edin ve tekrar deneyin.";
  }

  if (isAuthError(error)) {
    return "Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.";
  }

  if (isValidationError(error)) {
    return "Lütfen gerekli alanları doğru şekilde doldurun.";
  }

  return (
    context.userMessage || "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin."
  );
};
