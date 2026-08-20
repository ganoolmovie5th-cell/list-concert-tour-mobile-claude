# ConcertID Mobile

Aplikasi mobile jadwal konser internasional di Indonesia 2025-2027. Versi mobile dari ConcertID web, dengan sync data Supabase real-time.

**Tech Stack:** React Native · Expo SDK 54 · TypeScript · React Navigation · Supabase · AsyncStorage

**Web:** [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

## Features

- 44 konser (sync dari web repo)
- Status Confirmed / Rumor / Past dengan image dari web
- Home: carousel, stats, search (debounced), filter genre/status, sort
- Detail: countdown, info lengkap, Google Maps, Google Calendar, Spotify
- Going / Interested (sync Supabase)
- Review & Rating (sync Supabase)
- Diskusi / komentar (sync Supabase)
- Forum Jual Beli Tiket (sync Supabase)
- Cari Teman Nonton + In-App Chat (sync Supabase)
- Foto Fans (upload Supabase Storage)
- Concert Passport (badge achievements)
- Live Setlist Update (crowdsource lagu saat konser)
- Concert Check-in (GPS radius 1km, hari-H)
- Spotify OAuth + Playback (Premium only)
- Push Notifications (reminder H-30/H-7/H-1)
- Karaoke Mode (lirik 8 artis, highlight aktif)
- Story Card (share ke IG/WA/Telegram)
- Offline mode (expo-sqlite cache)
- Kalender grid per bulan
- Wishlist (AsyncStorage)
- Dark/Light mode + bilingual (ID/EN)
- Newsletter subscribe (Mailchimp via web proxy)

## Getting Started

```bash
npm install
npx expo start
```

Scan QR dengan Expo Go.

## Project Structure

```
src/
  components/       → ConcertCard, FilterBar, SearchBar, ShareSheet, Toast, dll
  constants/        → colors.ts, strings.ts (ID + EN)
  context/          → AppContext (theme, language, wishlist, vote counts)
  data/             → concerts.ts, artist socials/images/setlists/spotify
  hooks/            → useSocialFeatures, useDiscussion, useReviews,
                      useTicketMarket, useGroupBuying, useFanPhotos,
                      useInAppChat, useConcertCheckin, useLiveSetlist, dll
  lib/              → supabase.ts (DB, Storage, getDeviceUID)
  navigation/       → AppNavigator.tsx
  screens/          → Home, Detail, Calendar, Wishlist, Newsletter, More,
                      KaraokeScreen, PostConcertSummary
  types/            → index.ts
  utils/            → helpers.ts
```

## License

MIT
