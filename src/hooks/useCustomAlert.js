import { useState } from "react";

export const useCustomAlert = () => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info",
    title: "",
    message: "",
    onConfirm: null,
    onCancel: null,
    confirmText: "Tamam",
    cancelText: "İptal",
    showCancel: false,
  });

  const showAlert = ({
    type = "info",
    title,
    message,
    onConfirm,
    onCancel,
    confirmText = "Tamam",
    cancelText = "İptal",
    showCancel = false,
  }) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      onConfirm: onConfirm || hideAlert,
      onCancel: onCancel || hideAlert,
      confirmText,
      cancelText,
      showCancel,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  // Kolaylık metodları
  const showSuccess = (title, message, onConfirm) => {
    showAlert({
      type: "success",
      title,
      message,
      onConfirm,
    });
  };

  const showError = (title, message, onConfirm) => {
    showAlert({
      type: "error",
      title,
      message,
      onConfirm,
    });
  };

  const showWarning = (title, message, onConfirm) => {
    showAlert({
      type: "warning",
      title,
      message,
      onConfirm,
    });
  };

  const showInfo = (title, message, onConfirm) => {
    showAlert({
      type: "info",
      title,
      message,
      onConfirm,
    });
  };

  const showConfirm = (title, message, onConfirm, onCancel) => {
    showAlert({
      type: "warning",
      title,
      message,
      onConfirm,
      onCancel,
      showCancel: true,
    });
  };

  return {
    alertConfig,
    showAlert,
    hideAlert,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showConfirm,
  };
};
