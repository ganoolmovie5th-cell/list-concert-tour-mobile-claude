import { Concert, SortOption, FilterType } from '../types';
export const TODAY = new Date();
export const isPast = (c: Concert) => c.rawDate < TODAY;
export const isUpcoming = (c: Concert) => c.rawDate >= TODAY;
export const fmtCount = (n: number) => n >= 1000 ? (n/1000).toFixed(1).replace('.0','')+'k' : String(n);
export function buildWaHref(contact: string): string | null {
  const digits = contact.replace(/\D/g, '');
  if (!digits || digits.length < 8) return null;
  let num = digits;
  if (num.startsWith('0')) num = '62' + num.slice(1);
  else if (!num.startsWith('62')) num = '62' + num;
  return `https://wa.me/${num}`;
}
export const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff/60000), h = Math.floor(m/60), d = Math.floor(h/24);
  if (d > 30) return new Date(date).toLocaleDateString('id-ID',{day:'numeric',month:'short'});
  if (d > 0) return `${d} hari lalu`; if (h > 0) return `${h} jam lalu`;
  if (m > 0) return `${m} menit lalu`; return 'Baru saja';
};
export const filterConcerts = (concerts: Concert[], filter: FilterType, search: string, wishlist: Set<string>) => {
  let r = [...concerts];
  if (search.trim()) { const q = search.toLowerCase(); r = r.filter(c => c.artist.toLowerCase().includes(q) || c.venue.toLowerCase().includes(q) || c.city.toLowerCase().includes(q)); }
  switch(filter) {
    case 'confirmed': r = r.filter(c => c.confirmStatus==='confirmed'); break;
    case 'rumor': r = r.filter(c => c.confirmStatus==='rumor'); break;
    case 'kpop': case 'pop': case 'rock': case 'jazz': case 'indie': r = r.filter(c => c.genre===filter); break;
    case 'upcoming': r = r.filter(isUpcoming); break;
    case 'past': r = r.filter(isPast); break;
    case 'wishlist': r = r.filter(c => wishlist.has(c.id)); break;
  }
  return r;
};
export const sortConcerts = (concerts: Concert[], sort: SortOption) => {
  const l = [...concerts];
  switch(sort) {
    case 'date-asc': return l.sort((a,b) => a.rawDate.getTime()-b.rawDate.getTime());
    case 'date-desc': return l.sort((a,b) => b.rawDate.getTime()-a.rawDate.getTime());
    case 'price-asc': return l.sort((a,b) => (a.priceMin||999999999)-(b.priceMin||999999999));
    case 'price-desc': return l.sort((a,b) => (b.priceMax||0)-(a.priceMax||0));
    case 'name-asc': return l.sort((a,b) => a.artist.localeCompare(b.artist));
  }
  return l;
};
export const getShareText = (c: Concert) =>
  `🎵 ${c.artist}\n${c.tour}\n📅 ${c.dates[0]}\n📍 ${c.venue}, ${c.city}\n💰 ${c.priceRange}\n${c.confirmStatus==='confirmed'?'✅ Confirmed':'🔮 Rumor'}\n\nInfo: https://www.list-concert-tour.web.id`;
export const genreColor = (genre: string, colors: Record<string,string>) =>
  ({kpop: colors.kpop, pop: colors.pop, rock: colors.rock, jazz: colors.jazz, indie: colors.indie}[genre] || colors.accent);
export const getGoogleCalendarUrl = (c: Concert) => {
  if (c.confirmStatus==='rumor') return null;
  const s = c.rawDate.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  const e = new Date(c.rawDate.getTime()+3*3600000).toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent('🎵 '+c.artist+' Live in Jakarta')}&dates=${s}/${e}&location=${encodeURIComponent(c.venue+', '+c.city)}&sf=true&output=xml`;
};
