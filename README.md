# ConcertID Mobile 🎵

React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.  
Versi mobile dari [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

---

## Tech Stack

- React Native + Expo SDK 54 + TypeScript
- React Navigation 6 (Bottom Tabs + Stack)
- AsyncStorage untuk persistensi lokal
- expo-image-picker + expo-image-manipulator untuk upload foto

---

## Fitur

### 🗂 Data Konser
- **38 konser** 2025–2027 — sama persis dengan website
- Status: Confirmed, Rumor, Past
- Field lengkap: Genre, Platform Tiket, Range Harga, Kategori Tiket, Venue, Promotor, Lineup, Sources

### 🏠 Home Screen
- Hot Concerts carousel
- Stats: total confirmed, rumor, past
- Search artis / venue / kota
- Filter: genre (K-Pop, Pop, Rock, Jazz, Indie), status (Confirmed, Rumor, Past, Upcoming, Wishlist)
- Sort: tanggal terdekat/terjauh, harga terendah/tertinggi, nama A-Z

### 📋 Detail Screen (urutan sesuai website)
- Hero image + badge status
- Info rows: Tanggal, Waktu, Venue, Promotor, Genre, Platform Tiket, Range Harga
- Tombol **Google Maps** → buka lokasi venue
- Kategori tiket + tombol **Beli Tiket Sekarang** (confirmed upcoming)
- Tambah ke Google Calendar (confirmed upcoming)
- **Been There** (konser past)
- **Going / Interested** counter
  - Past: angka dummy persist, disabled
  - Confirmed & Rumor: actual dari 0, bisa vote
- **Spotify Preview** → buka artis di Spotify
- Deskripsi + Lineup
- Social Media (Instagram, Twitter)
- **Forum Jual Beli Tiket** (disabled untuk past & rumor)
- **Cari Teman Nonton** (disabled untuk past & rumor)
- Sumber berita
- Tab **Setlist** — aktual + prediksi
- Tab **Diskusi** — komentar + reply + like (form disabled untuk past)
- Tab **Review** — rating bintang 1–5 + review text (hanya konser past) + **Foto dari Fans** (upload via galeri, hanya past)

### 📅 Kalender
- Grid kalender per bulan
- Dot warna per genre
- List konser per tanggal

### ❤️ Wishlist
- Simpan konser favorit
- Persist via AsyncStorage

### 📩 Newsletter & Feedback
- Subscribe newsletter → Mailchimp via `/api/subscribe` Vercel proxy
- **Kritik & Saran** → EmailJS (service `service_lq3pvsq`, template `template_w8grsoa`)
  - Support lampiran foto (auto-compress ke ≤30KB sebelum kirim)
  - Kategori: Kritik, Saran, Data Salah, Lainnya
- Instagram & Twitter: coming soon (belum ada akun)

### ⚙️ Lainnya
- Share: WhatsApp, Telegram, native share, copy link
- Dark / Light mode
- Multi-bahasa ID / EN
- Panduan status konser
- Daftar venue & platform tiket Jakarta

---

## Setup

```bash
npm install
npx expo start
```

Scan QR dengan **Expo Go** (iOS/Android).

---

## Struktur Folder

```
src/
├── components/     # ConcertCard, FilterBar, SearchBar, ShareSheet, SortPicker, Toast
├── constants/      # colors.ts, strings.ts (ID + EN)
├── context/        # ThemeContext, LanguageContext, WishlistContext
├── data/           # concerts.ts (38 konser, ARTIST_SOCIALS, SETLISTS, SPOTIFY_ARTISTS)
├── hooks/          # useSocialFeatures, useDiscussion, useReviews, useBeenThere,
│                   # useTicketMarket, useGroupBuying, useFanPhotos, useWishlist
├── navigation/     # AppNavigator.tsx
├── screens/        # HomeScreen, DetailScreen, CalendarScreen, WishlistScreen,
│                   # NewsletterScreen, MoreScreen
├── types/          # index.ts
└── utils/          # helpers.ts
```

---

## Referensi

- Web: [list-concert-tour.web.id](https://www.list-concert-tour.web.id)
- Web repo: [ganoolmovie5th-cell/list-concert-tour-claude](https://github.com/ganoolmovie5th-cell/list-concert-tour-claude)
