import React, { createContext, useContext, useState } from "react";

const AlertContext = createContext();

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider = ({ children }) => {
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    type: "info", // success, error, warning, info
    title: "",
    message: "",
    confirmText: "Tamam",
    cancelText: "İptal",
    showCancel: false,
    onConfirm: null,
    onCancel: null,
  });

  const showAlert = ({
    type = "info",
    title,
    message,
    confirmText = "Tamam",
    cancelText = "İptal",
    showCancel = false,
    onConfirm = null,
    onCancel = null,
  }) => {
    setAlertConfig({
      visible: true,
      type,
      title,
      message,
      confirmText,
      cancelText,
      showCancel,
      onConfirm,
      onCancel,
    });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  const handleConfirm = () => {
    if (alertConfig.onConfirm) {
      alertConfig.onConfirm();
    }
    hideAlert();
  };

  const handleCancel = () => {
    if (alertConfig.onCancel) {
      alertConfig.onCancel();
    }
    hideAlert();
  };

  // Error handling için özel metodlar
  const showErrorAlert = (title, message, onRetry = null) => {
    showAlert({
      type: "error",
      title,
      message,
      confirmText: onRetry ? "Tekrar Dene" : "Tamam",
      cancelText: "İptal",
      showCancel: !!onRetry,
      onConfirm: onRetry,
    });
  };

  const showSuccessAlert = (title, message) => {
    showAlert({
      type: "success",
      title,
      message,
      confirmText: "Tamam",
      showCancel: false,
    });
  };

  const showWarningAlert = (title, message, onConfirm = null) => {
    showAlert({
      type: "warning",
      title,
      message,
      confirmText: "Anladım",
      showCancel: false,
      onConfirm,
    });
  };

  const showInfoAlert = (title, message) => {
    showAlert({
      type: "info",
      title,
      message,
      confirmText: "Tamam",
      showCancel: false,
    });
  };

  const value = {
    showAlert,
    hideAlert,
    showErrorAlert,
    showSuccessAlert,
    showWarningAlert,
    showInfoAlert,
    alertConfig,
    handleConfirm,
    handleCancel,
  };

  return (
    <AlertContext.Provider value={value}>{children}</AlertContext.Provider>
  );
};
