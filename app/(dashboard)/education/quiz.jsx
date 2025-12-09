import { useContext, useEffect, useMemo, useState } from "react";
import { StyleSheet, View, TouchableOpacity, ScrollView } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import ThemedTitle from "../../../components/ThemedTitle";
import ThemedText from "../../../components/ThemedText";
import ScreenContainer from "../../../components/ScreenContainer";
import BackButton from "../../../components/BackButton";
import { ThemeContext } from "../../../src/context/ThemeContext";
import { Colors } from "../../../constants/Colors";
import ThemedButton from "../../../components/ThemedButton";
import { AuthContext } from "../../../src/context/AuthContext";
import { useAchievementTracker } from "../../../src/hooks/achievements";
import CustomAlert from "../../../components/CustomAlert";
import { fetchEducationModuleById, markEducationModuleCompleted } from "../../../src/services/firestoreService";

export default function EducationQuizScreen() {
  const { theme: selectedTheme } = useContext(ThemeContext);
  const theme = Colors[selectedTheme] ?? Colors.light;
  const { user } = useContext(AuthContext);
  const router = useRouter();
  const { id: moduleId } = useLocalSearchParams();
  const { trackModuleCompleted, newBadge, clearNewBadge } = useAchievementTracker(user?.uid);

  const [loading, setLoading] = useState(true);
  const [moduleTitle, setModuleTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchEducationModuleById(moduleId);
        const qs = Array.isArray(data?.questions) ? data.questions : [];
        setModuleTitle(data?.moduleName || "Eğitim Sınavı");
        setQuestions(qs);
      } catch (e) {
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [moduleId]);

  const total = questions.length;
  const current = questions[idx] || {};
  const answers = Array.isArray(current?.answers) ? current.answers : [];
  const qText = current?.text || current?.title || current?.question || `Soru ${idx + 1}`;

  const percent = useMemo(() => {
    if (total === 0) return 0;
    return Math.round((score / total) * 100);
  }, [score, total]);

  const onSelect = (ans) => {
    if (answered) return;
    setSelected(ans?.id ?? null);
    const correct = !!ans?.isCorrect;
    setIsCorrect(correct);
    setAnswered(true);
    if (correct) setScore((s) => s + 1);
  };

  const onNext = async () => {
    if (!answered) return;
    if (idx + 1 < total) {
      setIdx(idx + 1);
      setAnswered(false);
      setSelected(null);
      setIsCorrect(null);
    } else {
      setFinished(true);
      // Başarı kontrolü ve işaretleme
      if (percent >= 80 && user?.uid) {
        try {
          await markEducationModuleCompleted(user.uid, String(moduleId), moduleTitle);
          // Achievement & badge tetikle (module_completed -> completedModulesCount)
          await trackModuleCompleted();
        } catch {}
      }
    }
  };

  if (loading) {
    return (
      <ScreenContainer>
        <View style={{ padding: 24 }}>
          <ThemedText>Yükleniyor...</ThemedText>
        </View>
      </ScreenContainer>
    );
  }

  if (total === 0) {
    return (
      <ScreenContainer>
        <View style={styles.headerBar}>
          <BackButton />
        </View>
        <View style={{ padding: 24 }}>
          <ThemedTitle>Bu modül için soru bulunamadı.</ThemedTitle>
          <ThemedButton title="Geri Dön" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </ScreenContainer>
    );
  }

  if (finished) {
    const passed = percent >= 80;
    return (
      <ScreenContainer>
        <View style={styles.headerBar}>
          <BackButton />
        </View>
        <View style={[styles.resultCard, { backgroundColor: theme.secondBg, borderColor: theme.border }]}>
          <ThemedTitle style={{ textAlign: "center", marginBottom: 8 }}>{moduleTitle}</ThemedTitle>
          <ThemedText style={{ textAlign: "center", marginBottom: 6 }}>Skor: {score}/{total} ({percent}%)</ThemedText>
          <ThemedText style={{ textAlign: "center", fontWeight: "700", color: passed ? "#2e7d32" : "#c62828" }}>
            {passed ? "Tebrikler, geçtiniz!" : "Üzgünüz, başarısız oldunuz."}
          </ThemedText>
          <ThemedButton title="Tamam" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      {/* Rozet bildirimi */}
      <CustomAlert
        visible={!!newBadge}
        type="success"
        title="Yeni Rozet"
        message={newBadge ? `Tebrikler! ${newBadge.name} rozetini kazandın.` : ""}
        onConfirm={clearNewBadge}
        confirmText="Harika"
      />
      <View style={styles.headerBar}>
        <BackButton />
      </View>

      <View style={[styles.card, { backgroundColor: theme.secondBg, borderColor: theme.border }]}>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          <ThemedText style={{ opacity: 0.7, marginBottom: 8 }}>Soru {idx + 1} / {total}</ThemedText>
          <ThemedTitle style={{ marginBottom: 16 }}>{qText}</ThemedTitle>

          <View style={{ gap: 10 }}>
            {answers.map((a) => {
              const selectedThis = selected === a.id;
              const showState = answered && selectedThis;
              const bg = showState ? (isCorrect ? "#e8f5e9" : "#ffebee") : theme.inputBg;
              const border = showState ? (isCorrect ? "#2e7d32" : "#c62828") : theme.border;
              return (
                <TouchableOpacity
                  key={a.id || a.text}
                  activeOpacity={0.9}
                  onPress={() => onSelect(a)}
                  style={[styles.answerItem, { backgroundColor: bg, borderColor: border }]}
                >
                  <ThemedText style={{ fontSize: 16 }}>{a.text || ""}</ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>

          {answered ? (
            <View style={{ marginTop: 16 }}>
              <ThemedText style={{ fontWeight: "700", color: isCorrect ? "#2e7d32" : "#c62828" }}>
                {isCorrect ? "Doğru" : "Yanlış"}
              </ThemedText>
              <ThemedButton title={idx + 1 === total ? "Bitir" : "Sonraki"} onPress={onNext} style={{ marginTop: 10 }} />
            </View>
          ) : null}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  card: {
    marginHorizontal: 12,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  answerItem: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  resultCard: {
    marginHorizontal: 12,
    marginTop: 24,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
});
