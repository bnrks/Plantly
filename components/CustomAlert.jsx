import React, { useContext } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ThemeContext } from "../src/context/ThemeContext";
import { Colors } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

export default function CustomAlert({
  visible,
  type = "info", // "success", "error", "warning", "info"
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Tamam",
  cancelText = "İptal",
  showCancel = false,
}) {
  const { theme: currentTheme } = useContext(ThemeContext);
  const theme = Colors[currentTheme] ?? Colors.light;

  const getIconAndColor = () => {
    switch (type) {
      case "success":
        return { icon: "checkmark-circle", color: "#4CAF50" };
      case "error":
        return { icon: "close-circle", color: theme.danger };
      case "warning":
        return { icon: "warning", color: "#FF9800" };
      default:
        return { icon: "information-circle", color: Colors.primary };
    }
  };

  const { icon, color } = getIconAndColor();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View
          style={[styles.alertContainer, { backgroundColor: theme.secondBg }]}
        >
          {/* Icon */}
          <View
            style={[styles.iconContainer, { backgroundColor: color + "20" }]}
          >
            <Ionicons name={icon} size={40} color={color} />
          </View>

          {/* Title */}
          {title && (
            <Text style={[styles.title, { color: theme.title }]}>{title}</Text>
          )}

          {/* Message */}
          {message && (
            <Text style={[styles.message, { color: theme.text }]}>
              {message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            {showCancel && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  { borderColor: theme.text + "30" },
                ]}
                onPress={onCancel}
              >
                <Text style={[styles.buttonText, { color: theme.text }]}>
                  {cancelText}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button,
                styles.confirmButton,
                { backgroundColor: color },
                showCancel && styles.buttonMargin,
              ]}
              onPress={onConfirm}
            >
              <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  alertContainer: {
    width: width * 0.85,
    maxWidth: 400,
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
    fontFamily: "System",
  },
  message: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 25,
    fontFamily: "System",
  },
  buttonContainer: {
    flexDirection: "row",
    width: "100%",
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  confirmButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonMargin: {
    marginLeft: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    fontFamily: "System",
  },
});
