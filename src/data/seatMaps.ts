/**
 * seatMaps.ts — Data Denah Venue + Kategori Kursi
 * Static data untuk Venue Seat Map feature
 */

export interface SeatCategory {
  name: string;
  description: string;
  color: string;
  tips: string;
}

export interface SeatMap {
  venueName: string;
  description: string;
  imageNote: string; // hint untuk posisi panggung
  categories: SeatCategory[];
  tips: string[];
  mapUrl: string; // Google Maps venue
}

export const SEAT_MAPS: Record<string, SeatMap> = {
  'Gelora Bung Karno (GBK) Utama': {
    venueName: 'GBK Utama',
    description: 'Stadion terbesar di Indonesia. Kapasitas ~80.000 penonton. Panggung di area lapangan tengah.',
    imageNote: 'Panggung di sisi selatan lapangan. Penonton menghadap ke utara-selatan.',
    mapUrl: 'https://maps.google.com/?q=Stadion+Utama+GBK+Senayan+Jakarta',
    categories: [
      { name: 'Pit / Floor GA',   color: '#ef4444', description: 'Area terdekat panggung, standing only. Paling seru!',    tips: 'Datang 3 jam sebelum pertunjukan. Bawa ear plugs.' },
      { name: 'CAT 1 / Tribune A', color: '#f97316', description: 'Tribune paling depan, view panggung optimal.',           tips: 'Sisi tengah jauh lebih baik dari pojok.' },
      { name: 'CAT 2 / Tribune B', color: '#eab308', description: 'Tribune tengah, balance antara jarak & view.',           tips: 'Row pertama jauh lebih baik dari row belakang.' },
      { name: 'CAT 3 / Tribune C', color: '#22c55e', description: 'Tribune belakang, harga lebih terjangkau.',             tips: 'Bawa binoculars untuk view lebih jelas.' },
      { name: 'CAT 4 / Tribune D', color: '#3b82f6', description: 'Tribune paling jauh, budget-friendly.',                 tips: 'Layar LED biasanya terlihat jelas dari sini.' },
      { name: 'VIP / Soundcheck',  color: '#a855f7', description: 'Area premium dengan fasilitas eksklusif.',              tips: 'Termasuk akses soundcheck & merchandise eksklusif.' },
    ],
    tips: [
      '🚍 Gunakan TransJakarta ke halte GBK / Polda Metro',
      '🅿️ Parkir terbatas — sangat disarankan naik transportasi umum',
      '💧 Bawa minum secukupnya, antrean minuman panjang',
      '📱 Signal kadang lemah saat penuh — download peta offline',
      '🎒 Tas berukuran max 30x30cm (cek regulasi promotor)',
    ],
  },

  'Indonesia Arena, GBK': {
    venueName: 'Indonesia Arena',
    description: 'Indoor arena berkapasitas 16.000. Akustik excellent untuk konser indoor.',
    imageNote: 'Arena berbentuk oval. Panggung di salah satu ujung (biasanya selatan).',
    mapUrl: 'https://maps.google.com/?q=Indonesia+Arena+Senayan+Jakarta',
    categories: [
      { name: 'Floor GA',   color: '#ef4444', description: 'Area di depan panggung, standing. Paling dekat artis!', tips: 'Antri dari pagi kalau ingin posisi depan.' },
      { name: 'CAT 1',      color: '#f97316', description: 'Tribune bawah, dekat panggung.',                         tips: 'Section tengah (C,D,E) adalah yang terbaik.' },
      { name: 'CAT 2',      color: '#eab308', description: 'Tribune bawah, sisi kiri-kanan.',                        tips: 'Hindari section pojok untuk view lebih baik.' },
      { name: 'CAT 3',      color: '#22c55e', description: 'Tribune atas, pandangan bird-eye.',                      tips: 'Perfect untuk melihat koreografi!' },
      { name: 'CAT 4',      color: '#3b82f6', description: 'Tribune atas belakang.',                                 tips: 'Bawa binoculars, tapi layar LED besar terlihat jelas.' },
      { name: 'VIP',        color: '#a855f7', description: 'Kursi premium dengan fasilitas eksklusif.',              tips: 'Biasanya termasuk lounge & merchandise.' },
    ],
    tips: [
      '🚍 TransJakarta halte GBK, jalan ~5 menit',
      '🏨 Hotel terdekat: Hotel Sultan, Fairmont Senayan',
      '🎒 Strict bag policy — maks 30x20cm',
      '🍔 Food court di dalam arena, harga normal',
      '📷 Kamera mirrorless biasanya tidak diizinkan',
    ],
  },

  'Jakarta International Stadium (JIS)': {
    venueName: 'JIS',
    description: 'Stadion modern berkapasitas 82.000. Atap retractable. Fasilitas terbaik di Indonesia.',
    imageNote: 'Panggung biasanya di sisi utara lapangan.',
    mapUrl: 'https://maps.google.com/?q=Jakarta+International+Stadium',
    categories: [
      { name: 'Festival / Pit',    color: '#ef4444', description: 'Lapangan tengah, standing. Paling depan!',       tips: 'Sangat ramai — datang lebih awal.' },
      { name: 'Tribune A / VIP',   color: '#a855f7', description: 'Tribune depan premium.',                         tips: 'Row 1-10 optimal untuk interaksi artis.' },
      { name: 'Tribune B',         color: '#f97316', description: 'Tribune tengah.',                                tips: 'Section M,N,O (tengah) terbaik.' },
      { name: 'Tribune C',         color: '#eab308', description: 'Tribune belakang.',                              tips: 'Layar HD besar terlihat dari sini.' },
      { name: 'Tribune D',         color: '#22c55e', description: 'Tribune atas.',                                  tips: 'Budget-friendly dengan view stadion full.' },
    ],
    tips: [
      '🚌 Bus JIS dari Kemayoran / Pulogadung',
      '🚫 Tidak ada stasiun MRT/LRT dekat — naik shuttle bus',
      '🅿️ Parkir tersedia tapi sangat terbatas di hari H',
      '⛅ Stadion outdoor dengan atap retractable — cek cuaca',
      '🔋 Bawa powerbank — banyak yang perlu charge',
    ],
  },

  'ICE BSD City': {
    venueName: 'ICE BSD',
    description: 'Convention center terbesar di Asia Tenggara. Multi-hall, kapasitas hingga 50.000.',
    imageNote: 'Layout tergantung hall yang dipakai. Biasanya Hall 5-6 untuk konser besar.',
    mapUrl: 'https://maps.google.com/?q=ICE+BSD+City+Tangerang',
    categories: [
      { name: 'Floor GA',   color: '#ef4444', description: 'Area depan panggung, standing.',  tips: 'Datang awal untuk posisi strategis.' },
      { name: 'VIP',        color: '#a855f7', description: 'Area premium dengan kursi.',      tips: 'Biasanya di elevated platform belakang floor.' },
      { name: 'Tribune',    color: '#eab308', description: 'Tribune samping/belakang.',       tips: 'View panoramik, lebih nyaman untuk konser panjang.' },
    ],
    tips: [
      '🚗 Akses mudah via Tol BSD Exit, Jl. BSD Raya Utama',
      '🅿️ Parkir luas tapi bisa padat — datang 2 jam lebih awal',
      '🚌 Shuttle dari Stasiun MRT Lebak Bulus (cek schedule)',
      '🏨 Banyak hotel di sekitar ICE BSD',
      '🌡️ Indoor dengan AC — bawa jaket tipis',
    ],
  },

  'NICE PIK2': {
    venueName: 'NICE PIK2',
    description: 'Convention center baru di Pantai Indah Kapuk 2. Modern, akustik baik.',
    imageNote: 'Venue berbentuk persegi panjang. Panggung di sisi pendek.',
    mapUrl: 'https://maps.google.com/?q=NICE+PIK2+Pantai+Indah+Kapuk',
    categories: [
      { name: 'Floor GA', color: '#ef4444', description: 'Area depan panggung.', tips: 'Floor area luas, jarak ke panggung sangat dekat.' },
      { name: 'VIP',      color: '#a855f7', description: 'Area premium.',        tips: 'Elevated view, kursi comfy.' },
      { name: 'Tribune',  color: '#eab308', description: 'Tribune belakang.',    tips: 'Layar LED besar terlihat jelas.' },
    ],
    tips: [
      '🚗 Akses via Toll PIK 2, keluar Kamal Muara',
      '🅿️ Parkir luas di area PIK2',
      '🍽️ Mall & restoran lengkap di sekitar venue',
      '⚠️ Jauh dari pusat kota — berangkat lebih awal',
    ],
  },

  'Pantai Carnaval Ancol': {
    venueName: 'Ancol Carnaval',
    description: 'Venue outdoor tepi laut. Nuansa festival yang unik. Kapasitas 30.000+.',
    imageNote: 'Open air festival ground. Panggung utama menghadap laut.',
    mapUrl: 'https://maps.google.com/?q=Pantai+Carnaval+Ancol+Jakarta',
    categories: [
      { name: 'Festival GA',  color: '#ef4444', description: 'Area depan panggung, standing.',     tips: 'Angin laut bisa kencang — bawa jaket.' },
      { name: 'VIP Festival', color: '#a855f7', description: 'Area VIP dengan view lebih baik.',   tips: 'Biasanya elevated platform, bar VIP.' },
      { name: '2-Day Pass',   color: '#22c55e', description: 'Pass 2 hari untuk festival multi-day.', tips: 'Lebih hemat vs 2x beli 1-day pass.' },
    ],
    tips: [
      '🚌 TransJakarta halte Ancol',
      '🚗 Tol Dalam Kota exit Pluit, lanjut ke Ancol',
      '🌊 Venue tepi laut — suhu lebih sejuk tapi bisa hujan',
      '🎒 Bawa jas hujan / poncho untuk outdoor festival',
      '🍺 Bar & food stalls tersedia di dalam venue',
      '📱 Signal biasanya oke di area ini',
    ],
  },

  'Beach City International Stadium': {
    venueName: 'Beach City Ancol',
    description: 'Stadium semi-outdoor di Ancol. Kapasitas ~30.000.',
    imageNote: 'Panggung di sisi selatan lapangan. Tribun di 3 sisi.',
    mapUrl: 'https://maps.google.com/?q=Beach+City+International+Stadium+Ancol',
    categories: [
      { name: 'Pit / Floor',   color: '#ef4444', description: 'Area lapangan depan panggung.',    tips: 'Standing area, bisa panas siang hari.' },
      { name: 'Tribune B',     color: '#f97316', description: 'Tribune tengah.',                  tips: 'View optimal untuk keseluruhan pertunjukan.' },
      { name: 'Tribune C',     color: '#eab308', description: 'Tribune belakang.',                tips: 'Harga lebih terjangkau.' },
      { name: 'VIP',           color: '#a855f7', description: 'Area premium.',                    tips: 'Biasanya di elevated section depan.' },
    ],
    tips: [
      '🚌 TransJakarta / Ojol ke Ancol',
      '🚗 Tol Dalam Kota → Pluit → Ancol',
      '⛅ Semi-outdoor — bawa sunscreen & raincoat',
      '🅿️ Parkir Ancol tersedia, cukup luas',
    ],
  },
};

/** Dapatkan seat map berdasarkan nama venue (partial match) */
export function getSeatMap(venueName: string): SeatMap | null {
  if (SEAT_MAPS[venueName]) return SEAT_MAPS[venueName];
  const lower = venueName.toLowerCase();
  for (const [key, val] of Object.entries(SEAT_MAPS)) {
    if (lower.includes(key.toLowerCase().split(' ')[0]) ||
        key.toLowerCase().includes(lower.split(' ')[0])) {
      return val;
    }
  }
  return null;
}
