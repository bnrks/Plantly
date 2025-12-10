export const handleWebSocketError = (error) => {
  console.error("[websocket]", error?.message || error);
};
