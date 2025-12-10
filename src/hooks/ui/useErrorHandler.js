import { useCallback, useEffect, useState } from "react";
import { globalErrorHandler } from "../../services/logging/globalErrorHandler";
import {
  withErrorHandling,
  withNetworkErrorHandling,
  formatErrorForUser,
} from "../../services/errorUtils";

/**
 * Hook for components to interact with the global error handler
 */
export const useErrorHandler = (componentName = "Unknown") => {
  const [lastError, setLastError] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  // Error callback to listen to global errors
  useEffect(() => {
    const errorCallback = (errorReport) => {
      setLastError(errorReport);
      setErrorCount((prev) => prev + 1);
    };

    globalErrorHandler?.addErrorCallback?.(errorCallback);

    return () => {
      globalErrorHandler?.removeErrorCallback?.(errorCallback);
    };
  }, []);

  // Manual error reporting
  const reportError = useCallback(
    (error, context = {}) => {
      // Destekleyen eski/yeni handler şekilleri için iki çağrı
      globalErrorHandler?.(error, {
        type: "component_error",
        ...context,
        component: componentName,
      });
      globalErrorHandler?.reportError?.(error, {
        ...context,
        component: componentName,
      });
    },
    [componentName]
  );

  // Network error reporting
  const reportNetworkError = useCallback(
    (error, context = {}) => {
      globalErrorHandler?.(error, {
        type: "network",
        ...context,
        component: componentName,
      });
      globalErrorHandler?.reportNetworkError?.(error, {
        ...context,
        component: componentName,
      });
    },
    [componentName]
  );

  // Firebase error reporting
  const reportFirebaseError = useCallback(
    (error, context = {}) => {
      globalErrorHandler?.(error, {
        type: "firebase",
        ...context,
        component: componentName,
      });
      globalErrorHandler?.reportFirebaseError?.(error, {
        ...context,
        component: componentName,
      });
    },
    [componentName]
  );

  // Wrapped async function with error handling
  const wrapAsync = useCallback(
    (asyncFn, context = {}) => {
      return withErrorHandling(asyncFn, {
        ...context,
        component: componentName,
      });
    },
    [componentName]
  );

  // Wrapped network function with error handling
  const wrapNetworkRequest = useCallback(
    (networkFn, context = {}) => {
      return withNetworkErrorHandling(networkFn, {
        ...context,
        component: componentName,
      });
    },
    [componentName]
  );

  // Safe async execution that returns fallback on error
  const safeAsync = useCallback(
    async (asyncFn, fallbackValue = null, context = {}) => {
      try {
        return await asyncFn();
      } catch (error) {
        reportError(error, {
          ...context,
          safeExecution: true,
        });
        return fallbackValue;
      }
    },
    [reportError]
  );

  // Format error for user display
  const getErrorMessage = useCallback((error, context = {}) => {
    return formatErrorForUser(error, context);
  }, []);

  // Clear last error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Get error statistics
  const getErrorStats = useCallback(() => {
    return globalErrorHandler?.getErrorStats?.() || {};
  }, []);

  // Get recent errors for this component
  const getComponentErrors = useCallback(() => {
    const reports = globalErrorHandler?.getErrorReports?.({
      type: "general",
      limit: 10,
    });

    if (!reports) return [];

    return reports.filter(
      (report) => report.context?.component === componentName
    );
  }, [componentName]);

  return {
    // State
    lastError,
    errorCount,

    // Manual reporting
    reportError,
    reportNetworkError,
    reportFirebaseError,

    // Function wrappers
    wrapAsync,
    wrapNetworkRequest,
    safeAsync,

    // Utilities
    getErrorMessage,
    clearError,
    getErrorStats,
    getComponentErrors,
  };
};

export default useErrorHandler;
