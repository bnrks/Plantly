import { useState, useRef, useEffect, useContext } from "react";
import {
  StyleSheet,
  View,
  Text,
  Image,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useRouter, Redirect } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { checkUserProfileComplete } from "../src/services/firestoreService";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { ThemeContext } from "../src/context/ThemeContext";
import ThemedText from "../components/ThemedText";
import ThemedButton from "../components/ThemedButton";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";
import CustomAlert from "../components/CustomAlert";

const { width, height } = Dimensions.get("window");

const getSlides = (t) => [
  {
    id: "1",
    title: t("onboarding.slide1Title"),
    description: t("onboarding.slide1Desc"),
    image: require("../assets/onboarding-2.png"),
  },
  {
    id: "2",
    title: t("onboarding.slide2Title"),
    description: t("onboarding.slide2Desc"),
    image: require("../assets/onboarding-4.png"),
  },
  {
    id: "3",
    title: t("onboarding.slide3Title"),
    description: t("onboarding.slide3Desc"),
    image: require("../assets/onboarding-3.png"),
  },
  {
    id: "4",
    title: t("onboarding.slide4Title"),
    description: t("onboarding.slide4Desc"),
    image: require("../assets/onboarding-1.png"),
  },
];

const Index = () => {
  // State hooks
  const [showSplash, setShowSplash] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [splashComplete, setSplashComplete] = useState(false);
  const [profileCheckDone, setProfileCheckDone] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  const [connectionAlertVisible, setConnectionAlertVisible] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  // Ref hooks
  const flatListRef = useRef(null);
  const splashOpacity = useRef(new Animated.Value(0)).current;
  const splashScale = useRef(new Animated.Value(0.3)).current;
  const loginButtonOpacity = useRef(new Animated.Value(0)).current;
  const loginButtonTranslate = useRef(new Animated.Value(50)).current;
  const signupButtonOpacity = useRef(new Animated.Value(0)).current;
  const signupButtonTranslate = useRef(new Animated.Value(50)).current;

  // Context hooks
  const { user, loading } = useContext(AuthContext);
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const router = useRouter();
  const { t } = useTranslation();

  const slides = getSlides(t);

  // Internet baglantisi kontrolu
  useEffect(() => {
    const handleState = (state) => {
      const offline =
        !state.isConnected || state.isInternetReachable === false;
      setIsOffline(offline);
      setConnectionAlertVisible(offline);
    };

    NetInfo.fetch().then(handleState).catch((err) => {
      console.error("NetInfo fetch error:", err);
      setIsOffline(true);
      setConnectionAlertVisible(true);
    });

    const unsubscribe = NetInfo.addEventListener(handleState);
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Splash animasyonlari
  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(splashScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.out(Easing.back(1.5)),
        }),
      ]),
      Animated.delay(1000),
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowSplash(false);
      setSplashComplete(true);
    });
  }, []);

  // Firebase'den kullanici durumu log
  useEffect(() => {
    if (user) {
      console.log("User is logged in");
    } else {
      console.log("User is not logged in");
    }
  }, [user]);

  // Profil tam mi?
  useEffect(() => {
    const checkProfile = async () => {
      if (user && splashComplete && !loading) {
        try {
          const profileStatus = await checkUserProfileComplete(user.uid);

          if (!profileStatus.isComplete) {
            if (profileStatus.missingFields.includes("displayName")) {
              setRedirectPath(`/enterUsername?userId=${user.uid}`);
            } else if (profileStatus.missingFields.includes("name")) {
              setRedirectPath(`/enterName?userId=${user.uid}`);
            } else {
              setRedirectPath("/home");
            }
          } else {
            setRedirectPath("/home");
          }
        } catch (error) {
          console.error("Profil kontrol hatasi:", error);
          setRedirectPath("/home");
        }
        setProfileCheckDone(true);
      }
    };

    checkProfile();
  }, [user, splashComplete, loading]);

  // Buton animasyonlari
  useEffect(() => {
    if (currentSlideIndex === slides.length - 1) {
      Animated.timing(loginButtonOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();

      Animated.timing(loginButtonTranslate, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start();

      setTimeout(() => {
        Animated.timing(signupButtonOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();

        Animated.timing(signupButtonTranslate, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }, 200);
    } else {
      loginButtonOpacity.setValue(0);
      loginButtonTranslate.setValue(50);
      signupButtonOpacity.setValue(0);
      signupButtonTranslate.setValue(50);
    }
  }, [currentSlideIndex]);

  const handleRetryConnection = async () => {
    try {
      const state = await NetInfo.fetch();
      const offline =
        !state.isConnected || state.isInternetReachable === false;
      setIsOffline(offline);
      setConnectionAlertVisible(offline);
    } catch (error) {
      console.error("Connection check error:", error);
      setIsOffline(true);
      setConnectionAlertVisible(true);
    }
  };

  const goToNextSlide = () => {
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < slides.length) {
      flatListRef.current.scrollToIndex({ index: nextIndex });
      setCurrentSlideIndex(nextIndex);
    }
  };

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentSlideIndex(index);
  };

  const renderSlide = ({ item }) => {
    return (
      <View style={[styles.slide, { backgroundColor: theme.mainBg }]}>
        <Image source={item.image} style={styles.image} resizeMode="contain" />
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: theme.primary }]}>
            {item.title}
          </Text>
          <Text style={[styles.description, { color: theme.textSecondary }]}>
            {item.description}
          </Text>
        </View>
      </View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentSlideIndex ? theme.accent : theme.border,
                width: index === currentSlideIndex ? 20 : 10,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const connectionAlert = (
    <CustomAlert
      visible={connectionAlertVisible}
      type="error"
      title="Internet baglantisi yok"
      message="Lutfen internet baglantinizi kontrol edip tekrar deneyin."
      onConfirm={handleRetryConnection}
      confirmText="Tekrar dene"
      showCancel={false}
    />
  );

  // Splash
  if (showSplash) {
    return (
      <>
        <LinearGradient
          style={[styles.container, styles.splashContainer]}
          colors={["#A8E6CF", "#DCEDC1", "#FFFFFF"]}
          start={{ x: 0, y: 0.001 }}
          end={{ x: 0, y: 1 }}
        >
          <Animated.Image
            source={require("../assets/plantly-logo.png")}
            style={[
              styles.splashLogo,
              {
                opacity: splashOpacity,
                transform: [{ scale: splashScale }],
              },
            ]}
            resizeMode="contain"
          />
        </LinearGradient>
        {connectionAlert}
      </>
    );
  }

  // Loading
  if (loading && splashComplete) {
    return (
      <>
        <View
          style={[styles.loadingContainer, { backgroundColor: theme.mainBg }]}
        >
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
        {connectionAlert}
      </>
    );
  }

  // Logged in user check (do NOT redirect when offline)
  if (splashComplete && !loading && user) {
    // If offline, block redirects and show connection alert
    if (isOffline) {
      return (
        <>
          <View
            style={[styles.loadingContainer, { backgroundColor: theme.mainBg }]}
          >
            <ActivityIndicator size="large" color={theme.accent} />
          </View>
          {connectionAlert}
        </>
      );
    }

    if (profileCheckDone && redirectPath) {
      return (
        <>
          <Redirect href={redirectPath} />
          {connectionAlert}
        </>
      );
    }
    return (
      <>
        <View
          style={[styles.loadingContainer, { backgroundColor: theme.mainBg }]}
        >
          <ActivityIndicator size="large" color={theme.accent} />
        </View>
        {connectionAlert}
      </>
    );
  }

  // Onboarding
  return (
    <>
      <LinearGradient
        style={styles.container}
        colors={["#A8E6CF", "#DCEDC1", "#FFFFFF"]}
        start={{ x: 0, y: 0.001 }}
        end={{ x: 0, y: 1 }}
      >
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          onScroll={handleScroll}
          keyExtractor={(item) => item.id}
          style={{ color: theme.text }}
        />

        {renderDots()}

        <View style={styles.footer}>
          {currentSlideIndex === slides.length - 1 ? (
            <View style={styles.buttonContainer}>
              <Animated.View
                style={{
                  flex: 1,
                  opacity: loginButtonOpacity,
                  transform: [{ translateY: loginButtonTranslate }],
                  marginHorizontal: 8,
                }}
              >
                <ThemedButton
                  title={t("onboarding.login")}
                  onPress={() => router.push("/login")}
                  style={[styles.button, { backgroundColor: Colors.primary }]}
                  textStyle={{ color: "#FFFFFF" }}
                />
              </Animated.View>

              <Animated.View
                style={{
                  flex: 1,
                  opacity: signupButtonOpacity,
                  transform: [{ translateY: signupButtonTranslate }],
                  marginHorizontal: 8,
                }}
              >
                <ThemedButton
                  title={t("onboarding.register")}
                  onPress={() => router.push("/register")}
                  style={[
                    styles.button,
                    styles.secondaryButton,
                    { borderColor: theme.accent },
                  ]}
                  textStyle={{ color: theme.accent }}
                />
              </Animated.View>
            </View>
          ) : (
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => router.push("/login")}
                style={styles.skipButton}
              >
                <ThemedText style={styles.skipText}>
                  {t("onboarding.skip")}
                </ThemedText>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={goToNextSlide}
                style={[styles.nextButton, { backgroundColor: theme.accent }]}
              >
                <Ionicons name="arrow-forward" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </LinearGradient>
      {connectionAlert}
    </>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  slide: {
    width,
    height,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
    marginBottom: 30,
  },
  textContainer: {
    alignItems: "center",
    marginTop: 20,
    marginBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    position: "absolute",
    bottom: 50,
    width: "100%",
    paddingHorizontal: 30,
  },
  dotContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 20,
    position: "absolute",
    bottom: 130,
    width: "100%",
  },
  dot: {
    height: 10,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  button: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
  },
  skipButton: {
    padding: 10,
    justifyContent: "center",
  },
  skipText: {
    fontSize: 16,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  splashContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogo: {
    width: width * 1.2,
    height: width * 1.2,
  },
});
