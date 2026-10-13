import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../config/localization';

export default function WelcomeScreen({ onNext, language = 'id', changeLanguage }) {
  return (
    <View style={[styles.container, styles.skyBlueBg]}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" translucent={true} />
    
      <TouchableOpacity 
        style={styles.langButton} 
        onPress={() => changeLanguage(language === 'id' ? 'en' : 'id')}
        activeOpacity={0.7}
      >
        <Ionicons name="language" size={20} color="#ffffff" />
        <Text style={styles.langText}>{language === 'id' ? 'ID' : 'EN'}</Text>
      </TouchableOpacity>

      <View style={styles.splashContent}>
        <View style={[styles.circleDeco, { top: 40, left: -20, width: 150, height: 150, opacity: 0.15 }]} />
        <View style={[styles.circleDeco, { top: 120, right: -40, width: 180, height: 180, opacity: 0.1 }]} />
        
        <View style={styles.mascotContainer}>
          <Image 
            source={require('../assets/chimp_mascot.png')} 
            style={styles.welcomeMascot}
            resizeMode="contain"
          />
        </View>

        <View style={styles.welcomeTextContainer}>
          <Text style={styles.welcomeTitle}>{translations[language].welcomeTitle}</Text>
          <Text style={styles.welcomeSubtitle}>{translations[language].welcomeSubtitle}</Text>
        </View>

        <TouchableOpacity 
          style={styles.welcomeButton} 
          activeOpacity={0.85}
          onPress={onNext}
        >
          <Text style={styles.welcomeButtonText}>{translations[language].startExploring}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skyBlueBg: {
    backgroundColor: '#0ea5e9',
  },
  circleDeco: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  splashContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 50,
    paddingHorizontal: 24,
  },
  mascotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
  },
  welcomeMascot: {
    width: 390,
    height: 390,
  },
  welcomeTextContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 38,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1.5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#e0f2fe',
    marginTop: 6,
    fontWeight: '600',
  },
  welcomeButton: {
    backgroundColor: '#ffffff',
    paddingVertical: 18,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  welcomeButtonText: {
    color: '#0ea5e9',
    fontSize: 18,
    fontWeight: 'bold',
  },
  langButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  langText: {
    color: '#ffffff',
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
