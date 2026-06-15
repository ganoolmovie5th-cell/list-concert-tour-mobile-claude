# ConcertID Mobile — Project Context

## Overview
React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.  
Versi mobile dari [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

- **Repo mobile:** ganoolmovie5th-cell/list-concert-tour-mobile-claude
- **Repo web (source of truth):** ganoolmovie5th-cell/list-concert-tour-claude
- **Stack:** React Native + Expo SDK 54 + TypeScript

---

## Aturan Penting

- **Selalu push langsung ke `main`** — tidak perlu buat PR
- Gunakan `kiro_powers github push_to_remote` dengan `remote_branch_name: "main"`
- **Data konser di `concerts.ts` selalu mengikuti `app.js` web** — jangan edit manual, sync dari web
- **Images** diambil dari URL web: `https://www.list-concert-tour.web.id/images/[id].jpeg`
- Baca file seminimal mungkin — hanya yang relevan

---

## Commit Convention (WAJIB setiap commit)

**Setiap commit di repo ini HARUS menyertakan update:**

1. **`README.md`** — update bagian yang relevan (fitur baru, perubahan, riwayat sync)
2. **`.kiro/steering/project-context.md`** — update catatan teknis atau hal penting baru

**Format commit message:**
```
<type>: <deskripsi singkat>

Files: <file yang diubah selain README & steering>
```

**Type:**
- `feat` — fitur baru
- `fix` — bug fix
- `sync` — sync data dari web
- `perf` — performance
- `chore` — maintenance
- `docs` — hanya dokumentasi

**Contoh commit yang BENAR:**
```
sync: concerts.ts mengikuti web — tambah konser baru, update ARTIST_SOCIALS

Files: src/data/concerts.ts, src/screens/MoreScreen.tsx, README.md, .kiro/steering/project-context.md
```

---

## Auto-Sync dari Web (WAJIB)

**Mobile selalu mengikuti web. Setiap ada perubahan di web repo, langsung sync ke mobile:**

| Perubahan di Web (`app.js`) | File Mobile yang Harus Diupdate | Keterangan |
|---|---|---|
| Tambah/edit/hapus konser | `src/data/concerts.ts` — CONCERTS (40 entries per Juni 2026) | Copy + format TypeScript |
| Edit `ARTIST_IMAGES` | `src/data/concerts.ts` — ARTIST_IMAGES | URL web tetap |
| Edit `ARTIST_SOCIALS` | `src/data/concerts.ts` — ARTIST_SOCIALS | Pastikan handles konsisten |
| Edit `SETLISTS` | `src/data/concerts.ts` — SETLISTS | Copy paste |
| Edit `SPOTIFY_ARTISTS` | `src/data/concerts.ts` — SPOTIFY_ARTISTS | Copy paste |
| Tambah/edit venue di `index.html` | `src/screens/MoreScreen.tsx` | Identik dengan web |
| Update Supabase URL/key di `supabase.js` | `src/lib/supabase.ts` | Wajib sama |
| Fix bug Supabase query di `features*.js` | Hook terkait di `src/hooks/` | Logic identik |
| Update fallback localStorage keys | `src/hooks/useSocialFeatures.ts` | Keys harus identik |
| Update copyright year | `src/constants/strings.ts` | `footerCopy` ID & EN |
| Update EmailJS config | `src/screens/NewsletterScreen.tsx` | Service/template ID |

**Prioritas sync (SEGERA, dalam commit yang sama atau berikutnya):**
- 🔴 **Wajib langsung:** Data konser, Supabase config, bug fix query
- 🟡 **Wajib segera:** ARTIST_SOCIALS, venues, copyright
- 🟢 **Best effort:** SETLISTS, SPOTIFY_ARTISTS

**Template commit sync:**
```
sync: <deskripsi perubahan dari web>

Dari web commit: <commit hash/deskripsi web>
Files: <file mobile yang diupdate>, README.md, .kiro/steering/project-context.md
```

---

## Source of Truth

| Data | Source |
|---|---|
| Data konser (37 entries) | `app.js` di repo web → `src/data/concerts.ts` mobile |
| Images | `/images/*.jpeg` di repo web, diakses via URL |
| Supabase schema | `supabase_schema.sql` di repo web |
| Fallback keys | Identik dengan web: `cid_going`, `cid_interest`, `cid_myvote` |

---

## Supabase

**Project:** list-concert-tour-web-n-mobile-claude  
**URL:** `https://crtqxgsruywurdlcsjfp.supabase.co`  
**Key:** `sb_publishable_G9oVhoD74guR61dZ755SYw_QwcrRKmc`  
**Client:** `src/lib/supabase.ts` — `DB`, `Storage`, `getDeviceUID()`  
**Auth:** Anonymous — device UID dari AsyncStorage (`cid_uid`)

### Tabel & Hook

| Tabel | Hook | Keterangan |
|---|---|---|
| `concert_votes` | `useSocialFeatures` | Going/Interested — sync web & mobile |
| `discussions` | `useDiscussion` | Komentar — sync |
| `reviews` | `useReviews` | Review & rating — sync |
| `ticket_market` | `useTicketMarket` | Forum jual beli — sync |
| `group_buying` | `useGroupBuying` | Cari teman nonton — sync |
| `fan_photos` | `useFanPhotos` | Foto + Supabase Storage `fan-photos` |

### Strategi
- **Supabase = primary**, **AsyncStorage = fallback** (offline/error)
- Data web & mobile sync karena pakai Supabase yang sama

### Catatan Teknis Kritis
- Going/Interested: query pakai **`select=type,device_uid`** — wajib agar `myVote` terbaca
- Fallback AsyncStorage keys: **`cid_going`, `cid_interest`, `cid_myvote`** (identik dengan web — jangan pakai `_v2`)
- **Upload foto WAJIB pakai `FileSystem.uploadAsync`** (expo-file-system), bukan `fetch + blob`
- `Storage.upload` di `supabase.ts` sudah dihapus — tidak support RN
- Past concert going/interested: fetch real dari Supabase, fallback dummy jika count = 0
- `getDeviceUID()` async — hasilnya sama dengan `cid_uid` di localStorage web
- **Bucket `fan-photos` harus dibuat manual di Supabase Dashboard**
- **Deklarasikan `past` & `isRumor` SEBELUM hooks** di DetailScreen — sudah difix

---

## AsyncStorage Keys (fallback)

| Key | Dipakai oleh |
|---|---|
| `cid_uid` | Semua hook — device UID persistent |
| `cid_going` / `cid_interest` / `cid_myvote` | useSocialFeatures fallback (**sama dengan web**) |
| `cid_discussions_<id>` | useDiscussion fallback |
| `cid_reviews_<id>` | useReviews fallback |
| `cid_ticket_market_<id>` | useTicketMarket fallback |
| `cid_group_buying_<id>` | useGroupBuying fallback |
| `cid_fan_photos_<id>` | useFanPhotos fallback |
| `cid_wishlist` | WishlistContext |

---

## EmailJS & Mailchimp

- EmailJS Service: `service_lq3pvsq` | Template: `template_w8grsoa`
- EmailJS Public key: `Ph1AuCpm4gbC6zMw6`
- Foto: field `photo_data` (base64 murni, compress ke ≤30KB via expo-image-manipulator)
- Newsletter subscribe: `POST https://www.list-concert-tour.web.id/api/subscribe` → `{ email: string }`

---

## Struktur Penting

```
src/
├── lib/supabase.ts        ← Supabase client (DB, Storage, getDeviceUID)
├── data/concerts.ts       ← Sync dari app.js web (SOURCE OF TRUTH = WEB)
├── hooks/
│   ├── useSocialFeatures  ← concert_votes (select=type,device_uid)
│   ├── useDiscussion      ← discussions
│   ├── useReviews         ← reviews
│   ├── useTicketMarket    ← ticket_market
│   ├── useGroupBuying     ← group_buying
│   ├── useFanPhotos       ← fan_photos + FileSystem.uploadAsync
│   ├── useCountdown       ← countdown timer per detik
│   ├── useBeenThere       ← AsyncStorage only
│   └── useWishlist        ← AsyncStorage only
├── screens/
│   ├── DetailScreen.tsx   ← past & isRumor WAJIB dideklarasikan SEBELUM hooks
│   ├── HomeScreen.tsx     ← Search di LUAR FlatList (keyboard fix)
│   └── NewsletterScreen   ← Mailchimp + EmailJS + foto
└── components/
    └── CountdownTimer.tsx
```

---

## Keputusan Desain Penting

### DetailScreen — urutan deklarasi (WAJIB)
```typescript
const concert = CONCERTS.find(c => c.id === concertId);
// Hitung past & isRumor SEBELUM hooks:
const past = concert ? isPast(concert) : false;
const isRumor = concert ? concert.confirmStatus === 'rumor' : false;
// Baru panggil hooks:
const { going, ... } = useSocialFeatures(concertId, past);
```

### Search di HomeScreen
- `TextInput` search **di luar FlatList** — wajib, kalau di ListHeaderComponent keyboard tutup setiap keystroke

### Foto Upload (useFanPhotos)
- Compress via `expo-image-manipulator` (max 1200px, quality 0.8)
- Upload via `FileSystem.uploadAsync` ke Supabase Storage
- Fallback: simpan local URI jika upload gagal

### Going/Interested Past
- Dummy seed hash dulu (immediate render)
- Async fetch Supabase → ganti jika real count > 0
- Button disabled untuk past

### Forum & Cari Teman
- Disabled untuk konser **past** & **rumor**
- Hanya pemilik (`ownerUid === getDeviceUID()`) yang bisa edit/hapus

---

## Hal yang TIDAK Perlu Dilakukan
- Jangan buat PR — push langsung ke main
- Jangan edit data konser di `concerts.ts` secara manual — sync dari web
- Jangan pakai `cid_going_v2` dll (sudah difix ke `cid_going`)
- Jangan re-install expo tanpa perlu
- Jangan baca seluruh repo — baca file yang relevan saja

---

## Sync Checklist (saat update data dari web)

Ketika ada update di `app.js` web, pastikan sync ke mobile:

| Item | File Mobile | Catatan |
|---|---|---|
| CONCERTS array | `src/data/concerts.ts` | Copy paste + format TypeScript |
| ARTIST_IMAGES | `src/data/concerts.ts` | URL web: `https://www.list-concert-tour.web.id/images/[id].jpeg` |
| ARTIST_SOCIALS | `src/data/concerts.ts` | Pastikan handles konsisten |
| SETLISTS | `src/data/concerts.ts` | Copy paste |
| SPOTIFY_ARTISTS | `src/data/concerts.ts` | Copy paste |
| Venue list | `src/screens/MoreScreen.tsx` | Harus identik dengan web |
