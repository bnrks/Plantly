import { useCallback } from "react";

/**
 * Error Boundary ile manuel hata bildirimi için hook
 * Functional component'lerde error boundary trigger etmek için kullanılır
 */
export const useErrorBoundary = () => {
  // Error throw ederek error boundary'yi tetikle
  const throwError = useCallback((error) => {
    throw error;
  }, []);

  // Async error'ları boundary'ye bildirmek için
  const reportError = useCallback((error, context = {}) => {
    // Error'u setTimeout ile throw et ki error boundary yakalasın
    setTimeout(() => {
      throw new Error(`Async Error: ${error.message || error.toString()}`);
    }, 0);
  }, []);

  // Promise rejection'ları için
  const handleAsyncError = useCallback(
    (asyncFn, context = {}) => {
      return async (...args) => {
        try {
          return await asyncFn(...args);
        } catch (error) {
          console.error("useErrorBoundary - Async error caught:", error);

          // Context bilgilerini ekle
          error.context = context;
          error.isAsync = true;

          // Error boundary'ye bildir
          reportError(error, context);

          // Error'u tekrar throw et
          throw error;
        }
      };
    },
    [reportError]
  );

  // Network request'ler için özel wrapper
  const wrapNetworkRequest = useCallback(
    (networkFn, requestContext = {}) => {
      return handleAsyncError(networkFn, {
        type: "network",
        ...requestContext,
      });
    },
    [handleAsyncError]
  );

  // Database operations için wrapper
  const wrapDatabaseOperation = useCallback(
    (dbFn, operationContext = {}) => {
      return handleAsyncError(dbFn, {
        type: "database",
        ...operationContext,
      });
    },
    [handleAsyncError]
  );

  return {
    throwError,
    reportError,
    handleAsyncError,
    wrapNetworkRequest,
    wrapDatabaseOperation,
  };
};

export default useErrorBoundary;
