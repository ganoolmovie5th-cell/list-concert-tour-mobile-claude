# ConcertID Mobile — Project Context

## Overview
React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.
- **Repo mobile:** ganoolmovie5th-cell/list-concert-tour-mobile-claude
- **Repo web (source of truth):** ganoolmovie5th-cell/list-concert-tour-claude
- **Stack:** React Native + Expo SDK 54 + TypeScript
- **Live web:** https://www.list-concert-tour.web.id

---

## Aturan Penting

- **Selalu push langsung ke `main`** — tidak perlu buat PR
- **Data konser di `concerts.ts` selalu mengikuti `app.js` web** — jangan edit manual
- **Images** dari URL web: `https://www.list-concert-tour.web.id/images/[id].jpeg`
- Setiap commit HARUS update `README.md` + `.kiro/steering/project-context.md`

---

## Commit Convention

```
<type>: <deskripsi singkat>

Files: <file yang diubah selain README & steering>
```

**Type:** `feat` `fix` `sync` `perf` `chore` `docs`

---

## Source of Truth

| Data | Source |
|---|---|
| Data konser (**44 entries** per Juni 2026) | `app.js` web → `src/data/concerts.ts` mobile |
| Images | `/images/*.jpeg` web, diakses via URL |
| Supabase schema | `supabase_schema.sql` web repo |
| Fallback keys | `cid_going`, `cid_interest`, `cid_myvote` (identik web) |

---

## Supabase

**URL:** `https://crtqxgsruywurdlcsjfp.supabase.co`  
**Key:** `sb_publishable_G9oVhoD74guR61dZ755SYw_QwcrRKmc`  
**Auth:** Anonymous — device UID dari AsyncStorage (`cid_uid`)

### Tabel & Hook

| Tabel | Hook | Keterangan |
|---|---|---|
| `concert_votes` | `useSocialFeatures` | Going/Interested |
| `discussions` | `useDiscussion` | Komentar |
| `reviews` | `useReviews` | Review & rating |
| `ticket_market` | `useTicketMarket` | Forum jual beli |
| `group_buying` | `useGroupBuying` | Cari teman nonton |
| `fan_photos` | `useFanPhotos` | Foto + Storage |
| `gb_chat` | `useInAppChat` | In-app chat per GB post, polling 10s |
| `concert_checkins` | `useConcertCheckin` | Check-in GPS radius 1km |
| `live_setlist` | `useLiveSetlist` | Live setlist crowdsource — polling 10s, submit/delete |

### Catatan Teknis Kritis
- Going/Interested: query pakai **`select=type,device_uid`** — wajib agar `myVote` terbaca
- **Upload foto WAJIB pakai `FileSystem.uploadAsync`** — bukan `fetch + blob`
- `past` & `isRumor` **WAJIB dideklarasikan SEBELUM hooks** di DetailScreen
- `mapRow` di useTicketMarket & useGroupBuying **WAJIB ada fallback** `r.name||'Anonim'`, `r.contact||''`

---

## Paket (package.json)

Paket yang ditambahkan (perlu `npm install`):
- `expo-notifications ~0.29.14` — Push notifications & reminders
- `expo-location ~18.0.9` — Concert check-in GPS
- `expo-web-browser ~15.0.11` — Spotify OAuth (openAuthSessionAsync)

---

## Spotify OAuth (PKCE)

| Item | Value |
|---|---|
| Client ID | `bc23ee30bdb948b483cd1af6ba321cd1` |
| Redirect URI | `concertid://spotify-auth` |
| Scopes | `user-read-playback-state`, `user-modify-playback-state`, `user-read-currently-playing` |
| Flow | PKCE — pure-JS SHA256 (tanpa `crypto.subtle`) |
| Web fallback | `https://www.list-concert-tour.web.id/spotify-callback` (registered di Spotify dashboard) |

### File Spotify:
- `src/services/SpotifyService.ts` — OAuth PKCE + Web API helpers
- `src/hooks/useSpotifyPlayer.ts` — connect/disconnect/play/pause/poll

### Catatan:
- `crypto.getRandomValues` tidak tersedia di Hermes → pakai `Math.random()` untuk verifier
- `crypto.subtle` tidak tersedia → pure-JS SHA256 (`sha256Bytes()` di SpotifyService)
- `WebBrowser.openAuthSessionAsync` intercept `concertid://` tanpa perlu scheme terdaftar di OS
- Premium check via `GET /me` → skip API call untuk Free account (cegah Spotify app terbuka)
- Playback control (play/pause) hanya untuk **Spotify Premium**

---

## Fitur Baru (Juni 2026)

| Fitur | File | Catatan |
|---|---|---|
| Social Proof Going on Card | `VoteCountsContext.tsx`, `useVoteCounts.ts`, `ConcertCard.tsx` | 1 DB call untuk 44 konser |
| Push Notifications | `useNotifications.ts`, `WishlistContext.tsx` | Reminder H-30/H-7/H-1 |
| Concert Reminder | Auto via `WishlistContext` | Schedule saat wishlist |
| In-App Chat | `useInAppChat.ts` + `DetailScreen.tsx` | Chat per GB post, polling 10s |
| Venue Seat Map | `seatMaps.ts`, `venueCoordinates.ts` | 7 venue Jakarta |
| Concert Playlist | `DetailScreen.tsx` | Link Spotify dari DetailScreen |
| Offline Mode | `useNetworkStatus.ts`, `OfflineBanner.tsx` | Probe tiap 30s |
| Story Template | `StoryCard.tsx` | Share ke IG/WA/Telegram |
| Karaoke Mode | `KaraokeScreen.tsx`, `lyrics.ts` | Lirik 8 artis, fullscreen |
| Concert Check-in | `useConcertCheckin.ts` | GPS + Supabase `concert_checkins` |
| Spotify OAuth | `SpotifyService.ts`, `useSpotifyPlayer.ts` | PKCE + expo-web-browser, Premium only playback |
| Concert Passport | `PassportScreen.tsx` | Stamps grid, achievement badges, genre stats, progress bar — pakai `useBeenThere` + `CONCERTS.filter(isPast)` |
| Live Setlist Update | `useLiveSetlist.ts`, `DetailScreen.tsx` | Tab 🎙️ Live di DetailScreen (non-past, non-rumor); polling 10s, submit/delete, isLiveNow badge |

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
CREATE TABLE IF NOT EXISTS live_setlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  concert_id text NOT NULL, song_name text NOT NULL, song_number integer DEFAULT 1,
  submitted_by text NOT NULL DEFAULT 'Anonim', created_at timestamptz DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_live_setlist_concert ON live_setlist(concert_id, created_at DESC);
```

---

## Keputusan Desain Penting

### DetailScreen — urutan deklarasi (WAJIB)
```typescript
const past    = concert ? isPast(concert) : false;
const isRumor = concert ? concert.confirmStatus === 'rumor' : false;
// Baru panggil hooks setelah past & isRumor dideklarasikan
const { going, ... } = useSocialFeatures(concertId, past);
```

### mapRow WAJIB punya fallback (pernah menyebabkan bug "undefined"):
```typescript
// useTicketMarket.ts & useGroupBuying.ts
name:    r.name    || 'Anonim',
contact: r.contact || '',
type:    r.type    || 'jual',   // TicketMarket only
```

### VoteCountsProvider — di App.tsx (level paling atas)
- `VoteCountsContext` wrap semua screen di `App.tsx`
- `useVoteCountsCtx()` di `ConcertCard` — tidak perlu individual fetch per card
- Jangan import `VoteCountsProvider` di screen individual — sudah ada di `App.tsx`

### Search di HomeScreen
- `TextInput` search **di luar FlatList** — keyboard tutup setiap keystroke jika di ListHeaderComponent

---

## Sync Checklist (saat update data dari web)

| Item | File Mobile | Catatan |
|---|---|---|
| CONCERTS array | `src/data/concerts.ts` | Copy + format TypeScript |
| ARTIST_IMAGES | `src/data/concerts.ts` | URL web tetap |
| ARTIST_SOCIALS | `src/data/concerts.ts` | Pastikan konsisten |
| SETLISTS | `src/data/concerts.ts` | Copy paste |
| SPOTIFY_ARTISTS | `src/data/concerts.ts` | Copy paste |
| Venue list | `src/screens/MoreScreen.tsx` | Identik dengan web |

---

## Bug Fixes (Juni 2026 — session ini)

| Bug | Fix |
|---|---|
| Karaoke: `scrollOffset` tidak terdefinisi | Rename → `scrollOff` konsisten |
| Karaoke: `spotifyTrackUrl` / `openSpotify` ReferenceError | Hapus fungsi lama, pakai `Linking.openURL` langsung |
| Karaoke: play + auto-scroll terpisah (dua tombol) | Merge jadi satu tombol Play |
| Karaoke: offset reset ke 0 saat pause/resume | Track posisi via `currentOffsetRef` + `onScroll` |
| Karaoke: controls tidak muncul di Setlist Mode | `{hasContent && <Controls/>}` |
| Spotify: `response_type=token` (implicit) ditolak | Ganti ke PKCE (`response_type=code`) |
| Spotify: `crypto.getRandomValues` tidak ada di Hermes | Ganti ke `Math.random()` |
| Spotify: `concertid://` tidak terbuka di Expo Go | `expo-web-browser openAuthSessionAsync` intercept |
| Spotify Free: API call trigger Spotify app terbuka | Cek Premium via `GET /me` sebelum `apiPlay` |
| Check-in: logic terbalik (past bisa check-in, upcoming skip GPS) | Rewrite: block past/rumor/far-future, wajib GPS 1km hari-H |
| DetailScreen: double Spotify button | Hapus pre-concert playlist card |
| DetailScreen: double Google Maps | Hapus tombol Maps di info rows, keep di seat map |


- Jangan buat PR — push langsung ke main
- Jangan edit `concerts.ts` manual — sync dari `app.js` web
- Jangan pakai `cid_going_v2` dll — harus `cid_going`
- Jangan import `VoteCountsProvider` di screen — hanya di `App.tsx`
