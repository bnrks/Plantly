import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  block: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  assistantContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  assistantImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    opacity: 0.7,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    width: "100%",
    backgroundColor: "#e0e0e0",
    marginVertical: 16,
  },
  text: {
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  tipsContainer: {
    marginBottom: 24,
    width: "100%",
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  tipText: {
    marginLeft: 10,
  },
  buttonContainer: {
    gap: 12,
    width: "100%",
  },
  button: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  previewCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    width: "100%",
  },
  previewTitle: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: "center",
  },
  preview: {
    width: "100%",
    height: 300,
    borderRadius: 12,
    marginBottom: 16,
  },
  previewText: {
    textAlign: "center",
    marginBottom: 20,
  },
  actionRow: {
    gap: 12,
    width: "100%",
  },
});
