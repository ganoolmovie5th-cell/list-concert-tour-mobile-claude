# ConcertID Mobile — Project Context

## Overview
React Native + Expo mobile app untuk jadwal konser internasional di Indonesia.  
Versi mobile dari website [list-concert-tour.web.id](https://www.list-concert-tour.web.id)

- **Repo mobile:** ganoolmovie5th-cell/list-concert-tour-mobile-claude
- **Repo web:** ganoolmovie5th-cell/list-concert-tour-claude
- **Stack:** React Native + Expo SDK 54 + TypeScript

---

## Git Workflow
- **Selalu push langsung ke `main`** — tidak perlu buat PR
- Gunakan `kiro_powers github push_to_remote` dengan `remote_branch_name: "main"`

---

## Supabase

**Project:** list-concert-tour-web-n-mobile-claude  
**URL:** `https://crtqxgsruywurdlcsjfp.supabase.co`  
**Key:** `sb_publishable_G9oVhoD74guR61dZ755SYw_QwcrRKmc`  
**Client:** `src/lib/supabase.ts` — `DB`, `Storage`, `getDeviceUID()`

### Tabel & Hook

| Tabel | Hook | Keterangan |
|---|---|---|
| `concert_votes` | `useSocialFeatures` | Going/Interested — sync antar device |
| `discussions` | `useDiscussion` | Komentar — sync antar device |
| `reviews` | `useReviews` | Review & rating — sync, cek duplikat by device_uid |
| `ticket_market` | `useTicketMarket` | Forum jual beli — sync |
| `group_buying` | `useGroupBuying` | Cari teman nonton — sync |
| `fan_photos` | `useFanPhotos` | Foto + Supabase Storage bucket `fan-photos` |

### Strategi
- **Supabase = primary**, **AsyncStorage = fallback** (offline/error)
- Data web & mobile tersinkron karena pakai Supabase yang sama

### Catatan Teknis Penting
- `Storage.upload` wajib set `Content-Type: blob.type || 'image/jpeg'` — sudah dihandle di `supabase.ts`
- Past concert going/interested: **fetch real dari Supabase dulu**, fallback dummy jika count = 0
- `getDeviceUID()` async — hasilnya sama dengan `cid_uid` di localStorage web
- `post_uid` = `genPostUID()` unik per posting, `owner_uid` = device UID untuk kepemilikan

---

## AsyncStorage Keys (fallback)

| Key | Dipakai oleh |
|---|---|
| `cid_uid` | Semua hook — device UID persistent |
| `cid_going_v2` / `cid_interest_v2` / `cid_myvote_v2` | useSocialFeatures fallback |
| `cid_discussions_<id>` | useDiscussion fallback |
| `cid_reviews_<id>` | useReviews fallback |
| `cid_ticket_market_<id>` | useTicketMarket fallback |
| `cid_group_buying_<id>` | useGroupBuying fallback |
| `cid_fan_photos_<id>` | useFanPhotos fallback |
| `cid_wishlist` | WishlistContext |

---

## EmailJS — Newsletter / Kritik & Saran
- Service: `service_lq3pvsq` | Template: `template_w8grsoa`
- Public key: `Ph1AuCpm4gbC6zMw6` | Private key: `KHXx2RsnBVjAp4XyYw01U`
- Foto: field `photo_data` (base64 murni, compress ke ≤30KB via expo-image-manipulator)
- Endpoint: `POST https://api.emailjs.com/api/v1.0/email/send`

## Mailchimp — Newsletter Subscribe
- Endpoint: `POST https://www.list-concert-tour.web.id/api/subscribe`
- Body: `{ email: string }`

---

## Struktur Penting

```
src/
├── lib/supabase.ts        ← Supabase client (DB, Storage, getDeviceUID)
├── hooks/
│   ├── useSocialFeatures  ← concert_votes
│   ├── useDiscussion      ← discussions
│   ├── useReviews         ← reviews
│   ├── useTicketMarket    ← ticket_market
│   ├── useGroupBuying     ← group_buying
│   ├── useFanPhotos       ← fan_photos + Storage
│   ├── useCountdown       ← countdown timer per detik
│   ├── useBeenThere       ← AsyncStorage only
│   └── useWishlist        ← AsyncStorage only
├── screens/
│   ├── DetailScreen.tsx   ← Semua fitur komunitas
│   ├── HomeScreen.tsx     ← Search di LUAR FlatList (keyboard fix)
│   └── NewsletterScreen   ← Mailchimp + EmailJS + foto
└── components/
    └── CountdownTimer.tsx ← Pakai useCountdown hook
```

---

## Keputusan Desain Penting

### Search di HomeScreen
- `TextInput` search **di luar FlatList** (antara TopBar & FlatList)
- Ini **wajib** — kalau masuk ListHeaderComponent, keyboard akan tutup setiap keystroke
- `ListHeaderComponent` = stats + hot carousel + filter + sort (tidak ada search di sini)

### Foto Upload (useFanPhotos)
- Foto di-compress via `expo-image-manipulator` sebelum upload
- Upload ke Supabase Storage, insert row ke `fan_photos`
- Fallback: simpan local URI jika upload gagal

### Going/Interested Past
- Tampilkan dummy seed hash dulu (immediate)
- Async fetch Supabase: jika real count > 0, ganti dengan angka real
- Button tetap disabled untuk past

### Forum & Cari Teman
- Disabled untuk konser **past** & **rumor**
- `ownerUid` dari `getDeviceUID()` — hanya pemilik bisa edit/hapus
- Kontak ditampilkan sebagai emoji 💬 (WA) dan 📷 (IG) — nomor tidak diekspos

---

## Hal yang TIDAK Perlu Dilakukan
- Jangan buat PR — push langsung ke main
- Jangan baca seluruh repo — baca file yang relevan saja
- Jangan re-install expo tanpa perlu
- Jangan tambahkan fitur baru tanpa diminta
