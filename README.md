# ConcertID Mobile 🎵

React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.  
Versi mobile dari [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

🌐 **Web:** [list-concert-tour.web.id](https://www.list-concert-tour.web.id)  
🌐 **Web Repo:** [list-concert-tour-claude](https://github.com/ganoolmovie5th-cell/list-concert-tour-claude)

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | React Native + Expo SDK 54 + TypeScript |
| Navigation | React Navigation 6 (Bottom Tabs + Stack) |
| Local Storage | AsyncStorage (wishlist, fallback, device UID) |
| Media | expo-image-picker + expo-image-manipulator + expo-file-system |
| Notifications | expo-notifications (push notif + reminders H-7, H-1) |
| Location | expo-location (concert check-in geolocation) |
| Browser | expo-web-browser (Spotify OAuth) |
| Database | Supabase (PostgreSQL REST API) — sync web & mobile |
| Storage | Supabase Storage (foto fans) |

---

## 🗄️ Supabase

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
| `gb_chat` | `useInAppChat` | In-app chat per Group Buying post (Juni 2026) |
| `concert_checkins` | `useConcertCheckin` | Concert check-in geolocation (Juni 2026) |
| `live_setlist` | `useLiveSetlist` | Live Setlist crowdsource — submit lagu yang sedang diputar (Juni 2026) |

### Strategi Data
- **Supabase = primary** — sync antar web & mobile, antar semua device
- **AsyncStorage = fallback** — tetap berfungsi jika offline/error
- **Fallback keys:** `cid_going`, `cid_interest`, `cid_myvote` (identik dengan web)

### Catatan Teknis
- Storage upload wajib set `Content-Type` header — dihandle di `useFanPhotos.ts`
- Upload foto pakai `FileSystem.uploadAsync` (expo-file-system) — bukan `fetch + blob`
- Going/Interested: query pakai `select=type,device_uid` agar `myVote` terbaca
- Past concert: fetch real count dari Supabase, fallback dummy jika count = 0
- `post_uid` unik per posting, `owner_uid` = device UID untuk cek kepemilikan

### Setup Supabase Manual (sekali saja)
1. Jalankan `supabase_schema.sql` dari web repo di [SQL Editor](https://supabase.com/dashboard/project/crtqxgsruywurdlcsjfp/sql)
2. Buat Storage bucket `fan-photos` (Public = ON) di [Storage](https://supabase.com/dashboard/project/crtqxgsruywurdlcsjfp/storage)
3. Jalankan RLS policy di SQL Editor:
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

## ✨ Fitur

### 📊 Data Konser
- **40 konser** 2025–2027 — **selalu sync dari web repo** (`app.js` = source of truth)
- 🎟️ **Concert Passport** — lihat semua konser yang pernah dihadiri sebagai passport stamps, achievement badges, genre stats. Akses dari tab More → Concert Passport.
- 🎙️ **Live Setlist Update** — crowdsource lagu yang sedang diputar saat konser, polling Supabase 10s, submit/delete milik sendiri. Tab "🎙️ Live" di DetailScreen (non-past, non-rumor). Banner 🔴 LIVE NOW otomatis jika konser hari ini.
- Status: Confirmed ✅, Rumor 🔮, Past
- Image dari URL web: `https://www.list-concert-tour.web.id/images/[id].jpeg`
- Field lengkap: genre, harga, venue, promotor, lineup, sources

### 🏠 Home Screen
- Hot Concerts carousel dengan gambar dari web
- Stats: total confirmed, rumor, past
- Search (debounced, outside FlatList)
- Filter: genre (K-Pop, Pop, Rock, Jazz, Indie), status (Confirmed, Rumor, Past, Upcoming, Wishlist)
- Sort: tanggal terdekat/terjauh, harga terendah/tertinggi, nama A-Z

### 📋 Detail Screen
- Hero image + badge status
- Countdown Timer (D:HH:MM:SS) — hanya confirmed upcoming
- Info: Tanggal, Waktu, Venue, Promotor, Genre, Platform Tiket, Range Harga
- Tombol Google Maps
- Kategori tiket + tombol Beli Tiket (confirmed upcoming)
- Google Calendar (confirmed upcoming)
- Been There (konser past)
- **Going / Interested** — Supabase sync, identik dengan web
- Spotify Preview
- Deskripsi + Lineup + Social Media
- Forum Jual Beli Tiket — Supabase sync
- Cari Teman Nonton — Supabase sync
- Tab Setlist (aktual + prediksi)
- Tab Diskusi — Supabase sync
- Tab Review + Foto dari Fans — Supabase sync + Storage

### 📅 Kalender
- Grid kalender per bulan + dot warna per genre

### ❤️ Wishlist
- Simpan konser favorit, persist via AsyncStorage

### 📩 Newsletter & Lainnya
- Subscribe newsletter → Mailchimp via Vercel proxy web
- Dark / Light mode + Multi-bahasa ID / EN
- Share: WhatsApp, Telegram, native share, copy link

---

## 🚀 Setup & Run

```bash
npm install
npx expo start
```

Scan QR dengan **Expo Go** (iOS/Android).

---

## 📁 Struktur Folder

```
src/
├── components/     # ConcertCard, FilterBar, SearchBar, ShareSheet,
│                   # SortPicker, Toast, CountdownTimer
├── constants/      # colors.ts, strings.ts (ID + EN)
├── context/        # ThemeContext, LanguageContext, WishlistContext
├── data/           # concerts.ts — sync dari app.js web
│                   # ARTIST_SOCIALS, SETLISTS, SPOTIFY_ARTISTS, ARTIST_IMAGES
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

## 🔄 Riwayat Sync Terakhir (Juni 2026)

| Item | Status |
|---|---|
| Data konser **44 entries** | ✅ Sync |
| Guns N' Roses → **confirmed** (21 Nov 2026, Stadion Madya GBK) | ✅ Sync |
| `ARTIST_IMAGES` URL dari web | ✅ Sync |
| `ARTIST_SOCIALS` handles | ✅ Sync |
| `SETLISTS` + `SPOTIFY_ARTISTS` | ✅ Sync |
| Venue list di MoreScreen | ✅ Sync |
| Fallback keys `cid_going/interest/myvote` | ✅ Sync |
| Copyright year 2026 | ✅ Sync |
| `past` & `isRumor` deklarasi sebelum hooks | ✅ Fixed |
| `mapRow` null fallbacks (name, contact, type) | ✅ Fixed |
| Unused `VoteCountsProvider` import | ✅ Cleaned |

---

## 🆕 Fitur Baru (Juni 2026)

| Fitur | File | Keterangan |
|---|---|---|
| Social Proof Going on Card | `ConcertCard.tsx`, `VoteCountsContext.tsx` | 1 DB call untuk 44 konser |
| Push Notifications | `useNotifications.ts`, `WishlistContext.tsx` | Reminder H-30/H-7/H-1 |
| Concert Reminder | Auto via `WishlistContext` | Schedule saat wishlist |
| In-App Chat | `useInAppChat.ts` | Chat per GB post, polling 10s |
| Venue Seat Map | `seatMaps.ts`, `venueCoordinates.ts` | 7 venue Jakarta |
| Concert Playlist | `DetailScreen.tsx` | Link Spotify dari DetailScreen |
| Offline Mode | `useNetworkStatus.ts`, `OfflineBanner.tsx` | Probe tiap 30s |
| Story Template | `StoryCard.tsx` | Share ke IG/WA/Telegram |
| Karaoke Mode | `KaraokeScreen.tsx`, `lyrics.ts` | Lirik 8 artis, highlight baris aktif, auto-advance, speed control |
| Concert Check-in | `useConcertCheckin.ts` | GPS radius 1km, hanya hari-H confirmed |
| Spotify OAuth + Playback | `SpotifyService.ts`, `useSpotifyPlayer.ts` | PKCE, expo-web-browser, Premium only |

### Supabase Tables Baru (run di SQL Editor):
```sql
CREATE TABLE IF NOT EXISTS gb_chat (
  id bigserial PRIMARY KEY, msg_uid text UNIQUE, post_uid text NOT NULL,
  sender_uid text, sender_name text, message text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS concert_checkins (
  id bigserial PRIMARY KEY, concert_id text NOT NULL, device_uid text NOT NULL,
  checked_in_at timestamptz, lat float8, lng float8, verified boolean DEFAULT false,
  UNIQUE(concert_id, device_uid)
);
```

---



Data konser di mobile **selalu mengikuti web**. Jika ada perubahan di `app.js` web:

1. Copy data dari `CONCERTS` array di `app.js` (web repo)
2. Update `src/data/concerts.ts` di repo ini
3. Pastikan `ARTIST_IMAGES` menggunakan URL web: `https://www.list-concert-tour.web.id/images/[id].jpeg`

---

## ⚠️ Disclaimer

- Selalu verifikasi ke platform resmi sebelum membeli tiket.
- Konser berlabel **🔮 Rumor** belum dikonfirmasi — jangan beli dari calo!
- Data di Forum & Cari Teman tidak diverifikasi admin — selalu hati-hati.

---

## Pembersihan kode (Juni 2026)

Audit over-engineering (ponytail) — hapus kode berlebihan tanpa mengubah perilaku:
- Hapus `src/hooks/useWishlist.ts` yatim (semua layar pakai `useWishlist` dari `WishlistContext`).
- Lepas `react-native-reanimated` (0 import) + baris plugin di `babel.config.js`.
- Dedup `buildWaHref`/`buildWaHrefGB` → satu fungsi di `src/utils/helpers.ts`.
- `useNetworkStatus` pakai `SUPA_URL`/`SUPA_KEY` dari `lib/supabase` (hapus hardcode); buang `lastFetch` tak terpakai di `useVoteCounts`.

---

© 2026 ConcertID. Dibuat dengan ❤️ untuk komunitas fans musik Indonesia.

### Audit Lanjutan (Juli 2026)

Hapus shim context & dedup helper. Verifikasi: `npx expo export --platform android` sukses.
- Hapus 4 file context shim (`ThemeContext`, `LanguageContext`, `WishlistContext`, `VoteCountsContext`) — semua wrapper hanya forward ke `AppContext`; 13+ consumer diupdate impor `useApp` dari `AppContext` langsung
- Hapus `getRedirectUri()` di `SpotifyService.ts` → call site pakai konstanta `REDIRECT_URI` langsung
- Ekstrak `makeUID(prefix)` di `src/utils/helpers.ts`; hapus 3 implementasi lokal identik di `useInAppChat`, `useGroupBuying`, `useTicketMarket`
- `src/hooks/useConcertCheckin.ts`: ganti `require('expo-location')` lazy di dalam try/catch → static `import * as Location`
- `src/hooks/useFanPhotos.ts`: pindah hardcoded `SUPA_KEY` → import dari `lib/supabase`

### Audit Lanjutan 2 (Juli 2026)

- `src/hooks/useSocialFeatures.ts`: ekstrak `fallbackVote()` helper — logika vote fallback 27 baris duplikat di 2 branch → 1 fungsi; konsolidasi 3 AsyncStorage key (`cid_going`, `cid_interest`, `cid_myvote`) → 1 key `cid_social` dengan shape `{ [concertId]: SocialStore }`; kolaps `SocialData` interface ke `SocialStore`
- `src/hooks/useLiveSetlist.ts`: hapus blok SQL `CREATE TABLE`/`CREATE INDEX` dari JSDoc — stale, schema otoritatif ada di migration
