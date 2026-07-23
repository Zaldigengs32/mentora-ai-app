import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Image, 
  TouchableOpacity, 
  StatusBar,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../config/localization';

export default function OnboardingScreen({ onNext, language = 'id', changeLanguage }) {
  return (
    <View style={[styles.container, styles.whiteBg]}>
      <StatusBar barStyle="light-content" backgroundColor="#0ea5e9" translucent={true} />
      
      <View style={[styles.onboardingTop, styles.skyBlueBg]}>
        <TouchableOpacity 
          style={styles.langButton} 
          onPress={() => changeLanguage(language === 'id' ? 'en' : 'id')}
          activeOpacity={0.7}
        >
          <Ionicons name="language" size={20} color="#ffffff" />
          <Text style={styles.langText}>{language === 'id' ? 'ID' : 'EN'}</Text>
        </TouchableOpacity>

        <View style={[styles.circleDeco, { top: 40, right: 30, width: 120, height: 120, opacity: 0.15 }]} />
        <Image 
          source={require('../assets/chimp_learning.png')} 
          style={styles.onboardingIllustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.onboardingBottom}>
        <View style={styles.onboardingTextContainer}>
          <Text style={styles.onboardingSlideTitle}>{translations[language].onboardingTitle}</Text>
          <Text style={styles.onboardingSlideDesc}>
            {translations[language].onboardingDesc}
          </Text>
        </View>

        <View style={styles.onboardingControls}>
          <TouchableOpacity 
            style={styles.onboardingLoginButton} 
            onPress={onNext}
            activeOpacity={0.85}
          >
            <Text style={styles.onboardingLoginButtonText}>{translations[language].login}</Text>
          </TouchableOpacity>
        </View>
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
  whiteBg: {
    backgroundColor: '#ffffff',
  },
  circleDeco: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#ffffff',
  },
  onboardingTop: {
    height: '52%',
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  onboardingIllustration: {
    width: 350,
    height: 350,
    marginTop: 20,
  },
  onboardingBottom: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    justifyContent: 'space-between',
  },
  onboardingTextContainer: {
    alignItems: 'flex-start',
  },
  onboardingSlideTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
    lineHeight: 36,
  },
  onboardingSlideDesc: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  onboardingControls: {
    width: '100%',
    marginTop: 10,
  },
  onboardingLoginButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 25,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 10,
  },
  onboardingLoginButtonText: {
    color: '#ffffff',
    fontSize: 16,
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
