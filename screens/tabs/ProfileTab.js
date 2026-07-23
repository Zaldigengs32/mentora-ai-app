import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, Modal, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../../config/localization';
import { BACKEND_URL } from '../../config/backend';
import { auth } from '../../config/firebase';
import { updateProfile } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../config/AlertContext';


function getInitials(name) {
  if (!name) return 'M';
  const cleanName = name.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const parts = cleanName.split(' ');
  if (parts.length > 1 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0] ? parts[0][0].toUpperCase() : 'M';
}


function StatCard({ iconName, iconColor, loading, value, label, colors }) {
  return (
    <View style={[styles.statCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <Ionicons name={iconName} size={24} color={iconColor} />
      {loading ? (
        <ActivityIndicator size="small" color={iconColor} style={{ marginVertical: 4 }} />
      ) : (
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
      )}
      <Text style={[styles.statLabel, { color: colors.subText }]}>
        {label}
      </Text>
    </View>
  );
}


function SettingsRow({ iconName, iconColor, iconBg, label, colors, onPress, borderBottom, children }) {
  const content = (
    <View style={[styles.settingsRow, { borderBottomColor: borderBottom ? colors.border : 'transparent' }]}>
      <View style={styles.settingsRowLeft}>
        <View style={[styles.iconWrapper, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
        <Text style={[styles.settingsRowLabel, { color: colors.text }]}>
          {label}
        </Text>
      </View>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.7}
      >
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}


function EditProfileModal({
  visible,
  onClose,
  isDark,
  colors,
  language,
  avatarUri,
  localDisplayName,
  formFirstName,
  setFormFirstName,
  formLastName,
  setFormLastName,
  email,
  savingProfile,
  handleSelectAvatar,
  handleUpdateProfile,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.editScreenContainer, { backgroundColor: isDark ? '#121214' : '#ffffff' }]}>
        <View style={[styles.editHeader, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.editHeaderTitle, { color: colors.text }]}>
            {language === 'id' ? 'Edit Profil' : 'Edit Profile'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <ScrollView contentContainerStyle={styles.editScrollContent}>
          <View style={styles.editAvatarSection}>
            <TouchableOpacity onPress={handleSelectAvatar} activeOpacity={0.9}>
              <View style={[styles.largeAvatarCircle, { backgroundColor: colors.accent }]}>
                {avatarUri ? (
                  <Image source={{ uri: avatarUri }} style={styles.largeAvatarImage} />
                ) : (
                  <Text style={styles.largeAvatarText}>{getInitials(localDisplayName)}</Text>
                )}
                <View style={[styles.cameraBadge, { backgroundColor: isDark ? '#27272a' : '#f1f5f9' }]}>
                  <Ionicons name="camera" size={16} color={colors.accent} />
                </View>
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.editForm}>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.subText }]}>
                {language === 'id' ? 'Nama Depan' : 'First Name'}
              </Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e1e24' : '#f8fafc' }]}
                value={formFirstName}
                onChangeText={setFormFirstName}
                placeholder={language === 'id' ? 'Masukkan nama depan' : 'Enter first name'}
                placeholderTextColor={colors.subText}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.subText }]}>
                {language === 'id' ? 'Nama Belakang' : 'Last Name'}
              </Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, borderColor: colors.border, backgroundColor: isDark ? '#1e1e24' : '#f8fafc' }]}
                value={formLastName}
                onChangeText={setFormLastName}
                placeholder={language === 'id' ? 'Masukkan nama belakang' : 'Enter last name'}
                placeholderTextColor={colors.subText}
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.subText }]}>
                Email
              </Text>
              <TextInput
                style={[styles.formInput, { color: colors.subText, borderColor: colors.border, backgroundColor: isDark ? '#16161a' : '#f1f5f9', opacity: 0.7 }]}
                value={email}
                editable={false}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[styles.updateButton, { backgroundColor: colors.accent, shadowColor: colors.accent }]}
            onPress={handleUpdateProfile}
            disabled={savingProfile}
          >
            {savingProfile ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.updateButtonText}>
                {language === 'id' ? 'Perbarui' : 'Update'}
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function ProfileCard({
  localDisplayName,
  email,
  language,
  avatarUri,
  isDark,
  colors,
  onSelectAvatar,
  onOpenEditProfile,
}) {
  return (
    <View style={[styles.profileCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={styles.avatarWrapper}>
        <TouchableOpacity onPress={onSelectAvatar} activeOpacity={0.9}>
          <View style={styles.avatarCircle}>
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(localDisplayName)}</Text>
            )}
          </View>
        </TouchableOpacity>
        <View style={styles.statusIndicator} />
      </View>

      <Text style={[styles.welcomeText, { color: colors.text, marginBottom: 4 }]}>{localDisplayName}</Text>
      <Text style={[styles.emailText, { color: colors.subText, marginBottom: 16 }]}>{email}</Text>
      
      <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
        <TouchableOpacity 
          onPress={onOpenEditProfile} 
          style={[styles.editProfileBtn, { backgroundColor: isDark ? '#27272a' : '#f1f5f9', paddingHorizontal: 16, paddingVertical: 8 }]}
        >
          <Ionicons name="create-outline" size={14} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={[styles.editProfileBtnText, { color: colors.text }]}>
            {language === 'id' ? 'Edit Profil' : 'Edit Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LearningStats({ language, loadingStats, stats, colors }) {
  return (
    <View style={{ marginBottom: 24 }}>
      <Text style={[styles.sectionTitle, { color: colors.subText }]}>
        {language === 'id' ? 'Statistik Belajar' : 'Learning Stats'}
      </Text>
      <View style={styles.statsGrid}>
        <StatCard
          iconName="camera-outline"
          iconColor={colors.accent}
          loading={loadingStats}
          value={stats.scans}
          label={language === 'id' ? 'Pindai Soal' : 'Scans'}
          colors={colors}
        />
        <StatCard
          iconName="chatbubbles-outline"
          iconColor="#6366f1"
          loading={loadingStats}
          value={stats.chats}
          label={language === 'id' ? 'Tanya AI' : 'AI Chats'}
          colors={colors}
        />
        <StatCard
          iconName="trophy-outline"
          iconColor="#f59e0b"
          loading={false}
          value={`${stats.accuracy}%`}
          label={language === 'id' ? 'Akurasi Kuis' : 'Quiz Accuracy'}
          colors={colors}
        />
      </View>
    </View>
  );
}

function useProfileStateAndHandlers({
  user,
  language,
  changeLanguage,
}) {
  const { showAlert } = useAlert();
  const [stats, setStats] = useState({ scans: 0, chats: 0, accuracy: 85 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      setLoadingStats(true);
      
      const fetchChats = fetch(`${BACKEND_URL}/api/chat/history/${user.uid}`)
        .then(res => res.json())
        .catch(err => {
          return null;
        });

      const loadQuizStats = AsyncStorage.getItem(`quiz_stats_${user.uid}`)
        .then(val => {
          if (val) {
            return JSON.parse(val);
          }
          return { correct: 0, total: 0 };
        })
        .catch(err => {
          return { correct: 0, total: 0 };
        });

      Promise.all([fetchChats, loadQuizStats])
        .then(([chatData, quizStats]) => {
          let scansCount = 0;
          let chatsCount = 0;
          if (chatData && Array.isArray(chatData.data)) {
            scansCount = chatData.data.filter(item => item.image).length;
            chatsCount = chatData.data.filter(item => !item.image).length;
          }

          const currentAccuracy = quizStats && quizStats.total > 0
            ? Math.round((quizStats.correct / quizStats.total) * 100)
            : 0;

          setStats({
            scans: scansCount,
            chats: chatsCount,
            accuracy: currentAccuracy,
          });
        })
        .finally(() => setLoadingStats(false));
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  const [localDisplayName, setLocalDisplayName] = useState('');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [formFirstName, setFormFirstName] = useState('');
  const [formLastName, setFormLastName] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);

  useEffect(() => {
    if (user) {
      const dName = user.displayName || user.providerData?.[0]?.displayName || '';
      setLocalDisplayName(dName || (language === 'id' ? 'Pengguna Mentora' : 'Mentora User'));

      AsyncStorage.getItem(`profile_avatar_${user.uid}`).then(val => {
        if (val) setAvatarUri(val);
        else if (user.photoURL) setAvatarUri(user.photoURL);
      });

      const nameParts = dName.trim().split(' ');
      setFormFirstName(nameParts[0] || '');
      setFormLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [user, language]);

  const saveAvatar = async (selectedUri) => {
    setAvatarUri(selectedUri);
    await AsyncStorage.setItem(`profile_avatar_${user.uid}`, selectedUri);
    if (auth.currentUser) {
      await updateProfile(auth.currentUser, {
        photoURL: selectedUri
      });
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        title: language === 'id' ? 'Izin Ditolak' : 'Permission Denied',
        message: language === 'id' ? 'Akses kamera diperlukan untuk mengambil foto profil.' : 'Camera access is required to take profile photos.',
        type: 'warning',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await saveAvatar(result.assets[0].uri);
      }
    } catch (err) {
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert({
        title: language === 'id' ? 'Izin Ditolak' : 'Permission Denied',
        message: language === 'id' ? 'Akses galeri diperlukan untuk memilih foto profil.' : 'Gallery access is required to pick profile photos.',
        type: 'warning',
      });
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        await saveAvatar(result.assets[0].uri);
      }
    } catch (err) {
    }
  };

  const handleSelectAvatar = () => {
    showAlert({
      title: language === 'id' ? 'Ubah Foto Profil' : 'Change Profile Photo',
      message: language === 'id' ? 'Pilih metode untuk mengubah foto profil Anda:' : 'Choose a method to change your profile photo:',
      buttons: [
        { text: language === 'id' ? 'Ambil Foto' : 'Take Photo', onPress: takePhoto },
        { text: language === 'id' ? 'Pilih dari Galeri' : 'Choose from Gallery', onPress: pickImage },
        { text: language === 'id' ? 'Batal' : 'Cancel', style: 'cancel' }
      ]
    });
  };

  const handleUpdateProfile = async () => {
    if (!formFirstName.trim()) {
      showAlert({
        title: language === 'id' ? 'Peringatan' : 'Warning',
        message: language === 'id' ? 'Nama depan tidak boleh kosong.' : 'First name cannot be empty.',
        type: 'warning',
      });
      return;
    }

    setSavingProfile(true);
    try {
      const newDisplayName = (formFirstName.trim() + ' ' + formLastName.trim()).trim();
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, {
          displayName: newDisplayName
        });
      }

      await fetch(`${BACKEND_URL}/api/users/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: user.uid,
          email: user.email || user.providerData?.[0]?.email || '',
          displayName: newDisplayName
        })
      });

      setLocalDisplayName(newDisplayName);
      setIsEditProfileOpen(false);

      showAlert({
        title: language === 'id' ? 'Berhasil' : 'Success',
        message: language === 'id' ? 'Profil Anda berhasil diperbarui.' : 'Your profile has been updated successfully.',
        type: 'success',
      });
    } catch (error) {
      showAlert({
        title: 'Error',
        message: (language === 'id' ? 'Gagal memperbarui profil: ' : 'Failed to update profile: ') + error.message,
        type: 'error',
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const email = user?.email || user?.providerData?.[0]?.email || (language === 'id' ? 'Akun Terhubung' : 'Connected Account');

  const handleLanguageChange = () => {
    showAlert({
      title: language === 'id' ? 'Pilih Bahasa' : 'Select Language',
      message: language === 'id' ? 'Pilih bahasa aplikasi Anda' : 'Select your application language',
      buttons: [
        { text: 'Bahasa Indonesia', onPress: () => changeLanguage?.('id') },
        { text: 'English', onPress: () => changeLanguage?.('en') },
        { text: language === 'id' ? 'Batal' : 'Cancel', style: 'cancel' }
      ]
    });
  };

  return {
    stats,
    loadingStats,
    localDisplayName,
    isEditProfileOpen,
    setIsEditProfileOpen,
    formFirstName,
    setFormFirstName,
    formLastName,
    setFormLastName,
    savingProfile,
    avatarUri,
    handleSelectAvatar,
    handleUpdateProfile,
    email,
    handleLanguageChange,
  };
}

export default function ProfileTab({ 
  user, 
  onLogout, 
  language = 'id', 
  changeLanguage,
  appearanceMode = 'dark',
  changeAppearanceMode,
  isDark 
}) {
  const {
    stats,
    loadingStats,
    localDisplayName,
    isEditProfileOpen,
    setIsEditProfileOpen,
    formFirstName,
    setFormFirstName,
    formLastName,
    setFormLastName,
    savingProfile,
    avatarUri,
    handleSelectAvatar,
    handleUpdateProfile,
    email,
    handleLanguageChange,
  } = useProfileStateAndHandlers({
    user,
    language,
    changeLanguage,
  });

  const colors = {
    bg: isDark ? '#121214' : '#f0f9ff',
    cardBg: isDark ? '#1e1e24' : '#ffffff',
    text: isDark ? '#ffffff' : '#0f172a',
    subText: isDark ? '#a1a1aa' : '#64748b',
    border: isDark ? '#2d2d34' : '#e2e8f0',
    accent: '#0ea5e9',
    accentLight: isDark ? 'rgba(14, 165, 233, 0.15)' : 'rgba(14, 165, 233, 0.08)',
    badgeBg: isDark ? '#1e293b' : '#e0f2fe',
    badgeText: '#0284c7'
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={styles.contentContainer}>
      <ProfileCard
        localDisplayName={localDisplayName}
        email={email}
        language={language}
        avatarUri={avatarUri}
        isDark={isDark}
        colors={colors}
        onSelectAvatar={handleSelectAvatar}
        onOpenEditProfile={() => setIsEditProfileOpen(true)}
      />

      <LearningStats
        language={language}
        loadingStats={loadingStats}
        stats={stats}
        colors={colors}
      />

      <Text style={[styles.sectionTitle, { color: colors.subText }]}>
        {language === 'id' ? 'Pengaturan Aplikasi' : 'App Settings'}
      </Text>
      
      <View style={[styles.settingsGroup, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
        <SettingsRow
          iconName="globe-outline"
          iconColor={colors.accent}
          iconBg="rgba(14, 165, 233, 0.15)"
          label={language === 'id' ? 'Bahasa Aplikasi' : 'App Language'}
          colors={colors}
          onPress={handleLanguageChange}
          borderBottom={true}
        >
          <View style={styles.settingsRowRight}>
            <Text style={[styles.settingsValueText, { color: colors.subText }]}>
              {language === 'id' ? 'Bahasa Indonesia' : 'English'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.subText} />
          </View>
        </SettingsRow>
        <SettingsRow
          iconName={isDark ? "moon" : "sunny-outline"}
          iconColor="#6366f1"
          iconBg="rgba(99, 102, 241, 0.15)"
          label={language === 'id' ? 'Mode Gelap' : 'Dark Mode'}
          colors={colors}
        >
          <Switch
            value={appearanceMode === 'dark'}
            onValueChange={(val) => changeAppearanceMode?.(val ? 'dark' : 'light')}
            trackColor={{ false: '#cbd5e1', true: '#93c5fd' }}
            thumbColor={appearanceMode === 'dark' ? colors.accent : '#f4f4f5'}
          />
        </SettingsRow>
      </View>

      <View style={[styles.settingsGroup, { backgroundColor: colors.cardBg, borderColor: colors.border, marginTop: 16 }]}>
        <SettingsRow
          iconName="information-circle-outline"
          iconColor={colors.subText}
          iconBg={isDark ? '#27272a' : '#f1f5f9'}
          label={language === 'id' ? 'Versi Aplikasi' : 'App Version'}
          colors={colors}
        >
          <Text style={[styles.settingsValueText, { color: colors.subText }]}>v1.0.0</Text>
        </SettingsRow>
      </View>

      <TouchableOpacity 
        style={[styles.logoutButton, { borderColor: '#ef4444' }]} 
        activeOpacity={0.7}
        onPress={onLogout}
      >
        <Ionicons name="log-out-outline" size={20} color="#ef4444" style={{ marginRight: 8 }} />
        <Text style={styles.logoutButtonText}>{translations[language].logout}</Text>
      </TouchableOpacity>

      <EditProfileModal
        visible={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        isDark={isDark}
        colors={colors}
        language={language}
        avatarUri={avatarUri}
        localDisplayName={localDisplayName}
        formFirstName={formFirstName}
        setFormFirstName={setFormFirstName}
        formLastName={formLastName}
        setFormLastName={setFormLastName}
        email={email}
        savingProfile={savingProfile}
        handleSelectAvatar={handleSelectAvatar}
        handleUpdateProfile={handleUpdateProfile}
      />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 120, 
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#0ea5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#10b981',
    borderWidth: 3,
    borderColor: '#ffffff', 
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  emailText: {
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginLeft: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 18,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  settingsGroup: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent', 
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingsRowLabel: {
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  settingsRowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    flex: 1,
  },
  settingsValueText: {
    fontSize: 14,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  logoutButton: {
    flexDirection: 'row',
    borderWidth: 1.5,
    paddingVertical: 14,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '90%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  textInput: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1.5,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  saveBtn: {
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  editScreenContainer: {
    flex: 1,
  },
  editHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  editHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  editScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  editAvatarSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  largeAvatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  largeAvatarText: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
    elevation: 3,
  },
  editForm: {
    marginBottom: 24,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  updateButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  updateButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  avatarImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  largeAvatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
