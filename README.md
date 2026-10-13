<div align="center">

# 🎓 Mentora — Aplikasi Belajar Berbasis AI

![React Native](https://img.shields.io/badge/React_Native-0.81.5-61DAFB?style=for-the-badge&logo=react&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54.0-000020?style=for-the-badge&logo=expo&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-12.15-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)
![Google AI](https://img.shields.io/badge/Gemini_AI-Google-4285F4?style=for-the-badge&logo=google&logoColor=white)
![Android](https://img.shields.io/badge/Android-3DDC84?style=for-the-badge&logo=android&logoColor=white)

**Aplikasi mobile pembelajaran berbasis AI dengan fitur chat pintar, quiz interaktif, scan dokumen, dan autentikasi Google.**

</div>

---

## ✨ Fitur Unggulan

| Fitur | Deskripsi |
|-------|-----------|
| 🤖 **Chat AI** | Tanya jawab dengan AI (Gemini) seputar materi belajar |
| 🧠 **Quiz Interaktif** | Latihan soal otomatis berbasis AI |
| 📸 **Scan Dokumen** | Scan materi fisik menggunakan kamera |
| 📂 **Upload File** | Upload dokumen PDF/gambar untuk dianalisis AI |
| 📜 **Riwayat Chat** | Simpan & akses ulang percakapan sebelumnya |
| 👤 **Profil Pengguna** | Manajemen akun & pengaturan |
| 🔐 **Google Sign-In** | Login mudah dengan akun Google |
| 🎉 **Onboarding** | Tampilan selamat datang untuk user baru |

---

## 🛠️ Tech Stack

- **Framework:** React Native 0.81.5
- **Platform:** Expo ~54.0
- **Backend & Auth:** Firebase 12.15
- **AI Engine:** Google Gemini AI
- **Auth Provider:** Google Sign-In
- **Storage:** AsyncStorage
- **Camera & File:** Expo Camera, Expo Image Picker, Expo Document Picker
- **Build:** EAS Build (Expo Application Services)

---

## 🔄 Alur Aplikasi

```
🎉 Welcome Screen
      ↓
📖 Onboarding Screen
      ↓
🔐 Login (Google Sign-In)
      ↓
🏠 Dashboard
      ↓
┌────────────────────────────────────┐
│  Chat  │  Quiz  │  Scan  │  History │  Profile  │
└────────────────────────────────────┘
```

---

## 🚀 Cara Menjalankan

### Prerequisites
- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio / Emulator / HP Android
- Akun Firebase (untuk konfigurasi)

### Setup & Run
```bash
# Clone repo
git clone https://github.com/Zaldigengs32/mentora-ai-app.git
cd mentora-ai-app

# Install dependencies
npm install

# Jalankan di Expo Go
npx expo start

# Atau langsung ke Android
npx expo run:android
```

### Konfigurasi Firebase
1. Buat project di [Firebase Console](https://console.firebase.google.com/)
2. Download `google-services.json` dan letakkan di root project
3. Aktifkan **Authentication** → Google Sign-In
4. Setup **Firestore** untuk penyimpanan data

---

## 📁 Struktur Project

```
mentora-project/
├── assets/              # Gambar & icon aplikasi
├── components/
│   └── CustomAlert.js   # Komponen alert kustom
├── config/              # Konfigurasi Firebase & API
├── screens/
│   ├── WelcomeScreen.js    # Halaman selamat datang
│   ├── OnboardingScreen.js # Halaman onboarding
│   ├── LoginScreen.js      # Login Google
│   ├── DashboardScreen.js  # Halaman utama
│   └── tabs/
│       ├── ChatTab.js      # Chat dengan AI
│       ├── QuizTab.js      # Quiz interaktif
│       ├── ScanTab.js      # Scan dokumen
│       ├── HistoryTab.js   # Riwayat chat
│       └── ProfileTab.js   # Profil pengguna
├── App.js
├── app.json
└── eas.json             # Konfigurasi EAS Build
```

---

## 👥 Tim Pengembang

> Dibuat dengan ❤️ oleh **Muhamad Zaldi Aprialdi**

---

## 📄 License

Project ini menggunakan lisensi [MIT](LICENSE).

---

<div align="center">
<sub>⭐ Kalau project ini bermanfaat, jangan lupa kasih bintang!</sub>
</div>
