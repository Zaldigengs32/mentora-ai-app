import React, { useState, useEffect } from 'react';
import WelcomeScreen from './screens/WelcomeScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { View, ActivityIndicator, LogBox } from 'react-native';
import { useFonts } from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { AlertProvider } from './config/AlertContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

LogBox.ignoreAllLogs();

export default function App() {
  const [screen, setScreen] = useState(0);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [language, setLanguage] = useState('id');

  const [fontsLoaded] = useFonts({
    ...Ionicons.font,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usr) => {
      setUser(usr);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    AsyncStorage.getItem('app_language').then(val => {
      if (val) setLanguage(val);
    });
  }, []);

  const changeLanguage = async (newLang) => {
    setLanguage(newLang);
    await AsyncStorage.setItem('app_language', newLang);
  };

  if (loading || !fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f9ff' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const renderScreen = () => {
    if (user) {
      return <DashboardScreen />;
    }

    switch(screen) {
      case 0:
        return <WelcomeScreen onNext={() => setScreen(1)} language={language} changeLanguage={changeLanguage} />;
      case 1:
        return <OnboardingScreen onNext={() => setScreen(2)} language={language} changeLanguage={changeLanguage} />;
      case 2:
        return <LoginScreen onBack={() => setScreen(1)} language={language} changeLanguage={changeLanguage} />;
      default:
        return <WelcomeScreen onNext={() => setScreen(1)} language={language} changeLanguage={changeLanguage} />;
    }
  };

  return (
    <AlertProvider>
      {renderScreen()}
    </AlertProvider>
  );
}
