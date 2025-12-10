import { Alert } from "react-native";

export const handleFirebaseError = (error) => {
  const message = error?.message || "Beklenmeyen bir hata oluştu";
  console.error("[firebase]", message);
  Alert.alert("Hata", message);
};
