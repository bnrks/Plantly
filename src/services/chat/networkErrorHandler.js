export const handleNetworkError = (error) => {
  console.error("[network]", error?.message || error);
};
