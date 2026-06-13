export type ConfirmStatus = 'confirmed' | 'rumor';
export type Genre = 'kpop' | 'pop' | 'rock' | 'jazz' | 'indie';
export type SortOption = 'date-asc' | 'date-desc' | 'price-asc' | 'price-desc' | 'name-asc';
export type FilterType = 'all' | 'confirmed' | 'rumor' | 'kpop' | 'pop' | 'rock' | 'jazz' | 'indie' | 'upcoming' | 'past' | 'wishlist';
export type Lang = 'id' | 'en';

export interface TicketCategory { name: string; price: string; }
export interface Concert {
  id: string; artist: string; tour: string; genre: Genre; emoji: string;
  dates: string[]; rawDate: Date; time: string; venue: string; city: string;
  promotor: string; ticketPlatform: string; ticketUrl: string;
  priceRange: string; priceMin: number; priceMax: number;
  ticketCategories: TicketCategory[]; confirmStatus: ConfirmStatus; hot: boolean;
  description: string; sources: string[]; rumorDetail?: string; lineup?: string[];
}
export interface Review { uid: string; author: string; rating: number; comment: string; date: string; likes: number; }
export interface Comment { uid: string; author: string; text: string; date: string; likes: number; replyTo: { author: string; text: string } | null; }
