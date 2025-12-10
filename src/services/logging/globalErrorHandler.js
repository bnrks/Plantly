export const globalErrorHandler = (error, context = "") => {
  console.error(`[global]${context ? ` ${context}` : ""}`, error?.message || error);
};
