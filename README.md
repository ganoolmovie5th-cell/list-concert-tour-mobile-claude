# ConcertID Mobile 🎵

React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.  
Versi mobile dari [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

---

## Tech Stack

- React Native + Expo SDK 54 + TypeScript
- React Navigation 6 (Bottom Tabs + Stack)
- AsyncStorage untuk persistensi lokal & fallback
- expo-image-picker + expo-image-manipulator + expo-file-system untuk upload foto
- **Supabase** — sync data komunitas antar semua device (web & mobile)

---

## Supabase

**Project:** list-concert-tour-web-n-mobile-claude  
**URL:** `https://crtqxgsruywurdlcsjfp.supabase.co`  
**Key:** `sb_publishable_G9oVhoD74guR61dZ755SYw_QwcrRKmc`  
**Auth:** Anonymous — device UID dari AsyncStorage (`cid_uid`)

### Tabel

| Tabel | Hook | Fungsi |
|---|---|---|
| `concert_votes` | `useSocialFeatures` | Going / Interested |
| `discussions` | `useDiscussion` | Komentar & reply |
| `reviews` | `useReviews` | Review & rating |
| `ticket_market` | `useTicketMarket` | Forum jual beli tiket |
| `group_buying` | `useGroupBuying` | Cari teman nonton |
| `fan_photos` | `useFanPhotos` | Foto dari fans |

### Strategi
- **Supabase = primary** — sync antar web & mobile, antar semua device
- **AsyncStorage = fallback** — tetap berfungsi jika offline/error

### Catatan Teknis
- Storage upload wajib set `Content-Type` header (sudah dihandle di `useFanPhotos.ts`)
- **Upload foto pakai `FileSystem.uploadAsync`** (expo-file-system) — bukan `fetch + blob` (tidak support di RN)
- Past concert: fetch real count dari Supabase, fallback dummy jika count = 0
- `post_uid` unik per posting, `owner_uid` = device UID untuk cek kepemilikan
- **Bucket `fan-photos` harus dibuat manual di Supabase Dashboard** (Storage → Buckets → New bucket, set Public = ON)
- **Storage RLS policy** harus dibuat manual di SQL Editor:
  ```sql
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('fan-photos', 'fan-photos', true)
  ON CONFLICT (id) DO UPDATE SET public = true;

  CREATE POLICY "storage_fp_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'fan-photos');

  CREATE POLICY "storage_fp_insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'fan-photos');
  ```

---

## Fitur

### 🗂 Data Konser
- **38 konser** 2025–2027 — sama persis dengan website
- Status: Confirmed, Rumor, Past
- Field lengkap: Genre, Platform Tiket, Range Harga, Kategori Tiket, Venue, Promotor, Lineup, Sources

### 🏠 Home Screen
- Hot Concerts carousel
- Stats: total confirmed, rumor, past
- Search (TextInput di luar FlatList — tidak ada keyboard dismiss issue)
- Filter: genre (K-Pop, Pop, Rock, Jazz, Indie), status (Confirmed, Rumor, Past, Upcoming, Wishlist)
- Sort: tanggal terdekat/terjauh, harga terendah/tertinggi, nama A-Z

### 📋 Detail Screen (urutan sesuai website)
- Hero image + badge status
- **Countdown Timer** (D : HH : MM : SS) — hanya confirmed upcoming
- Info rows: Tanggal, Waktu, Venue, Promotor, Genre, Platform Tiket, Range Harga
- Tombol **Google Maps** → buka lokasi venue
- Kategori tiket + tombol **Beli Tiket Sekarang** (confirmed upcoming)
- Tambah ke Google Calendar (confirmed upcoming)
- **Been There** (konser past)
- **Going / Interested** counter — Supabase sync
  - Past: angka real dari Supabase, fallback dummy jika = 0, disabled
  - Confirmed & Rumor: actual, bisa vote
- **Spotify Preview** → buka artis di Spotify
- Deskripsi + Lineup
- Social Media (Instagram, Twitter)
- **Forum Jual Beli Tiket** — Supabase sync (disabled untuk past & rumor)
- **Cari Teman Nonton** — Supabase sync (disabled untuk past & rumor)
- Sumber berita
- Tab **Setlist** — aktual + prediksi
- Tab **Diskusi** — Supabase sync, form disabled untuk past
- Tab **Review** — Supabase sync, rating 1–5 (hanya past) + **Foto dari Fans** (Supabase Storage, hanya past)

### 📅 Kalender
- Grid kalender per bulan + dot warna per genre

### ❤️ Wishlist
- Simpan konser favorit, persist via AsyncStorage

### 📩 Newsletter & Feedback
- Subscribe newsletter → Mailchimp via `/api/subscribe` Vercel proxy
- **Kritik & Saran** → EmailJS + attach foto (auto-compress ke ≤30KB)
- Instagram & Twitter: coming soon

### ⚙️ Lainnya
- Share: WhatsApp, Telegram, native share, copy link
- Dark / Light mode + Multi-bahasa ID / EN

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
├── components/     # ConcertCard, FilterBar, SearchBar, ShareSheet,
│                   # SortPicker, Toast, CountdownTimer
├── constants/      # colors.ts, strings.ts (ID + EN)
├── context/        # ThemeContext, LanguageContext, WishlistContext
├── data/           # concerts.ts (38 konser, ARTIST_SOCIALS, SETLISTS, SPOTIFY_ARTISTS)
├── hooks/          # useSocialFeatures, useDiscussion, useReviews, useBeenThere,
│                   # useTicketMarket, useGroupBuying, useFanPhotos,
│                   # useWishlist, useCountdown
├── lib/            # supabase.ts (DB, Storage, getDeviceUID)
├── navigation/     # AppNavigator.tsx
├── screens/        # HomeScreen, DetailScreen, CalendarScreen,
│                   # WishlistScreen, NewsletterScreen, MoreScreen
├── types/          # index.ts
└── utils/          # helpers.ts
```

---

## Referensi

- Web: [list-concert-tour.web.id](https://www.list-concert-tour.web.id)
- Web repo: [ganoolmovie5th-cell/list-concert-tour-claude](https://github.com/ganoolmovie5th-cell/list-concert-tour-claude)
- Supabase: [dashboard](https://supabase.com/dashboard/project/crtqxgsruywurdlcsjfp)
