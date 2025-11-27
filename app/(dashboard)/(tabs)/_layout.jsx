// app/(dashboard)/(tabs)/_layout.jsx
import { Tabs, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Colors } from "../../../constants/Colors";
import { useContext, useMemo, useState } from "react";
import { ThemeContext } from "../../../src/context/ThemeContext";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TAB_ORDER = ["home", "plants", "menu", "addPlant", "chat"];
const ROUTE_ICONS = {
  home: "home-outline",
  plants: "leaf-outline",
  addPlant: "add",
};
const TAB_BAR_HEIGHT = 68;

export default function DashboardTabs() {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const menuItems = useMemo(
    () => [
      {
        key: "education",
        label: t('menu.education'),
        icon: "school-outline",
        action: () => router.push("/(dashboard)/education"),
      },
      {
        key: "profile",
        label: t('menu.profile'),
        icon: "person-outline",
        action: () => router.push("/(dashboard)/profile"),
      },
      {
        key: "notifications",
        label: t('menu.notifications'),
        icon: "notifications-outline",
        action: () => {},
      },
      {
        key: "care",
        label: t('menu.care'),
        icon: "leaf-outline",
        action: () => {},
      },
      {
        key: "assistant",
        label: t('menu.assistant'),
        icon: "color-wand-outline",
        action: () => {},
      },
      {
        key: "about",
        label: t('menu.about'),
        icon: "information-circle-outline",
        action: () => {},
      },
    ],
    [router, t]
  );

  const closeMenu = () => setMenuVisible(false);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarHideOnKeyboard: true,
        }}
        tabBar={(props) => (
          <CustomTabBar
            {...props}
            theme={theme}
            selectedTheme={selectedTheme}
            menuVisible={menuVisible}
            onMenuPress={() => setMenuVisible(true)}
          />
        )}
      >
        <Tabs.Screen name="home" />
        <Tabs.Screen name="plants" />
        <Tabs.Screen name="menu" options={{ href: null }} />
        <Tabs.Screen name="addPlant" />
        <Tabs.Screen name="chat" />
      </Tabs>

      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContainer}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeMenu}
            accessibilityRole="button"
            accessibilityLabel="Menuyu kapat"
          />
          <View
            style={[
              styles.popoverContainer,
              {
                marginBottom:
                  Math.max(insets.bottom + TAB_BAR_HEIGHT + 5, insets.bottom + 36),
              },
            ]}
          >
            <View
              style={[
                styles.popover,
                {
                  backgroundColor: theme.secondBg,
                  borderColor:
                    selectedTheme === "dark"
                      ? "rgba(255,255,255,0.16)"
                      : "rgba(0,0,0,0.08)",
                  shadowColor:
                    selectedTheme === "dark" ? "#050505" : "rgba(0,0,0,0.2)",
                },
              ]}
            >
              <View
                style={[styles.popoverAnchor, { backgroundColor: theme.secondBg }]}
              />
              <View style={styles.popoverGrid}>
                {menuItems.map((item) => (
                  <TouchableOpacity
                    key={item.key}
                    activeOpacity={0.85}
                    style={[
                      styles.popoverItem,
                      { backgroundColor: theme.fourthBg },
                    ]}
                    onPress={() => {
                      closeMenu();
                      item.action?.();
                    }}
                  >
                    <View style={styles.popoverItemIconWrapper}>
                      <Ionicons name={item.icon} size={22} color={theme.title} />
                    </View>
                    <Text style={[styles.popoverItemText, { color: theme.title }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const CustomTabBar = ({
  state,
  descriptors,
  navigation,
  theme,
  selectedTheme,
  menuVisible,
  onMenuPress,
}) => {
  const insets = useSafeAreaInsets();
  const inactiveColor =
    selectedTheme === "dark" ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)";

  return (
    <View
      style={[
        styles.tabContainer,
        { paddingBottom: Math.max(insets.bottom, 12) },
      ]}
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: theme.thirdBg,
            borderColor:
              selectedTheme === "dark"
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)",
            shadowColor: selectedTheme === "dark" ? "#050505" : "#000000",
          },
        ]}
      >
        {TAB_ORDER.map((routeName) => {
          const routeIndex = state.routes.findIndex(
            (route) => route.name === routeName
          );
          if (routeIndex === -1) {
            return null;
          }

          const route = state.routes[routeIndex];
          const { options } = descriptors[route.key];
          const isFocused = state.index === routeIndex;

          if (routeName === "menu") {
            return (
              <View key={route.key} style={styles.menuSlot}>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={
                    options.tabBarAccessibilityLabel ?? "Menuyu ac"
                  }
                  accessibilityState={{ expanded: menuVisible }}
                  onPress={onMenuPress}
                  activeOpacity={0.85}
                  style={[
                    styles.menuButton,
                    {
                      backgroundColor: theme.secondBg,
                      shadowColor:
                        selectedTheme === "dark" ? "#0f0f0f" : "#000000",
                    },
                    menuVisible && styles.menuButtonActive,
                  ]}
                >
                  <Ionicons name="menu" size={24} color={theme.thirdBg} />
                </TouchableOpacity>
              </View>
            );
          }

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const onLongPress = () =>
            navigation.emit({
              type: "tabLongPress",
              target: route.key,
            });

          const iconName = ROUTE_ICONS[routeName];
          const isChat = routeName === "chat";
          const selectedBackground =
            selectedTheme === "dark"
              ? "rgba(255,255,255,0.18)"
              : theme.secondBg;
          const selectedBorder =
            selectedTheme === "dark"
              ? "rgba(255,255,255,0.25)"
              : "rgba(0,0,0,0.05)";

          const circleStyles = [styles.iconCircle];
          if (isFocused) {
            circleStyles.push(styles.iconCircleSelected);
            circleStyles.push({
              backgroundColor: selectedBackground,
              borderColor: selectedBorder,
            });
          }

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabItem}
              activeOpacity={0.85}
            >
              <View style={circleStyles}>
                {isChat ? (
                  <Image
                    source={require("../../../assets/plantly-asistant.png")}
                    style={{
                      width: isFocused ? 38 : 36,
                      height: isFocused ? 38 : 36,
                    }}
                    resizeMode="contain"
                  />
                ) : (
                  <Ionicons
                    name={iconName}
                    size={24}
                    color={isFocused ? theme.title : inactiveColor}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tabContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    paddingHorizontal: 16,
    zIndex: 20,
  },
  tabBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderWidth: 1,
    width: "100%",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconCircleSelected: {
    borderRadius: 22,
    borderWidth: 1.5,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  menuSlot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  menuButtonActive: {
    transform: [{ scale: 0.96 }],
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  popoverContainer: {
    width: "100%",
    alignItems: "center",
  },
  popover: {
    minWidth: 280,
    maxWidth: 340,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 18,
    borderWidth: 1,
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 14,
  },
  popoverAnchor: {
    alignSelf: "center",
    width: 32,
    height: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    marginBottom: 8,
  },
  popoverGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  popoverItem: {
    width: "30%",
    minWidth: 80,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  popoverItemIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  popoverItemText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
});



