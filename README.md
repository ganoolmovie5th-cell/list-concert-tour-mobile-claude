# ConcertID Mobile 🎵

React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.  
Versi mobile dari [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

## Tech Stack
- React Native + Expo SDK 54 + TypeScript
- React Navigation 6 (Bottom Tabs + Stack)
- AsyncStorage untuk persistensi lokal
- expo-image-picker untuk upload foto

## Fitur

### Info Konser
- 25+ konser 2025–2027 (Confirmed, Rumor, Past)
- Genre, Platform Tiket, Range Harga
- Search, filter genre/status, sort tanggal/harga/nama
- Google Maps link per venue
- Spotify Preview link per artis
- Kalender bulanan konser

### Interaksi
- Wishlist (simpan konser favorit)
- Going / Interested counter
  - Past: angka dummy disabled
  - Confirmed & Rumor: actual, bisa vote
- Been There (konser past)
- Setlist aktual + prediksi
- Diskusi + Reply + Like (form disabled untuk konser past)
- Review & Rating bintang 1–5 (hanya konser past)
- Foto dari Fans upload via galeri (hanya konser past)

### Komunitas
- Forum Jual Beli Tiket (disabled untuk past & rumor)
- Cari Teman Nonton (disabled untuk past & rumor)

### Newsletter & Feedback
- Subscribe newsletter via Mailchimp
- Kritik & Saran via EmailJS (support lampiran foto)

### Lainnya
- Share: WhatsApp, Telegram, native share, copy link
- Dark / Light mode
- Multi-bahasa ID / EN

## Setup
```bash
npm install
npx expo start
```
Scan QR dengan Expo Go (iOS/Android).

## Referensi
Web version: [list-concert-tour.web.id](https://www.list-concert-tour.web.id)  
Web repo: [ganoolmovie5th-cell/list-concert-tour-claude](https://github.com/ganoolmovie5th-cell/list-concert-tour-claude)
