import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BACKEND_URL } from '../../config/backend';
import { translations } from '../../config/localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

function LoadingView({ language, themeSubText, isDark, message }) {
  return (
    <View style={[styles.centerContainer, { backgroundColor: isDark ? '#121214' : '#f0f9ff' }]}>
      <ActivityIndicator color="#0ea5e9" size="large" />
      <Text style={[styles.loadingText, themeSubText]}>
        {message || (language === 'id' ? 'Memuat kuis...' : 'Loading quiz...')}
      </Text>
    </View>
  );
}

function EmptyView({ language, themeSubText, isDark }) {
  return (
    <View style={[styles.centerContainer, { backgroundColor: isDark ? '#121214' : '#f0f9ff' }]}>
      <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
      <Text style={[styles.loadingText, themeSubText]}>
        {language === 'id' ? 'Tidak ada mata kuliah atau kuis tersedia.' : 'No subjects or quizzes available.'}
      </Text>
    </View>
  );
}

function OptionButton({
  option,
  index,
  selectedOption,
  answered,
  correctOptionIndex,
  onSelectOption,
  themeOptionButton,
  themeOptionText,
}) {
  if (!option) return null;

  let buttonStyle = [styles.optionButton, themeOptionButton];
  let textStyle = [styles.optionText, themeOptionText];

  if (selectedOption === index) {
    buttonStyle = [styles.optionButton, styles.optionSelected];
    textStyle = [styles.optionText, styles.textSelected];
  }

  if (answered) {
    if (index === correctOptionIndex) {
      buttonStyle = [styles.optionButton, styles.optionCorrect];
      textStyle = [styles.optionText, styles.textWhite];
    } else if (selectedOption === index) {
      buttonStyle = [styles.optionButton, styles.optionIncorrect];
      textStyle = [styles.optionText, styles.textWhite];
    }
  }

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={() => onSelectOption(index)}
      disabled={answered}
      activeOpacity={0.7}
    >
      <Text style={textStyle}>{option}</Text>
    </TouchableOpacity>
  );
}

const getSubjectIcon = (name) => {
  const low = name.toLowerCase();
  if (low.includes('database') || low.includes('basis data')) return 'server-outline';
  if (low.includes('pemrograman') || low.includes('program')) return 'code-slash-outline';
  if (low.includes('arsitektur') || low.includes('komputer')) return 'hardware-chip-outline';
  if (low.includes('operasi')) return 'settings-outline';
  if (low.includes('struktur')) return 'git-branch-outline';
  return 'book-outline';
};

const getSubjectColor = (name) => {
  const low = name.toLowerCase();
  if (low.includes('database') || low.includes('basis data')) return '#0ea5e9'; 
  if (low.includes('pemrograman') || low.includes('program')) return '#6366f1'; 
  if (low.includes('arsitektur') || low.includes('komputer')) return '#f59e0b'; 
  if (low.includes('operasi')) return '#ec4899'; 
  if (low.includes('struktur')) return '#10b981'; 
  return '#8b5cf6'; 
};

export default function QuizTab({ language = 'id', isDark, user }) {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answered, setAnswered] = useState(false);

  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);

  const colors = {
    bg: isDark ? '#121214' : '#f0f9ff',
    cardBg: isDark ? '#1e1e24' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    subText: isDark ? '#a1a1aa' : '#64748b',
    border: isDark ? '#2d2d34' : '#e2e8f0',
    accent: '#0ea5e9',
    cancelBg: isDark ? '#27272a' : '#f1f5f9',
    cancelText: isDark ? '#e4e4e7' : '#334155',
  };

  const themeCard = { backgroundColor: colors.cardBg };
  const themeText = { color: colors.text };
  const themeSubText = { color: colors.subText };
  const themeProgressBg = isDark ? { backgroundColor: '#27272a' } : { backgroundColor: '#f8fafc' };
  const themeOptionButton = { backgroundColor: colors.cardBg, borderColor: colors.border };
  const themeOptionText = isDark ? { color: '#e4e4e7' } : { color: '#475569' };

  useEffect(() => {
    setLoadingSubjects(true);
    fetch(`${BACKEND_URL}/api/quiz/subjects`)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setSubjects(json.data);
        } else {
          setSubjects([
            "Basis Data",
            "Basis Data Lanjutan",
            "Organisasi dan Arsitektur Komputer",
            "Pemrograman 1",
            "Pemrograman 2",
            "Pemrograman 3",
            "Pemrograman 4",
            "Pengantar Informatika",
            "Sistem Informasi",
            "Sistem Operasi",
            "Struktur Data"
          ]);
        }
      })
      .catch((err) => {
        setSubjects([
          "Basis Data",
          "Basis Data Lanjutan",
          "Organisasi dan Arsitektur Komputer",
          "Pemrograman 1",
          "Pemrograman 2",
          "Pemrograman 3",
          "Pemrograman 4",
          "Pengantar Informatika",
          "Sistem Informasi",
          "Sistem Operasi",
          "Struktur Data"
        ]);
      })
      .finally(() => setLoadingSubjects(false));
  }, []);

  useEffect(() => {
    if (quizFinished && user?.uid && questions.length > 0) {
      const saveQuizStats = async () => {
        try {
          const val = await AsyncStorage.getItem(`quiz_stats_${user.uid}`);
          let currentStats = { correct: 0, total: 0 };
          if (val) {
            currentStats = JSON.parse(val);
          }
          const updatedStats = {
            correct: (currentStats.correct || 0) + correctCount,
            total: (currentStats.total || 0) + questions.length,
          };
          await AsyncStorage.setItem(`quiz_stats_${user.uid}`, JSON.stringify(updatedStats));
        } catch (err) {
        }
      };
      saveQuizStats();
    }
  }, [quizFinished, user, correctCount, questions.length]);

  const generateFallbackQuestions = (subjectName) => {
    const fallbackList = [];
    for (let i = 1; i <= 20; i++) {
      fallbackList.push({
        question: `Soal Latihan ${subjectName} #${i}: Manakah yang termasuk dasar/konsep penting dalam materi kuliah ini?`,
        option1: "Konseptual Model A",
        option2: "Implementasi & Sintaksis B",
        option3: "Studi Kasus & Analitis C",
        option4: "Metodologi & Praktis D",
        correctOptionIndex: (i % 4),
      });
    }
    setQuestions(fallbackList);
  };

  const handleSelectSubject = (subjectName) => {
    setSelectedSubject(subjectName);
    setLoading(true);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectCount(0);
    setIncorrectCount(0);
    setSelectedOption(null);
    setAnswered(false);

    fetch(`${BACKEND_URL}/api/quiz/generate?subject=${encodeURIComponent(subjectName)}`)
      .then(res => res.json())
      .then(json => {
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          setQuestions(json.data.slice(0, 20));
        } else {
          generateFallbackQuestions(subjectName);
        }
      })
      .catch((err) => {
        generateFallbackQuestions(subjectName);
      })
      .finally(() => setLoading(false));
  };

  const handleSelectOption = (optionIndex) => {
    if (answered) return;
    setSelectedOption(optionIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null || answered) return;
    setAnswered(true);
    const correctIdx = questions[currentQuestionIndex].correctOptionIndex;
    if (selectedOption === correctIdx) {
      setScore(prev => prev + 10);
      setCorrectCount(prev => prev + 1);
    } else {
      setIncorrectCount(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedOption(null);
    setAnswered(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const getNextButtonText = () => {
    const isLast = currentQuestionIndex === questions.length - 1;
    if (isLast) {
      return language === 'id' ? 'Lihat Hasil' : 'See Results';
    }
    return language === 'id' ? 'Soal Berikutnya' : 'Next Question';
  };

  if (!selectedSubject) {
    if (loadingSubjects) {
      return (
        <LoadingView
          language={language}
          themeSubText={themeSubText}
          isDark={isDark}
          message={language === 'id' ? 'Memuat daftar kelas...' : 'Loading classes...'}
        />
      );
    }

    if (subjects.length === 0) {
      return <EmptyView language={language} themeSubText={themeSubText} isDark={isDark} />;
    }

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.scrollContainer}
      >
        <Text style={[styles.mainTitle, themeText]}>
          {language === 'id' ? 'Latihan Kuis AI' : 'AI Practice Quiz'}
        </Text>
        <Text style={[styles.mainSubtitle, themeSubText]}>
          {language === 'id' ? 'Pilih kelas kuliah Anda untuk menghasilkan 20 soal latihan via AI' : 'Select your class to generate 20 practice questions via AI'}
        </Text>

        <View style={styles.subjectsGrid}>
          {subjects.map(subj => {
            const subjColor = getSubjectColor(subj);
            return (
              <TouchableOpacity
                key={subj}
                style={[styles.subjectCard, themeCard, { borderColor: colors.border }]}
                activeOpacity={0.7}
                onPress={() => handleSelectSubject(subj)}
              >
                <View style={[styles.subjectIconWrapper, { backgroundColor: subjColor + '15' }]}>
                  <Ionicons name={getSubjectIcon(subj)} size={26} color={subjColor} />
                </View>
                <Text style={[styles.subjectCardText, themeText]} numberOfLines={2}>
                  {subj}
                </Text>
                <View style={styles.subjectCardFooter}>
                  <Text style={[styles.subjectCardMeta, themeSubText]}>20 Soal</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.subText} />
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <LoadingView
        language={language}
        themeSubText={themeSubText}
        isDark={isDark}
        message={language === 'id' ? 'Mentora AI sedang menyusun soal kuis berdasarkan materi Anda...' : 'Mentora AI is preparing quiz questions based on your materials...'}
      />
    );
  }

  if (quizFinished) {
    const percentage = Math.round((correctCount / questions.length) * 100);
    const scoreRating = percentage >= 80 ? (language === 'id' ? 'Sangat Bagus!' : 'Excellent!') : (percentage >= 50 ? (language === 'id' ? 'Bagus!' : 'Good Job!') : (language === 'id' ? 'Belajar Lagi!' : 'Keep Learning!'));
    const ratingColor = percentage >= 80 ? '#22c55e' : (percentage >= 50 ? '#0ea5e9' : '#f59e0b');

    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.bg }]}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={[styles.quizCard, themeCard, { borderColor: colors.border }]}>
          <Text style={[styles.quizHeader, themeText]}>
            {language === 'id' ? 'Hasil Kuis' : 'Quiz Results'}
          </Text>
          <Text style={[styles.scoreRatingText, { color: ratingColor }]}>{scoreRating}</Text>

          <View style={[styles.scoreCircle, { borderColor: ratingColor }]}>
            <Text style={[styles.scoreCircleText, themeText]}>{percentage}%</Text>
            <Text style={[styles.scoreCircleLabel, themeSubText]}>
              {language === 'id' ? 'Nilai Anda' : 'Your Score'}
            </Text>
          </View>

          <View style={styles.statBoxContainer}>
            <View style={[styles.statBox, { backgroundColor: colors.cancelBg }]}>
              <Text style={[styles.statBoxNumber, { color: '#22c55e' }]}>{correctCount}</Text>
              <Text style={[styles.statBoxLabel, themeSubText]}>
                {language === 'id' ? 'Benar' : 'Correct'}
              </Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: colors.cancelBg }]}>
              <Text style={[styles.statBoxNumber, { color: '#ef4444' }]}>{incorrectCount}</Text>
              <Text style={[styles.statBoxLabel, themeSubText]}>
                {language === 'id' ? 'Salah' : 'Incorrect'}
              </Text>
            </View>
          </View>

          <View style={styles.scoreboardActions}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.accent }]}
              onPress={() => handleSelectSubject(selectedSubject)}
            >
              <Ionicons name="refresh-outline" size={18} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.actionBtnText}>
                {language === 'id' ? 'Ulangi Kuis' : 'Repeat Quiz'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.cancelBg }]}
              onPress={() => setSelectedSubject(null)}
            >
              <Ionicons name="grid-outline" size={16} color={colors.cancelText} style={{ marginRight: 6 }} />
              <Text style={[styles.actionBtnText, { color: colors.cancelText }]}>
                {language === 'id' ? 'Kembali ke Kelas' : 'Back to Classes'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const options = [
    currentQuestion?.option1,
    currentQuestion?.option2,
    currentQuestion?.option3,
    currentQuestion?.option4
  ];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContainer}
    >
      <View style={[styles.quizCard, themeCard, { borderColor: colors.border }]}>
        <View style={styles.quizHeaderRow}>
          <TouchableOpacity onPress={() => setSelectedSubject(null)} style={styles.closeQuizBtn}>
            <Ionicons name="close" size={20} color={colors.subText} />
          </TouchableOpacity>
          <Text style={[styles.quizHeaderSubject, themeText]} numberOfLines={1}>
            {selectedSubject}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={[styles.progressContainer, themeProgressBg]}>
          <Text style={[styles.progressText, themeSubText]}>
            {language === 'id' ? 'Soal ' : 'Question '}{currentQuestionIndex + 1}{language === 'id' ? ' dari ' : ' of '}{questions.length}
          </Text>
        </View>

        <Text style={[styles.questionText, themeText]}>{currentQuestion?.question}</Text>

        <View style={styles.optionsContainer}>
          {options.map((option, index) => {
            if (!option) return null;
            return (
              <OptionButton
                key={option}
                option={option}
                index={index}
                selectedOption={selectedOption}
                answered={answered}
                correctOptionIndex={currentQuestion.correctOptionIndex}
                onSelectOption={handleSelectOption}
                themeOptionButton={themeOptionButton}
                themeOptionText={themeOptionText}
              />
            );
          })}
        </View>

        {selectedOption !== null && !answered && (
          <TouchableOpacity style={[styles.checkButton, { backgroundColor: colors.accent }]} onPress={handleCheckAnswer}>
            <Text style={styles.checkButtonText}>
              {language === 'id' ? 'Periksa Jawaban' : 'Check Answer'}
            </Text>
          </TouchableOpacity>
        )}

        {answered && (
          <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.accent }]} onPress={handleNextQuestion}>
            <Text style={styles.nextButtonText}>
              {getNextButtonText()}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  mainSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 24,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  subjectCard: {
    width: (width - 54) / 2,
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    justifyContent: 'space-between',
    minHeight: 148,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  subjectIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  subjectCardText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    flex: 1,
  },
  subjectCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  subjectCardMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  quizCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 3,
  },
  quizHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeQuizBtn: {
    padding: 4,
  },
  quizHeaderSubject: {
    fontSize: 14,
    fontWeight: '700',
    maxWidth: '75%',
  },
  quizHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 6,
  },
  scoreRatingText: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 24,
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 28,
  },
  scoreCircleText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreCircleLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  statBoxContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  statBoxNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statBoxLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  scoreboardActions: {
    gap: 12,
  },
  actionBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  progressContainer: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  optionButton: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  optionSelected: {
    borderColor: '#0ea5e9',
    backgroundColor: 'rgba(14, 165, 233, 0.08)',
  },
  textSelected: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
  optionCorrect: {
    borderColor: '#22c55e',
    backgroundColor: '#22c55e',
  },
  optionIncorrect: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444',
  },
  textWhite: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  checkButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  checkButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  nextButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    width: '100%',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
