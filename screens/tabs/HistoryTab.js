import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Modal,
  ScrollView,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL } from '../../config/backend';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../config/localization';
import { useAlert } from '../../config/AlertContext';

const HistoryConversationCard = React.memo(({
  item,
  isSelectMode,
  isSelected,
  isDark,
  themeDateHeader,
  themeCard,
  themeCardQuestionText,
  themeSolutionButton,
  themeSolutionButtonText,
  onSelectToggle,
  onLongPress,
  onPressSolution,
  language = 'id'
}) => {
  let checkboxColor = "#cbd5e1";
  if (isSelected) {
    checkboxColor = "#0ea5e9";
  } else if (isDark) {
    checkboxColor = "#52525b";
  }

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.dateHeader, themeDateHeader]}>{item.date}</Text>
      <View style={styles.historyCardRow}>
        {isSelectMode && (
          <TouchableOpacity
            onPress={() => onSelectToggle(item.id)}
            style={styles.checkboxContainer}
          >
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={checkboxColor}
            />
          </TouchableOpacity>
        )}
        <View style={[styles.historyCard, themeCard]}>
          <TouchableOpacity
            disabled={isSelectMode}
            onPress={() => onPressSolution(item)}
            onLongPress={() => onLongPress(item.id)}
            style={styles.cardContent}
          >
            {item.pdf && (
              <View style={styles.pdfMessageCard}>
                <Ionicons name="document-text" size={24} color="#ef4444" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pdfMessageName, isDark ? { color: '#ffffff' } : { color: '#0f172a' }]} numberOfLines={1}>
                    {item.pdfName || 'Document.pdf'}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#64748b', marginTop: 1 }}>
                    {item.pdfSize || 'PDF'}
                  </Text>
                </View>
              </View>
            )}
            <Text style={[styles.cardQuestionText, themeCardQuestionText]} numberOfLines={3}>
              {item.question || (item.pdf ? 'Membaca berkas PDF' : '')}
            </Text>
          </TouchableOpacity>
          {!isSelectMode && (
            <TouchableOpacity
              style={[styles.solutionButton, themeSolutionButton]}
              onPress={() => onPressSolution(item)}
            >
              <Text style={[styles.solutionButtonText, themeSolutionButtonText]}>{translations[language]?.solution || 'solution'}</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "#a1a1aa" : "#64748b"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.question === nextProps.item.question &&
    prevProps.item.pdfName === nextProps.item.pdfName &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectMode === nextProps.isSelectMode &&
    prevProps.isDark === nextProps.isDark &&
    prevProps.language === nextProps.language
  );
});

const HistoryQuestionCard = React.memo(({
  item,
  isSelectMode,
  isSelected,
  isDark,
  themeDateHeader,
  themeCard,
  themeSolutionButton,
  themeSolutionButtonText,
  onSelectToggle,
  onLongPress,
  onPressSolution,
  language = 'id'
}) => {
  let checkboxColor = "#cbd5e1";
  if (isSelected) {
    checkboxColor = "#0ea5e9";
  } else if (isDark) {
    checkboxColor = "#52525b";
  }

  return (
    <View style={styles.cardContainer}>
      <Text style={[styles.dateHeader, themeDateHeader]}>{item.date}</Text>
      <View style={styles.historyCardRow}>
        {isSelectMode && (
          <TouchableOpacity
            onPress={() => onSelectToggle(item.id)}
            style={styles.checkboxContainer}
          >
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={24}
              color={checkboxColor}
            />
          </TouchableOpacity>
        )}
        <View style={[styles.historyCard, themeCard]}>
          <TouchableOpacity
            disabled={isSelectMode}
            onPress={() => onPressSolution(item)}
            onLongPress={() => onLongPress(item.id)}
            style={styles.cardContent}
          >
            <Image
              source={{ uri: `data:image/jpeg;base64,${item.image}` }}
              style={styles.thumbnail}
            />
          </TouchableOpacity>
          {!isSelectMode && (
            <TouchableOpacity
              style={[styles.solutionButton, themeSolutionButton]}
              onPress={() => onPressSolution(item)}
            >
              <Text style={[styles.solutionButtonText, themeSolutionButtonText]}>{translations[language]?.solution || 'solution'}</Text>
              <Ionicons name="chevron-forward" size={16} color={isDark ? "#a1a1aa" : "#64748b"} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.image === nextProps.item.image &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isSelectMode === nextProps.isSelectMode &&
    prevProps.isDark === nextProps.isDark &&
    prevProps.language === nextProps.language
  );
});

const darkTheme = {
  container: { backgroundColor: '#121214' },
  header: { borderBottomColor: '#1e1e24' },
  headerText: { color: '#ffffff' },
  selectButton: { backgroundColor: '#27272a' },
  selectButtonText: { color: '#ffffff' },
  tabContainer: { backgroundColor: '#1e1e24' },
  tabText: { color: '#a1a1aa' },
  dateHeader: { backgroundColor: '#1e1e24', color: '#71717a' },
  card: { backgroundColor: '#1e1e24' },
  cardQuestionText: { color: '#e4e4e7' },
  solutionButton: { backgroundColor: '#27272a', borderTopColor: '#1e1e24' },
  solutionButtonText: { color: '#ffffff' },
  bottomDrawer: { backgroundColor: '#1e1e24', borderColor: '#27272a' },
  drawerCountText: { color: '#ffffff' },
  drawerDeleteButton: { backgroundColor: '#27272a' },
  modalContent: { backgroundColor: '#1e1e24' },
  modalHeader: { borderBottomColor: '#27272a' },
  modalTitle: { color: '#ffffff' },
  modalQuestionTitle: { color: '#a1a1aa' },
  modalQuestionText: { color: '#ffffff' },
  divider: { backgroundColor: '#27272a' },
  modalAnswerTitle: { color: '#a1a1aa' },
  modalAnswerText: { color: '#e4e4e7' },
  boldText: { color: '#ffffff' },
  emptyText: { color: '#71717a' }
};

const lightTheme = {
  container: { backgroundColor: '#f8fafc' },
  header: { borderBottomColor: '#e2e8f0' },
  headerText: { color: '#0f172a' },
  selectButton: { backgroundColor: '#e2e8f0' },
  selectButtonText: { color: '#334155' },
  tabContainer: { backgroundColor: '#f1f5f9' },
  tabText: { color: '#64748b' },
  dateHeader: { backgroundColor: '#e2e8f0', color: '#64748b' },
  card: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  cardQuestionText: { color: '#0f172a' },
  solutionButton: { backgroundColor: '#f8fafc', borderTopColor: '#e2e8f0' },
  solutionButtonText: { color: '#0f172a' },
  bottomDrawer: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  drawerCountText: { color: '#0f172a' },
  drawerDeleteButton: { backgroundColor: '#f1f5f9' },
  modalContent: { backgroundColor: '#ffffff' },
  modalHeader: { borderBottomColor: '#e2e8f0' },
  modalTitle: { color: '#0f172a' },
  modalQuestionTitle: { color: '#64748b' },
  modalQuestionText: { color: '#0f172a' },
  divider: { backgroundColor: '#e2e8f0' },
  modalAnswerTitle: { color: '#64748b' },
  modalAnswerText: { color: '#334155' },
  boldText: { color: '#0f172a' },
  emptyText: { color: '#94a3b8' }
};

const getThemeColors = (isDark) => {
  return isDark ? darkTheme : lightTheme;
};

const formatDateGroup = (timestamp) => {
  if (!timestamp) return 'Juli 2';
  const date = new Date(timestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
};

const getConversationPairs = (historyList, bookmarkedIds) => {
  const pairs = [];
  for (let i = 0; i < historyList.length; i++) {
    const current = historyList[i];
    if (current.sender === 'user' && !current.image) {
      const idStr = current.id.toString();
      if (bookmarkedIds.includes(idStr)) continue;

      let answer = 'Tidak ada jawaban.';
      if (i + 1 < historyList.length && historyList[i + 1].sender === 'ai') {
        answer = historyList[i + 1].text;
      }
      pairs.push({
        id: idStr,
        question: current.text,
        answer: answer,
        pdf: current.pdf || null,
        pdfName: current.pdfName || null,
        pdfSize: current.pdfSize || null,
        date: formatDateGroup(current.timestamp)
      });
    }
  }
  return pairs;
};

const getQuestionItems = (historyList, bookmarkedIds) => {
  const questions = [];
  for (let i = 0; i < historyList.length; i++) {
    const current = historyList[i];
    if (current.sender === 'user' && current.image) {
      const idStr = current.id.toString();
      if (bookmarkedIds.includes(idStr)) continue;

      let answer = 'Tidak ada jawaban.';
      if (i + 1 < historyList.length && historyList[i + 1].sender === 'ai') {
        answer = historyList[i + 1].text;
      }
      questions.push({
        id: idStr,
        image: current.image,
        question: current.text,
        answer: answer,
        date: formatDateGroup(current.timestamp)
      });
    }
  }
  return questions;
};

const getBookmarkedItems = (historyList, bookmarkedIds) => {
  const allPairs = [];
  for (let i = 0; i < historyList.length; i++) {
    const current = historyList[i];
    if (current.sender === 'user') {
      const idStr = current.id.toString();
      if (bookmarkedIds.includes(idStr)) {
        let answer = 'Tidak ada jawaban.';
        if (i + 1 < historyList.length && historyList[i + 1].sender === 'ai') {
          answer = historyList[i + 1].text;
        }
        allPairs.push({
          id: idStr,
          question: current.text,
          answer: answer,
          image: current.image || null,
          pdf: current.pdf || null,
          pdfName: current.pdfName || null,
          pdfSize: current.pdfSize || null,
          date: formatDateGroup(current.timestamp)
        });
      }
    }
  }
  return allPairs;
};

const loadBookmarksData = async (uid, setBookmarkedIds) => {
  try {
    const stored = await AsyncStorage.getItem(`bookmarks_${uid}`);
    if (stored) {
      setBookmarkedIds(JSON.parse(stored));
    }
  } catch (e) {
  }
};

const saveBookmarksData = async (uid, newBookmarks, setBookmarkedIds) => {
  try {
    await AsyncStorage.setItem(`bookmarks_${uid}`, JSON.stringify(newBookmarks));
    setBookmarkedIds(newBookmarks);
  } catch (e) {
  }
};

const deleteHistoryMultiple = async ({
  uid,
  idsToDelete,
  historyList,
  setHistoryList,
  bookmarkedIds,
  setBookmarkedIds,
  setIsSelectMode,
  setSelectedIds,
  language,
  showAlert
}) => {
  const numericIds = idsToDelete.map(Number);
  try {
    const response = await fetch(`${BACKEND_URL}/api/chat/delete-multiple`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(numericIds)
    });
    const json = await response.json();
    if (json.status === 200) {
      setHistoryList(prev => prev.filter(item => !idsToDelete.includes(item.id.toString())));
      const updatedBookmarks = bookmarkedIds.filter(id => !idsToDelete.includes(id));
      await saveBookmarksData(uid, updatedBookmarks, setBookmarkedIds);
      setIsSelectMode(false);
      setSelectedIds([]);
      showAlert({
        title: language === 'id' ? 'Berhasil' : 'Success',
        message: translations[language].successDeleteHistory,
        type: 'success',
      });
    } else {
      showAlert({
        title: 'Error',
        message: "Gagal menghapus: " + json.message,
        type: 'error',
      });
    }
  } catch (err) {
    showAlert({
      title: 'Error',
      message: "Error menghapus dari server: " + err.message,
      type: 'error',
    });
  }
};

const renderPart = (part, partIdx, boldCounter, regularCounter, theme, styles) => {
  if (partIdx % 2 === 1) {
    boldCounter.val++;
    return <Text key={`b-${boldCounter.val}`} style={[styles.boldText, theme.boldText]}>{part}</Text>;
  }
  regularCounter.val++;
  return <Text key={`r-${regularCounter.val}`}>{part}</Text>;
};

const renderParagraph = (para, paraIdx, theme, styles, isQuestion) => {
  const parts = para.split(/\*\*([^*]+)\*\*/g);
  const boldCounter = { val: 0 };
  const regularCounter = { val: 0 };

  return (
    <Text key={`p-${paraIdx}`} style={isQuestion ? [styles.modalQuestionText, theme.modalQuestionText] : [styles.modalAnswerText, theme.modalAnswerText]}>
      {parts.map((part, partIdx) => renderPart(part, partIdx, boldCounter, regularCounter, theme, styles))}
    </Text>
  );
};

const renderFormattedText = (text, isQuestion, theme, styles) => {
  if (!text) return null;

  const paragraphs = text.split('\n');
  let dividerCounter = 0;
  let paraCounter = 0;

  return paragraphs.map((para) => {
    if (para.trim() === '---') {
      dividerCounter++;
      return <View key={`div-${dividerCounter}`} style={[styles.markdownDivider, theme.divider]} />;
    }

    paraCounter++;
    return renderParagraph(para, paraCounter, theme, styles, isQuestion);
  });
};

const fetchHistoryData = (uid, setHistoryList, setLoading) => {
  setLoading(true);
  fetch(`${BACKEND_URL}/api/chat/history/${uid}`)
    .then(res => res.json())
    .then(json => {
      if (json.data) {
        setHistoryList(json.data);
      }
    })
    .catch(() => { })
    .finally(() => setLoading(false));
};

const getIdsToDelete = (selectedIds, historyList) => {
  const idsToDelete = [...selectedIds];
  selectedIds.forEach(id => {
    const idx = historyList.findIndex(item => item.id.toString() === id);
    if (idx !== -1 && idx + 1 < historyList.length && historyList[idx + 1].sender === 'ai') {
      idsToDelete.push(historyList[idx + 1].id.toString());
    }
  });
  return idsToDelete;
};

const renderHistoryItem = ({
  item,
  selectedIds,
  isSelectMode,
  isDark,
  theme,
  handleSelectToggle,
  handleLongPressCard,
  setSelectedSolution,
  language
}) => {
  const isSelected = selectedIds.includes(item.id);
  if (item.image) {
    return (
      <HistoryQuestionCard
        item={item}
        isSelectMode={isSelectMode}
        isSelected={isSelected}
        isDark={isDark}
        themeDateHeader={theme.dateHeader}
        themeCard={theme.card}
        themeSolutionButton={theme.solutionButton}
        themeSolutionButtonText={theme.solutionButtonText}
        onSelectToggle={handleSelectToggle}
        onLongPress={handleLongPressCard}
        onPressSolution={setSelectedSolution}
        language={language}
      />
    );
  }
  return (
    <HistoryConversationCard
      item={item}
      isSelectMode={isSelectMode}
      isSelected={isSelected}
      isDark={isDark}
      themeDateHeader={theme.dateHeader}
      themeCard={theme.card}
      themeCardQuestionText={theme.cardQuestionText}
      themeSolutionButton={theme.solutionButton}
      themeSolutionButtonText={theme.solutionButtonText}
      onSelectToggle={handleSelectToggle}
      onLongPress={handleLongPressCard}
      onPressSolution={setSelectedSolution}
      language={language}
    />
  );
};

const renderDrawerButtons = ({
  activeSubTab,
  handleRemoveFromBookmarks,
  handleAddToBookmarks,
  handleDeleteSelected,
  theme,
  language,
  styles
}) => {
  if (activeSubTab === 'bookmark') {
    return (
      <TouchableOpacity
        style={styles.drawerPurpleButton}
        onPress={handleRemoveFromBookmarks}
      >
        <Text style={styles.drawerButtonText}>{translations[language].moveOut}</Text>
      </TouchableOpacity>
    );
  }
  return (
    <View style={styles.drawerButtonGroup}>
      <TouchableOpacity
        style={styles.drawerPurpleButton}
        onPress={handleAddToBookmarks}
      >
        <Text style={styles.drawerButtonText}>{translations[language].addToBookmarks}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.drawerDeleteButton, theme.drawerDeleteButton]}
        onPress={handleDeleteSelected}
      >
        <Text style={styles.drawerDeleteButtonText}>{translations[language].deleteSelected}</Text>
      </TouchableOpacity>
    </View>
  );
};

const renderPdfDetail = (selectedSolution, pdfDetailNameStyle, styles) => {
  if (!selectedSolution?.pdf) return null;
  return (
    <View style={styles.pdfMessageCardDetail}>
      <Ionicons name="document-text" size={32} color="#ef4444" />
      <View style={{ flex: 1 }}>
        <Text style={pdfDetailNameStyle} numberOfLines={1}>
          {selectedSolution.pdfName || 'Document.pdf'}
        </Text>
        <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
          {selectedSolution.pdfSize || 'PDF'}
        </Text>
      </View>
    </View>
  );
};

const renderImageDetail = (selectedSolution, styles) => {
  if (!selectedSolution?.image) return null;
  return (
    <Image
      source={{ uri: `data:image/jpeg;base64,${selectedSolution.image}` }}
      style={styles.modalImage}
    />
  );
};

export default function HistoryTab({ user, onBack, language = 'id', isDark }) {
  const { showAlert } = useAlert();
  const [activeSubTab, setActiveSubTab] = useState('conversation');
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSolution, setSelectedSolution] = useState(null);

  const theme = getThemeColors(isDark);

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bookmarkedIds, setBookmarkedIds] = useState([]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    loadBookmarksData(user.uid, setBookmarkedIds);
    fetchHistoryData(user.uid, setHistoryList, setLoading);
  }, [user]);

  const listToRender = useMemo(() => {
    const pairGenerator = {
      conversation: () => getConversationPairs(historyList, bookmarkedIds),
      question: () => getQuestionItems(historyList, bookmarkedIds),
      bookmark: () => getBookmarkedItems(historyList, bookmarkedIds)
    }[activeSubTab];
    return pairGenerator ? pairGenerator() : [];
  }, [activeSubTab, historyList, bookmarkedIds]);

  const handleSelectToggle = useCallback((id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  }, []);

  const handleSelectAllToggle = useCallback(() => {
    const visibleIds = listToRender.map(item => item.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(prev => allSelected ? prev.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...prev, ...visibleIds])));
  }, [listToRender, selectedIds]);

  const handleAddToBookmarks = useCallback(async () => {
    const unique = new Set([...bookmarkedIds, ...selectedIds]);
    const updated = Array.from(unique);
    await saveBookmarksData(user.uid, updated, setBookmarkedIds);
    setIsSelectMode(false);
    setSelectedIds([]);
    showAlert({
      title: language === 'id' ? 'Berhasil' : 'Success',
      message: translations[language].successAddBookmark,
      type: 'success',
    });
  }, [bookmarkedIds, selectedIds, user?.uid, language, showAlert]);

  const handleRemoveFromBookmarks = useCallback(async () => {
    const updated = bookmarkedIds.filter(id => !selectedIds.includes(id));
    await saveBookmarksData(user.uid, updated, setBookmarkedIds);
    setIsSelectMode(false);
    setSelectedIds([]);
    showAlert({
      title: language === 'id' ? 'Berhasil' : 'Success',
      message: translations[language].successRemoveBookmark,
      type: 'success',
    });
  }, [bookmarkedIds, selectedIds, user?.uid, language, showAlert]);

  const handleDeleteSelected = useCallback(async () => {
    const idsToDelete = getIdsToDelete(selectedIds, historyList);
    showAlert({
      title: language === 'id' ? 'Hapus Riwayat' : 'Delete History',
      message: language === 'id' 
        ? `Yakin ingin menghapus ${idsToDelete.length} riwayat percakapan terpilih?` 
        : `Are you sure you want to delete ${idsToDelete.length} selected conversation history?`,
      type: 'warning',
      confirmText: language === 'id' ? 'Hapus' : 'Delete',
      cancelText: language === 'id' ? 'Batal' : 'Cancel',
      onConfirm: async () => {
        await deleteHistoryMultiple({
          uid: user.uid,
          idsToDelete,
          historyList,
          setHistoryList,
          bookmarkedIds,
          setBookmarkedIds,
          setIsSelectMode,
          setSelectedIds,
          language,
          showAlert
        });
      }
    });
  }, [selectedIds, historyList, user?.uid, bookmarkedIds, language, showAlert]);

  const handleLongPressCard = useCallback((id) => {
    setIsSelectMode(true);
    handleSelectToggle(id);
  }, [handleSelectToggle]);

  const renderItem = useCallback(({ item }) => renderHistoryItem({
    item,
    selectedIds,
    isSelectMode,
    isDark,
    theme,
    handleSelectToggle,
    handleLongPressCard,
    setSelectedSolution,
    language
  }), [selectedIds, isSelectMode, isDark, theme, handleSelectToggle, handleLongPressCard, language]);

  const isAllSelected = useMemo(() => {
    const visibleIds = listToRender.map(item => item.id);
    return visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  }, [listToRender, selectedIds]);

  const activeTabLabel = {
    conversation: translations[language].conversation,
    question: translations[language].question,
    bookmark: translations[language].bookmark
  }[activeSubTab] || translations[language].bookmark;

  const handleTabChange = useCallback((tab) => {
    setActiveSubTab(tab);
    setIsSelectMode(false);
    setSelectedIds([]);
  }, []);

  const handleSelectConversationTab = useCallback(() => handleTabChange('conversation'), [handleTabChange]);
  const handleSelectQuestionTab = useCallback(() => handleTabChange('question'), [handleTabChange]);
  const handleSelectBookmarkTab = useCallback(() => handleTabChange('bookmark'), [handleTabChange]);

  const handleCloseSelectMode = useCallback(() => {
    setIsSelectMode(false);
    setSelectedIds([]);
  }, []);

  const handleSelectPress = useCallback(() => {
    if (isSelectMode) {
      handleSelectAllToggle();
    } else {
      setIsSelectMode(true);
    }
  }, [isSelectMode, handleSelectAllToggle]);

  const handleCloseSolution = useCallback(() => {
    setSelectedSolution(null);
  }, []);

  const tabStyles = useMemo(() => {
    return {
      conversationBtn: [styles.tabButton, activeSubTab === 'conversation' ? styles.tabActive : null],
      conversationTxt: [styles.tabText, theme.tabText, activeSubTab === 'conversation' ? styles.tabTextActive : null],
      questionBtn: [styles.tabButton, activeSubTab === 'question' ? styles.tabActive : null],
      questionTxt: [styles.tabText, theme.tabText, activeSubTab === 'question' ? styles.tabTextActive : null],
      bookmarkBtn: [styles.tabButton, activeSubTab === 'bookmark' ? styles.tabActive : null],
      bookmarkTxt: [styles.tabText, theme.tabText, activeSubTab === 'bookmark' ? styles.tabTextActive : null]
    };
  }, [activeSubTab, theme, styles]);

  const headerIconColor = isDark ? "#ffffff" : "#0f172a";
  const modalCloseColor = isDark ? "#ffffff" : "#0f172a";

  const listContainerStyle = useMemo(() => [
    styles.listContainer,
    isSelectMode ? { paddingBottom: 220 } : null
  ], [isSelectMode, styles]);

  const listFooter = useMemo(() => {
    if (listToRender.length > 0) {
      return <Text style={[styles.footerText, theme.emptyText]}>{translations[language].noMoreData}</Text>;
    }
    return null;
  }, [listToRender, theme, language, styles]);

  const pdfDetailNameStyle = useMemo(() => [
    styles.pdfMessageNameDetail,
    isDark ? { color: '#ffffff' } : { color: '#0f172a' }
  ], [isDark, styles]);

  let selectButtonText = translations[language].select;
  if (isSelectMode) {
    selectButtonText = isAllSelected
      ? translations[language].unselectAll
      : translations[language].selectAll;
  }

  return (
    <View style={[styles.container, theme.container]}>
      <View style={[styles.header, theme.header]}>
        <TouchableOpacity
          onPress={isSelectMode ? handleCloseSelectMode : onBack}
          style={styles.backButton}
        >
          <Ionicons
            name={isSelectMode ? "close" : "arrow-back"}
            size={24}
            color={headerIconColor}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, theme.headerText]}>{translations[language].history}</Text>

        <TouchableOpacity
          style={[styles.selectButton, theme.selectButton]}
          onPress={handleSelectPress}
        >
          <Text style={[styles.selectButtonText, theme.selectButtonText]}>
            {selectButtonText}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.tabContainer, theme.tabContainer]}>
        <TouchableOpacity
          style={tabStyles.conversationBtn}
          onPress={handleSelectConversationTab}
        >
          <Text style={tabStyles.conversationTxt}>
            {translations[language].conversation}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tabStyles.questionBtn}
          onPress={handleSelectQuestionTab}
        >
          <Text style={tabStyles.questionTxt}>
            {translations[language].question}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={tabStyles.bookmarkBtn}
          onPress={handleSelectBookmarkTab}
        >
          <Text style={tabStyles.bookmarkTxt}>
            {translations[language].bookmark}
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator color="#0ea5e9" size="large" />
        </View>
      ) : (
        <FlatList
          data={listToRender}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={listContainerStyle}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, theme.emptyText]}>{translations[language].noMoreData}</Text>
            </View>
          }
          ListFooterComponent={listFooter}
        />
      )}

      {isSelectMode && selectedIds.length > 0 && (
        <View style={[styles.bottomDrawer, theme.bottomDrawer]}>
          <Text style={[styles.drawerCountText, theme.drawerCountText]}>
            {selectedIds.length} {translations[language].selected} ({activeTabLabel})
          </Text>
          {renderDrawerButtons({
            activeSubTab,
            handleRemoveFromBookmarks,
            handleAddToBookmarks,
            handleDeleteSelected,
            theme,
            language,
            styles
          })}
        </View>
      )}

      <Modal
        visible={selectedSolution !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseSolution}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme.modalContent]}>
            <View style={[styles.modalHeader, theme.modalHeader]}>
              <Text style={[styles.modalTitle, theme.modalTitle]}>{translations[language].aiSolution}</Text>
              <TouchableOpacity onPress={handleCloseSolution} style={styles.modalCloseButton}>
                <Ionicons name="close" size={24} color={modalCloseColor} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalScroll}>
              {renderImageDetail(selectedSolution, styles)}
              {renderPdfDetail(selectedSolution, pdfDetailNameStyle, styles)}
              <Text style={[styles.modalQuestionTitle, theme.modalQuestionTitle]}>{translations[language].query}</Text>
              {renderFormattedText(selectedSolution?.question, true, theme, styles)}
              <View style={[styles.divider, theme.divider]} />
              <Text style={[styles.modalAnswerTitle, theme.modalAnswerTitle]}>{translations[language].aiExplanation}</Text>
              {renderFormattedText(selectedSolution?.answer, false, theme, styles)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121214',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e1e24',
    marginTop: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#27272a',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  selectButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e24',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#0ea5e9',
  },
  tabText: {
    color: '#a1a1aa',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  cardContainer: {
    marginBottom: 20,
  },
  dateHeader: {
    color: '#71717a',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    alignSelf: 'flex-start',
    backgroundColor: '#1e1e24',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    paddingRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCard: {
    flex: 1,
    backgroundColor: '#1e1e24',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
  },
  cardQuestionText: {
    color: '#e4e4e7',
    fontSize: 15,
    lineHeight: 22,
  },
  thumbnail: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    backgroundColor: '#27272a',
  },
  solutionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#27272a',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e1e24',
  },
  solutionButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '600',
  },
  footerText: {
    color: '#71717a',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 20,
  },
  bottomDrawer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1e1e24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#27272a',
  },
  drawerCountText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
  },
  drawerPurpleButton: {
    backgroundColor: '#0ea5e9',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  drawerButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  drawerButtonGroup: {
    width: '100%',
  },
  drawerDeleteButton: {
    backgroundColor: '#27272a',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  drawerDeleteButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1e1e24',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#27272a',
  },
  modalTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    padding: 20,
  },
  modalImage: {
    width: '100%',
    height: 240,
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#27272a',
  },
  modalQuestionTitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalQuestionText: {
    color: '#ffffff',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#27272a',
    marginBottom: 20,
  },
  modalAnswerTitle: {
    color: '#a1a1aa',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalAnswerText: {
    color: '#e4e4e7',
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 12,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
  markdownDivider: {
    height: 1,
    backgroundColor: '#27272a',
    marginVertical: 10,
    width: '100%',
  },
  pdfMessageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 8,
    marginBottom: 8,
    gap: 8,
    width: '100%',
  },
  pdfMessageName: {
    fontSize: 12,
    fontWeight: '700',
  },
  pdfMessageCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: 12,
    marginBottom: 16,
    gap: 12,
    width: '100%',
  },
  pdfMessageNameDetail: {
    fontSize: 14,
    fontWeight: '700',
  },
});
