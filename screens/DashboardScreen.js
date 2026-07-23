import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  Keyboard,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { BACKEND_URL } from '../config/backend';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations } from '../config/localization';
import { useAlert } from '../config/AlertContext';

import ScanTab from './tabs/ScanTab';
import ChatTab from './tabs/ChatTab';
import QuizTab from './tabs/QuizTab';
import ProfileTab from './tabs/ProfileTab';
import HistoryTab from './tabs/HistoryTab';

const syncUserToBackend = (user) => {
  if (user) {
    fetch(`${BACKEND_URL}/api/users/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: user.uid,
        email: user.email || user.providerData?.[0]?.email || '',
        displayName: user.displayName || user.providerData?.[0]?.displayName || 'Pengguna Mentora'
      })
    }).catch(() => { });
  }
};

const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

function useChatApi(user, language, setMessages, setChatLoading, abortControllerRef) {
  const { showAlert } = useAlert();

  const sendImagesToChat = async (uris, base64s, startNewChat = false, customText = '') => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const displayImage = uris.join(',');

    const userMessageId = Date.now().toString();
    const newUserMessage = {
      id: userMessageId,
      text: customText || '',
      sender: 'user',
      image: displayImage,
    };

    if (startNewChat) {
      setMessages([
        {
          id: '1',
          text: translations[language].welcomeMessage,
          sender: 'ai',
          image: null,
        },
        newUserMessage
      ]);
    } else {
      setMessages(prev => [...prev, newUserMessage]);
    }

    setChatLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: user ? user.uid : null,
          text: customText.trim()
            ? `${customText.trim()}\n\n(Jelaskan dan selesaikan soal di dalam gambar ini secara terperinci. Langsung berikan inti jawaban dan langkah penyelesaian tanpa basa-basi pembuka atau mengulang instruksi saya. Gunakan format yang rapi.)`
            : 'Jelaskan dan selesaikan soal di dalam gambar ini secara terperinci. Langsung berikan inti jawaban dan langkah penyelesaian tanpa basa-basi pembuka (seperti "Baik, mari kita selesaikan...") atau mengulang instruksi saya. Gunakan format yang rapi.',
          image: null,
          images: base64s,
        }),
      });

      const data = await response.json();
      const aiResponseText = data.data?.text || 'Gagal memproses gambar soal.';

      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        image: null,
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      showAlert({
        title: language === 'id' ? 'Gagal Memproses Gambar' : 'Failed to Process Image',
        message: error.message,
        type: 'error',
      });
    } finally {
      if (abortControllerRef.current === controller) {
        setChatLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const sendImageToChat = async (uriOrBase64, base64 = null, startNewChat = false, customText = '') => {
    const finalBase64 = base64 || uriOrBase64;
    const finalUri = base64 ? uriOrBase64 : uriOrBase64;
    await sendImagesToChat([finalUri], [finalBase64], startNewChat, customText);
  };

  const sendTextMessage = async (textVal = '') => {
    const userText = textVal.trim();
    if (!userText) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessageId = Date.now().toString();
    const newUserMessage = {
      id: userMessageId,
      text: userText,
      sender: 'user',
      image: null,
    };
    setMessages(prev => [...prev, newUserMessage]);
    setChatLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: user ? user.uid : null,
          text: userText,
          image: null,
        }),
      });

      const data = await response.json();
      const aiResponseText = data.data?.text || 'Gagal mendapatkan jawaban dari AI.';

      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        image: null,
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      showAlert({
        title: language === 'id' ? 'Gagal Mengirim Pesan' : 'Failed to Send Message',
        message: error.message,
        type: 'error',
      });
    } finally {
      if (abortControllerRef.current === controller) {
        setChatLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const sendPdfToChat = async (uri, base64, pdfName, pdfSize, customText = '') => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const userMessageId = Date.now().toString();
    const newUserMessage = {
      id: userMessageId,
      text: customText || '',
      sender: 'user',
      pdf: uri,
      pdfName: pdfName,
      pdfSize: formatBytes(pdfSize),
    };

    setMessages(prev => [...prev, newUserMessage]);
    setChatLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/api/chat/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
        body: JSON.stringify({
          userId: user ? user.uid : null,
          text: customText.trim()
            ? `${customText.trim()}\n\n(Membaca berkas PDF: ${pdfName}. Selesaikan soal atau jelaskan isinya.)`
            : `Membaca berkas PDF: ${pdfName}. Selesaikan soal atau jelaskan isinya.`,
          image: null,
          pdf: base64,
        }),
      });

      const data = await response.json();
      const aiResponseText = data.data?.text || 'Gagal memproses berkas PDF.';

      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        text: aiResponseText,
        sender: 'ai',
        image: null,
        pdf: null,
      };
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      showAlert({
        title: language === 'id' ? 'Gagal Memproses PDF' : 'Failed to Process PDF',
        message: error.message,
        type: 'error',
      });
    } finally {
      if (abortControllerRef.current === controller) {
        setChatLoading(false);
        abortControllerRef.current = null;
      }
    }
  };

  const cancelThinking = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setChatLoading(false);
  };

  return {
    sendImageToChat,
    sendImagesToChat,
    sendTextMessage,
    sendPdfToChat,
    cancelThinking,
  };
}

const TABS = [
  { id: 'camera', activeIcon: 'camera', inactiveIcon: 'camera-outline', labelKey: 'scan' },
  { id: 'chat', activeIcon: 'chatbubble-ellipses', inactiveIcon: 'chatbubble-ellipses-outline', labelKey: 'chatAi' },
  { id: 'quiz', activeIcon: 'document-text', inactiveIcon: 'document-text-outline', labelKey: 'quiz' },
  { id: 'profile', activeIcon: 'person', inactiveIcon: 'person-outline', labelKey: 'profile' },
];

function DashboardContent({
  activeTab,
  messages,
  chatLoading,
  handleSendMessage,
  handleNewConversation,
  setActiveTab,
  cancelThinking,
  user,
  handleLogout,
  language,
  changeLanguage,
  appearanceMode,
  changeAppearanceMode,
  isDark,
  handleImageScanned
}) {
  switch (activeTab) {
    case 'chat':
      return (
        <ChatTab
          messages={messages}
          chatLoading={chatLoading}
          onSendMessage={handleSendMessage}
          onNewConversation={handleNewConversation}
          onShowHistory={() => setActiveTab('history')}
          onCancelThinking={cancelThinking}
          user={user}
          onLogout={handleLogout}
          language={language}
          changeLanguage={changeLanguage}
          appearanceMode={appearanceMode}
          changeAppearanceMode={changeAppearanceMode}
          isDark={isDark}
        />
      );
    case 'quiz':
      return <QuizTab language={language} isDark={isDark} user={user} />;
    case 'profile':
      return (
        <ProfileTab
          user={user}
          onLogout={handleLogout}
          language={language}
          changeLanguage={changeLanguage}
          appearanceMode={appearanceMode}
          changeAppearanceMode={changeAppearanceMode}
          isDark={isDark}
        />
      );
    case 'history':
      return <HistoryTab user={user} onBack={() => setActiveTab('camera')} language={language} isDark={isDark} />;
    case 'camera':
    default:
      return (
        <ScanTab
          onImageScanned={handleImageScanned}
          onShowHistory={() => setActiveTab('history')}
          language={language}
          isDark={isDark}
        />
      );
  }
}

export default function DashboardScreen() {
  const user = auth.currentUser;
  const { showAlert } = useAlert();
  const [activeTab, setActiveTab] = useState('camera');

  const [messages, setMessages] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [language, setLanguage] = useState('id');
  const [appearanceMode, setAppearanceMode] = useState('dark');
  const abortControllerRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSubscription = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const {
    sendImageToChat,
    sendImagesToChat,
    sendTextMessage,
    sendPdfToChat,
    cancelThinking,
  } = useChatApi(user, language, setMessages, setChatLoading, abortControllerRef);

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(val => {
      if (val) setLanguage(val);
    });
    AsyncStorage.getItem('app_appearance').then(val => {
      if (val && val !== 'system') setAppearanceMode(val);
      else setAppearanceMode('dark');
    });
  }, []);

  useEffect(() => {
    setMessages(prev => {
      if (prev.length <= 1) {
        return [
          {
            id: '1',
            text: translations[language].welcomeMessage,
            sender: 'ai',
            image: null,
          }
        ];
      }
      return prev;
    });
  }, [language]);

  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  const changeAppearanceMode = async (mode) => {
    setAppearanceMode(mode);
    await AsyncStorage.setItem('app_appearance', mode);
  };

  useEffect(() => {
    syncUserToBackend(user);
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      showAlert({
        title: language === 'id' ? 'Logout Gagal' : 'Logout Failed',
        message: error.message,
        type: 'error',
      });
    }
  };

  const handleImageScanned = (uri, base64) => {
    setActiveTab('chat');
    sendImageToChat(uri, base64, true);
  };

  const handleNewConversation = () => {
    setMessages([
      {
        id: '1',
        text: translations[language].welcomeMessage,
        sender: 'ai',
        image: null,
      }
    ]);
  };

  const handleSendMessage = async (text, attachment = null) => {
    if (!attachment) {
      await sendTextMessage(text);
      return;
    }
    if (Array.isArray(attachment)) {
      if (attachment.length === 0) {
        await sendTextMessage(text);
        return;
      }
      const images = attachment.filter(a => a.type === 'image');
      const pdfs = attachment.filter(a => a.type === 'pdf');

      if (images.length > 0) {
        const uris = images.map(img => img.uri);
        const base64s = images.map(img => img.base64);
        await sendImagesToChat(uris, base64s, false, text);
      } else if (pdfs.length > 0) {
        const firstPdf = pdfs[0];
        await sendPdfToChat(firstPdf.uri, firstPdf.base64, firstPdf.name, firstPdf.size, text);
      }
      return;
    }
    if (attachment.type === 'image') {
      await sendImageToChat(attachment.uri, attachment.base64, false, text);
    } else if (attachment.type === 'pdf') {
      await sendPdfToChat(attachment.uri, attachment.base64, attachment.name, attachment.size, text);
    }
  };

  const isDark = appearanceMode === 'dark';

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.bgDark : styles.bgLight]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#121214' : '#f0f9ff'}
      />

      <View style={styles.mainContent}>
        <DashboardContent
          activeTab={activeTab}
          messages={messages}
          chatLoading={chatLoading}
          handleSendMessage={handleSendMessage}
          handleNewConversation={handleNewConversation}
          setActiveTab={setActiveTab}
          cancelThinking={cancelThinking}
          user={user}
          handleLogout={handleLogout}
          language={language}
          changeLanguage={changeLanguage}
          appearanceMode={appearanceMode}
          changeAppearanceMode={changeAppearanceMode}
          isDark={isDark}
          handleImageScanned={handleImageScanned}
        />
      </View>

      {activeTab !== 'history' && !keyboardVisible && (
        <View style={[
          styles.bottomTabBar, 
          {
            backgroundColor: isDark ? 'rgba(30, 30, 36, 0.85)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
            borderWidth: 1,
            borderRadius: 24,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.3 : 0.1,
            shadowRadius: 12,
            elevation: 8,
          }
        ]}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tabButton}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.6}
              >
                <Ionicons
                  name={isActive ? tab.activeIcon : tab.inactiveIcon}
                  size={24}
                  color={isActive ? '#0ea5e9' : '#94a3b8'}
                  style={isActive ? styles.tabIconActive : null}
                />
                <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : null]}>
                  {translations[language][tab.labelKey]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgLight: {
    backgroundColor: '#f0f9ff',
  },
  bgDark: {
    backgroundColor: '#121214',
  },
  mainContent: {
    flex: 1,
  },
  bottomTabBar: {
    position: 'absolute',
    bottom: 10,
    left: 20,
    right: 20,
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  tabIcon: {
    fontSize: 20,
    color: '#94a3b8',
    marginBottom: 4,
  },
  tabIconActive: {
    transform: [{ scale: 1.15 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  tabLabelActive: {
    color: '#0ea5e9',
  },
});
