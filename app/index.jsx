import { useState, useRef, useEffect, useContext } from "react"; // useContext'i buraya ekleyin
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
import { useRouter, Redirect } from "expo-router";
import { AuthContext } from "../src/context/AuthContext";
import { checkUserProfileComplete } from "../src/services/firestoreService";
// Aşağıdaki satırı kaldırın veya yorum satırına alın
// import { useContext } from "react"; <-- Bu satırı silin
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../constants/Colors";
import { ThemeContext } from "../src/context/ThemeContext";
import ThemedText from "../components/ThemedText";
import ThemedButton from "../components/ThemedButton";
import { LinearGradient } from "expo-linear-gradient";
import { useTranslation } from "react-i18next";

const { width, height } = Dimensions.get("window");

const getSlides = (t) => [
  {
    id: "1",
    title: t('onboarding.slide1Title'),
    description: t('onboarding.slide1Desc'),
    image: require("../assets/onboarding-2.png"),
  },
  {
    id: "2",
    title: t('onboarding.slide2Title'),
    description: t('onboarding.slide2Desc'),
    image: require("../assets/onboarding-4.png"),
  },
  {
    id: "3",
    title: t('onboarding.slide3Title'),
    description: t('onboarding.slide3Desc'),
    image: require("../assets/onboarding-3.png"),
  },
  {
    id: "4",
    title: t('onboarding.slide4Title'),
    description: t('onboarding.slide4Desc'),
    image: require("../assets/onboarding-1.png"),
  },
];
// Foreground'da da banner göstermek için:

const Index = () => {
  // ⭐ TÜM HOOK TANIMLAMALARI BURADA OLMALI ⭐
  // State hooks
  const [showSplash, setShowSplash] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [splashComplete, setSplashComplete] = useState(false); // Splash animasyonundan sonra kullanıcı kontrolü için ek state
  const [profileCheckDone, setProfileCheckDone] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
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
  
  // Slides'ı çevirilerle oluştur
  const slides = getSlides(t);

  // HOOK TANIMLAMALARI BİTTİ - Bundan sonra normal fonksiyonlar ve logic

  // Splash ekranını göster ve animasyonları başlat
  useEffect(() => {
    // Logo görünümü için animasyonları çalıştır
    Animated.sequence([
      // Fade in + büyüme animasyonu
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
      // Biraz bekle
      Animated.delay(1000),
      // Fade out animasyonu
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Animasyon bittiğinde splash'ı gizle
      setShowSplash(false);
      // Animasyon tamamlandığını bildir, artık kullanıcı kontrolü yapılabilir
      setSplashComplete(true);
    });
  }, []);

  // Firebase'den kullanıcı durumu kontrolü
  useEffect(() => {
    if (user) {
      console.log("User is logged in");
    } else {
      console.log("User is not logged in");
    }
  }, [user]);

  // Kullanıcı profil kontrolü - eksik bilgi varsa yönlendir
  useEffect(() => {
    const checkProfile = async () => {
      if (user && splashComplete && !loading) {
        try {
          const profileStatus = await checkUserProfileComplete(user.uid);
          
          if (!profileStatus.isComplete) {
            if (profileStatus.missingFields.includes('displayName')) {
              setRedirectPath(`/enterUsername?userId=${user.uid}`);
            } else if (profileStatus.missingFields.includes('name')) {
              setRedirectPath(`/enterName?userId=${user.uid}`);
            } else {
              setRedirectPath('/home');
            }
          } else {
            setRedirectPath('/home');
          }
        } catch (error) {
          console.error('Profil kontrol hatası:', error);
          setRedirectPath('/home');
        }
        setProfileCheckDone(true);
      }
    };
    
    checkProfile();
  }, [user, splashComplete, loading]);

  // Buton animasyonları için effect
  useEffect(() => {
    if (currentSlideIndex === slides.length - 1) {
      // Login button animasyonu
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

      // Signup button animasyonu (biraz gecikmeyle)
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
      }, 200); // 200ms gecikme
    } else {
      // Son slayt değilse butonları sıfırla
      loginButtonOpacity.setValue(0);
      loginButtonTranslate.setValue(50);
      signupButtonOpacity.setValue(0);
      signupButtonTranslate.setValue(50);
    }
  }, [currentSlideIndex]);

  // Bir sonraki slayta geç
  const goToNextSlide = () => {
    const nextIndex = currentSlideIndex + 1;
    if (nextIndex < slides.length) {
      flatListRef.current.scrollToIndex({ index: nextIndex });
      setCurrentSlideIndex(nextIndex);
    }
  };

  // Kaydırma olayını işle
  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / width);
    setCurrentSlideIndex(index);
  };

  // Tek bir slaytı render et
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

  // İndikatör noktaları
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

  // Splash ekranını render et - kullanıcı giriş yapmış olsa bile önce splash göster
  if (showSplash) {
    return (
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
    );
  }

  // Yükleme durumu kontrolü - splash animasyonu bittikten sonra kontrol et
  if (loading && splashComplete) {
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.mainBg }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Kullanıcı giriş yapmışsa profil kontrolü yap ve yönlendir
  if (splashComplete && !loading && user) {
    if (profileCheckDone && redirectPath) {
      return <Redirect href={redirectPath} />;
    }
    // Profil kontrolü devam ediyor
    return (
      <View
        style={[styles.loadingContainer, { backgroundColor: theme.mainBg }]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Normal onboarding akışını render et
  return (
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
          // Son slaytta giriş/kayıt butonları (animasyonlu)
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
                title={t('onboarding.login')}
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
                title={t('onboarding.register')}
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
          // Diğer slaytta ileri butonu
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              onPress={() => router.push("/login")}
              style={styles.skipButton}
            >
              <ThemedText style={styles.skipText}>{t('onboarding.skip')}</ThemedText>
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
  // Splash ekranı için yeni stiller
  splashContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogo: {
    width: width * 1.2,
    height: width * 1.2,
  },
});
