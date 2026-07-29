import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { translations } from '../config/localization';
import { auth, db } from '../config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, GithubAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { sendOtpEmail } from '../config/emailService';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

GoogleSignin.configure({
  webClientId: '224132583967-5q8tjjhn8nv2rbuv2na4bsaeh7p6l2ku.apps.googleusercontent.com',
});

const GITHUB_CLIENT_ID = 'Ov23licpX4oDHgZbbuTa';
const GITHUB_CLIENT_SECRET = 'cbc07940e687be47896e6ab1d42dfcc95af374df';

export default function LoginScreen({ onBack, language = 'id', changeLanguage }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const generateOTP = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSendOtp = async (targetEmail) => {
    const otp = generateOTP();
    setGeneratedOtp(otp);

    const sent = await sendOtpEmail(targetEmail, otp);
    if (!sent) {
      alert("Gagal mengirim email OTP. Silakan periksa kembali email Anda.");
      return false;
    }
    return true;
  };

  const handleVerifyAndRegister = async () => {
    if (otpInput.trim().length !== 5) {
      alert("Harap masukkan 5 huruf OTP.");
      return;
    }
    setOtpVerifying(true);
    try {
      const inputCode = otpInput.toUpperCase().trim();

      if (generatedOtp === inputCode) {
        await createUserWithEmailAndPassword(auth, email, password);
        setShowOtpModal(false);
        setOtpInput('');
        setGeneratedOtp('');
        alert("Pendaftaran akun berhasil! Selamat datang di Mentora AI.");
      } else {
        alert("Kode OTP yang Anda masukkan salah.");
      }
    } catch (error) {
      let errMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errMsg = "Email sudah terdaftar. Silakan gunakan menu Log in.";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "Format email tidak valid.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "Password minimal harus 6 karakter.";
      }
      alert("Gagal registrasi: " + errMsg);
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpVerifying(true);
    const sent = await handleSendOtp(email);
    setOtpVerifying(false);
    if (sent) {
      alert("Kode OTP baru telah dikirim ke email Anda!");
    }
  };

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GITHUB_CLIENT_ID,
      scopes: ['read:user', 'user:email'],
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'mentora-app',
        path: 'redirect',
      }),
    },
    {
      authorizationEndpoint: 'https://github.com/login/oauth/authorize',
      tokenEndpoint: 'https://github.com/login/oauth/access_token',
    }
  );

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      handleGitHubLogin(code);
    }
  }, [response]);

  const handleGitHubLogin = async (code) => {
    setLoading(true);
    try {
      const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: AuthSession.makeRedirectUri({
            scheme: 'mentora-app',
            path: 'redirect',
          }),
          code_verifier: request?.codeVerifier,
        }),
      });
      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;
      if (!accessToken) {
        throw new Error(tokenData.error_description || tokenData.error || 'Akses token GitHub tidak ditemukan.');
      }
      const credential = GithubAuthProvider.credential(accessToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      alert("Gagal masuk dengan GitHub: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!email || !password) {
      alert("Harap isi email dan password Anda!");
      return;
    }
    setLoading(true);
    try {
      if (isRegistering) {
        const sent = await handleSendOtp(email);
        if (sent) {
          setShowOtpModal(true);
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      let errMsg = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errMsg = "Email sudah terdaftar. Silakan gunakan menu Log in.";
      } else if (error.code === 'auth/invalid-credential') {
        errMsg = "Email atau password salah.";
      } else if (error.code === 'auth/invalid-email') {
        errMsg = "Format email tidak valid.";
      } else if (error.code === 'auth/weak-password') {
        errMsg = "Password minimal harus 6 karakter.";
      }
      alert(errMsg);
    } finally {
      setLoading(false);
    }
  };


  const handleForgotPassword = async () => {
    if (!email) {
      alert("Harap masukkan email Anda terlebih dahulu pada kolom input!");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Link reset kata sandi telah dikirim ke email: ${email}. Silakan periksa kotak masuk Anda!`);
    } catch (error) {
      let errMsg = error.message;
      if (error.code === 'auth/invalid-email') {
        errMsg = "Format email tidak valid.";
      } else if (error.code === 'auth/user-not-found') {
        errMsg = "Email belum terdaftar.";
      }
      alert("Gagal mengirim link reset: " + errMsg);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response.data?.idToken || response.idToken;
      if (!idToken) {
        throw new Error('ID Token Google tidak ditemukan.');
      }
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
    } catch (error) {
      alert("Gagal login dengan Google: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, styles.loginBg]}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#f0f9ff" />
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.loginScrollContent}>
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={onBack}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#0f172a" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLangButton}
              onPress={() => changeLanguage(language === 'id' ? 'en' : 'id')}
              activeOpacity={0.7}
            >
              <Ionicons name="language" size={20} color="#0ea5e9" />
              <Text style={styles.loginLangText}>{language === 'id' ? 'ID' : 'EN'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.loginHeader}>
            <Text style={styles.loginTitle}>{isRegistering ? translations[language].signup : translations[language].login}</Text>
            <Text style={styles.loginSubtitle}>
              {translations[language].agreeTerms} <Text style={{ fontWeight: 'bold', color: '#0f172a' }}>{translations[language].termsOfUse}</Text>.
            </Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.inputLabel}>{translations[language].email}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="example@gmail.com"
                placeholderTextColor="#94a3b8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>{translations[language].password}</Text>
            <View style={[styles.inputWrapper, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
              <TextInput
                style={[styles.input, { flex: 1, paddingRight: 8 }]}
                placeholder="••••••••"
                placeholderTextColor="#94a3b8"
                secureTextEntry={secureText}
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity
                onPress={() => setSecureText(!secureText)}
                activeOpacity={0.7}
                style={{ padding: 4 }}
              >
                <Ionicons
                  name={secureText ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.helperLinksContainer}>
              {!isRegistering && (
                <TouchableOpacity
                  onPress={handleForgotPassword}
                  style={styles.forgotPasswordButton}
                >
                  <Text style={styles.forgotPasswordText}>{translations[language].forgotPassword}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={() => setIsRegistering(!isRegistering)}
                style={styles.toggleModeButton}
              >
                <Text style={styles.toggleModeText}>
                  {isRegistering ? translations[language].alreadyHaveAccount : translations[language].dontHaveAccount}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.loginSubmitButton}
              activeOpacity={0.8}
              onPress={handleConnect}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.loginSubmitButtonText}>
                  {isRegistering ? translations[language].register : translations[language].connect}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{translations[language].or}</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.socialContainer}>
            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
              onPress={handleGoogleSignIn}
              disabled={loading}
            >
              <Image
                source={require('../assets/Google_Logo.png')}
                style={styles.socialLogo}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>{translations[language].googleSignIn}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.socialButton}
              activeOpacity={0.7}
              onPress={() => promptAsync()}
              disabled={loading || !request}
            >
              <Image
                source={require('../assets/github-logo.png')}
                style={styles.socialLogo}
                resizeMode="contain"
              />
              <Text style={styles.socialButtonText}>{translations[language].githubSignIn}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.privacyText}>
            {translations[language].privacyText}
          </Text>
        </ScrollView>
      </SafeAreaView>

      {showOtpModal && (
        <View style={[StyleSheet.absoluteFillObject, styles.otpOverlay]}>
          <View style={styles.otpContainer}>
            <Text style={styles.otpTitle}>Verifikasi Email</Text>
            <Text style={styles.otpSubtitle}>
              Kami telah mengirimkan 5 huruf kode OTP ke email {email}. Silakan periksa kotak masuk/spam Anda dan masukkan kode di bawah:
            </Text>

            <TextInput
              style={styles.otpInput}
              value={otpInput}
              onChangeText={(val) => setOtpInput(val.toUpperCase())}
              placeholder="XXXXX"
              maxLength={5}
              autoCapitalize="characters"
              placeholderTextColor="#94a3b8"
            />

            <TouchableOpacity
              style={styles.otpVerifyButton}
              onPress={handleVerifyAndRegister}
              disabled={otpVerifying}
            >
              {otpVerifying ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.otpVerifyButtonText}>Verifikasi & Daftar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.otpActions}>
              <TouchableOpacity
                style={styles.otpResendButton}
                onPress={handleResendOtp}
                disabled={otpVerifying}
              >
                <Text style={styles.otpResendButtonText}>Kirim Ulang</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.otpCancelButton}
                onPress={() => {
                  setShowOtpModal(false);
                  setOtpInput('');
                }}
                disabled={otpVerifying}
              >
                <Text style={styles.otpCancelButtonText}>Batal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

    </KeyboardAvoidingView>
  );


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loginBg: {
    backgroundColor: '#f0f9ff',
  },
  loginScrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLangButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  loginLangText: {
    color: '#0f172a',
    marginLeft: 6,
    fontWeight: 'bold',
    fontSize: 14,
  },
  backButtonText: {
    fontSize: 20,
    color: '#0f172a',
    fontWeight: 'bold',
  },
  loginHeader: {
    marginBottom: 24,
  },
  loginTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  inputWrapper: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  input: {
    color: '#0f172a',
    fontSize: 16,
  },
  loginNotice: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 8,
    marginBottom: 20,
  },
  loginSubmitButton: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  loginSubmitButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#cbd5e1',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  socialContainer: {
    marginBottom: 30,
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    height: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  socialLogo: {
    width: 24,
    height: 24,
    marginRight: 12,
  },
  socialButtonText: {
    color: '#334155',
    fontSize: 15,
    fontWeight: '600',
  },
  privacyText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  toggleModeButton: {
    paddingVertical: 4,
  },
  toggleModeText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: '600',
  },
  helperLinksContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
    marginVertical: 14,
  },
  forgotPasswordButton: {
    paddingVertical: 4,
  },
  forgotPasswordText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  otpOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 999,
    elevation: 999,
  },
  otpContainer: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 10,
  },
  otpTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  otpSubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  otpInput: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 8,
    marginBottom: 20,
    backgroundColor: '#f8fafc',
  },
  otpVerifyButton: {
    width: '100%',
    backgroundColor: '#0ea5e9',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0ea5e9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  otpVerifyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  otpActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  otpResendButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  otpResendButtonText: {
    color: '#0ea5e9',
    fontWeight: '600',
    fontSize: 14,
  },
  otpCancelButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  otpCancelButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 14,
  }
});
