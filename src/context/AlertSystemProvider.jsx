import React, { useEffect } from "react";
import { AlertProvider } from "./AlertContext";
import CustomAlert from "../../components/CustomAlert";
import { useAlert } from "./AlertContext";
import { setAlertContextRef } from "../services/alertService";

// AlertManager bileşeni - CustomAlert'i yönetir
const AlertManager = () => {
  const { alertConfig, handleConfirm, handleCancel } = useAlert();
  const alertContext = useAlert();

  // Context referansını global service'e kaydet
  useEffect(() => {
    setAlertContextRef(alertContext);

    return () => {
      setAlertContextRef(null);
    };
  }, [alertContext]);

  return (
    <CustomAlert
      visible={alertConfig.visible}
      type={alertConfig.type}
      title={alertConfig.title}
      message={alertConfig.message}
      confirmText={alertConfig.confirmText}
      cancelText={alertConfig.cancelText}
      showCancel={alertConfig.showCancel}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

// Ana wrapper bileşeni
export const AlertSystemProvider = ({ children }) => {
  return (
    <AlertProvider>
      {children}
      <AlertManager />
    </AlertProvider>
  );
};
