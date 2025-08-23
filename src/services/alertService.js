// AlertService - GlobalErrorHandler'dan AlertContext'e erişim için
let alertContextRef = null;

export const setAlertContextRef = (contextRef) => {
  alertContextRef = contextRef;
};

export const getAlertContextRef = () => {
  return alertContextRef;
};

export const showCustomAlert = (config) => {
  if (alertContextRef && alertContextRef.showAlert) {
    alertContextRef.showAlert(config);
    return true;
  }
  return false;
};

export const showCustomErrorAlert = (title, message, onRetry = null) => {
  if (alertContextRef && alertContextRef.showErrorAlert) {
    alertContextRef.showErrorAlert(title, message, onRetry);
    return true;
  }
  return false;
};

export const showCustomSuccessAlert = (title, message) => {
  if (alertContextRef && alertContextRef.showSuccessAlert) {
    alertContextRef.showSuccessAlert(title, message);
    return true;
  }
  return false;
};

export const showCustomWarningAlert = (title, message, onConfirm = null) => {
  if (alertContextRef && alertContextRef.showWarningAlert) {
    alertContextRef.showWarningAlert(title, message, onConfirm);
    return true;
  }
  return false;
};

export const showCustomInfoAlert = (title, message) => {
  if (alertContextRef && alertContextRef.showInfoAlert) {
    alertContextRef.showInfoAlert(title, message);
    return true;
  }
  return false;
};
