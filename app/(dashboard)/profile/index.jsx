import { StyleSheet, View, Image } from "react-native";
import { useContext } from "react";
import { Ionicons } from "@expo/vector-icons";
import ThemedView from "../../../components/ThemedView";
import ThemedCard from "../../../components/ThemedCard";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import Header from "../../../components/Header";
import BackButton from "../../../components/BackButton";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";

const DUMMY_USER = {
  name: "Deneme Kullanicisi",
  email: "deneme@example.com",
  joinedAt: "12 Mart 2024",
  streak: 7,
  favoritePlant: "Aloe Vera",
  completedModules: 3,
};

const QUICK_ACTIONS = [
  {
    key: "editProfile",
    title: "Profili Duzenle",
    description: "Bilgilerini guncelle",
    icon: "create-outline",
  },
  {
    key: "notifications",
    title: "Bildirim Ayarlari",
    description: "Hatirlaticilari ozellestir",
    icon: "notifications-outline",
  },
  {
    key: "achievements",
    title: "Basarilarim",
    description: "Kazandigin rozetleri incele",
    icon: "trophy-outline",
  },
];

export default function ProfileScreen() {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;

  return (
    <ThemedView
      style={[styles.container, { backgroundColor: theme.background }]}
      safe
    >
      <View style={styles.topBar}>
        <BackButton />
      </View>
      <Header style={styles.headerImage} />

      <ThemedCard
        style={[
          styles.profileCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <View style={styles.avatarWrapper}>
          <Image
            source={require("../../../assets/plantly-logo.png")}
            style={styles.avatar}
            resizeMode="contain"
          />
        </View>
        <ThemedTitle style={styles.userName}>{DUMMY_USER.name}</ThemedTitle>
        <ThemedText style={[styles.email, { color: theme.text }]}>
          {DUMMY_USER.email}
        </ThemedText>

        <View style={styles.metaRow}>
          <MetaItem
            icon="calendar-outline"
            label="Aramiza katildi"
            value={DUMMY_USER.joinedAt}
            color={theme.thirdBg}
          />
          <MetaItem
            icon="flame-outline"
            label="Sulama serisi"
            value={`${DUMMY_USER.streak} gun`}
            color={theme.thirdBg}
          />
        </View>
      </ThemedCard>

      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>Bakim Ozeti</ThemedTitle>
        <View style={styles.summaryRow}>
          <SummaryItem
            icon="leaf-outline"
            label="Favori Bitki"
            value={DUMMY_USER.favoritePlant}
            color={theme.thirdBg}
          />
          <SummaryItem
            icon="reader-outline"
            label="Tamamlanan Egitim"
            value={`${DUMMY_USER.completedModules} modul`}
            color={theme.thirdBg}
          />
        </View>
      </ThemedCard>

      <ThemedCard
        style={[
          styles.sectionCard,
          { backgroundColor: theme.secondBg },
        ]}
      >
        <ThemedTitle style={styles.sectionTitle}>Hizli Islemler</ThemedTitle>
        {QUICK_ACTIONS.map((action, idx) => (
          <View
            key={action.key}
            style={[
              styles.actionRow,
              {
                borderBottomWidth: idx === QUICK_ACTIONS.length - 1 ? 0 : StyleSheet.hairlineWidth,
                borderBottomColor:
                  selectedTheme === "dark"
                    ? "rgba(255,255,255,0.12)"
                    : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            <View
              style={[
                styles.actionIconWrapper,
                { backgroundColor: theme.fourthBg },
              ]}
            >
              <Ionicons name={action.icon} size={20} color={theme.thirdBg} />
            </View>
            <View style={{ flex: 1 }}>
              <ThemedTitle style={styles.actionTitle}>
                {action.title}
              </ThemedTitle>
              <ThemedText style={[styles.actionDescription, { color: theme.text }]}>
                {action.description}
              </ThemedText>
            </View>
            <Ionicons
              name="chevron-forward"
              size={18}
              color={theme.text}
            />
          </View>
        ))}
      </ThemedCard>
    </ThemedView>
  );
}

function MetaItem({ icon, label, value, color }) {
  return (
    <View style={styles.metaItem}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={{ marginLeft: 8 }}>
        <ThemedText style={styles.metaLabel}>{label}</ThemedText>
        <ThemedTitle style={styles.metaValue}>{value}</ThemedTitle>
      </View>
    </View>
  );
}

function SummaryItem({ icon, label, value, color }) {
  return (
    <View style={styles.summaryItem}>
      <View
        style={[
          styles.summaryIconWrapper,
          { backgroundColor: color },
        ]}
      >
        <Ionicons name={icon} size={20} color="#ffffff" />
      </View>
      <ThemedText style={styles.summaryLabel}>{label}</ThemedText>
      <ThemedTitle style={styles.summaryValue}>{value}</ThemedTitle>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 8,
  },
  headerImage: {
    marginTop: 0,
    marginBottom: 12,
  },
  profileCard: {
    alignItems: "center",
    paddingVertical: 28,
    paddingHorizontal: 24,
    borderRadius: 24,
  },
  avatarWrapper: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: "rgba(83,115,84,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 54,
    height: 54,
  },
  userName: {
    fontSize: 22,
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 8,
    gap: 12,
  },
  metaItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(83,115,84,0.08)",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  metaLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  metaValue: {
    fontSize: 14,
  },
  sectionCard: {
    paddingVertical: 20,
    paddingHorizontal: 18,
    borderRadius: 22,
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 14,
  },
  summaryItem: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    backgroundColor: "rgba(83,115,84,0.08)",
  },
  summaryIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
  },
  actionIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 2,
  },
  actionTitle: {
    fontSize: 16,
  },
  actionDescription: {
    fontSize: 13,
    marginTop: 4,
  },
});
