import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Linking, Dimensions, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../context/WishlistContext';
import { useSocialFeatures } from '../hooks/useSocialFeatures';
import { useDiscussion } from '../hooks/useDiscussion';
import { useReviews } from '../hooks/useReviews';
import { useBeenThere } from '../hooks/useBeenThere';
import { useTicketMarket, buildWaHref, formatRpDisplay } from '../hooks/useTicketMarket';
import { useGroupBuying, buildWaHrefGB } from '../hooks/useGroupBuying';
import { useFanPhotos } from '../hooks/useFanPhotos';
import { ShareSheet } from '../components/ShareSheet';
import { Toast } from '../components/Toast';
import { CONCERTS, SETLISTS, ARTIST_SOCIALS, SPOTIFY_ARTISTS } from '../data/concerts';
import { getGoogleCalendarUrl, isPast, timeAgo } from '../utils/helpers';

const { width } = Dimensions.get('window');
type Tab = 'info' | 'setlist' | 'diskusi' | 'review';

const GENRE_LABEL: Record<string, string> = {
  kpop: 'K-Pop', pop: 'Pop / R&B', rock: 'Rock / Metal', jazz: 'Jazz', indie: 'Indie / Festival',
};

export function DetailScreen({ route, navigation }: any) {
  const { concertId } = route.params;
  const concert = CONCERTS.find(c => c.id === concertId);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { going, interested, myVote, vote } = useSocialFeatures(concertId, past);
  const { comments, addComment, likeComment } = useDiscussion(concertId);
  const { reviews, hasReviewed, avgRating, addReview, likeReview } = useReviews(concertId);
  const { toggle: toggleBeenThere, hasAttended } = useBeenThere();
  const { listings, ownerUid: tmOwnerUid, addListing, markSold, deleteListing, updateListing } = useTicketMarket(concertId);
  const { posts, ownerUid: gbOwnerUid, addPost, deletePost: deleteGbPost, updatePost } = useGroupBuying(concertId);
  const { photos, addPhoto } = useFanPhotos(concertId);

  const [tab, setTab] = useState<Tab>('info');
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' as 'success' | 'error' | 'info' });

  // Diskusi
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [replyTo, setReplyTo] = useState<{ author: string; text: string } | null>(null);

  // Review
  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  // Forum Jual Beli
  const [tmType, setTmType] = useState<'jual' | 'beli'>('jual');
  const [tmName, setTmName] = useState('');
  const [tmCategory, setTmCategory] = useState('');
  const [tmQty, setTmQty] = useState('1');
  const [tmPrice, setTmPrice] = useState('');
  const [tmContact, setTmContact] = useState('');
  const [tmNote, setTmNote] = useState('');
  const [showTmForm, setShowTmForm] = useState(false);
  const [editTmUid, setEditTmUid] = useState<string | null>(null);
  const [editTmFields, setEditTmFields] = useState<any>({});

  // Cari Teman Nonton
  const [gbName, setGbName] = useState('');
  const [gbCategory, setGbCategory] = useState('');
  const [gbContact, setGbContact] = useState('');
  const [gbIg, setGbIg] = useState('');
  const [gbNote, setGbNote] = useState('');
  const [showGbForm, setShowGbForm] = useState(false);
  const [editGbUid, setEditGbUid] = useState<string | null>(null);
  const [editGbFields, setEditGbFields] = useState<any>({});

  // Foto Fans
  const [showFotoForm, setShowFotoForm] = useState(false);
  const [fotoCaption, setFotoCaption] = useState('');
  const [fotoAuthor, setFotoAuthor] = useState('');
  const [fotoLoading, setFotoLoading] = useState(false);

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Izinkan akses galeri untuk upload foto.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setFotoLoading(true);
      const uri = result.assets[0].uri;
      await addPhoto(uri, fotoCaption, fotoAuthor);
      setFotoCaption(''); setFotoAuthor('');
      setShowFotoForm(false);
      setFotoLoading(false);
      showToast('📸 Foto berhasil ditambahkan!');
    }
  };

  if (!concert) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.text }}>Konser tidak ditemukan</Text>
      </View>
    );
  }

  const past = isPast(concert);
  const isRumor = concert.confirmStatus === 'rumor';
  const forumDisabled = past || isRumor;
  const fotoEnabled = past; // Foto dari Fans: hanya untuk konser past (sudah berlangsung)
  const setlist = SETLISTS[concertId] || [];
  const socials = ARTIST_SOCIALS[concertId] || {};
  const spotifyId = SPOTIFY_ARTISTS[concertId] || null;
  const calUrl = getGoogleCalendarUrl(concert);
  const wishlisted = isWishlisted(concertId);
  const attended = hasAttended(concertId);

  const mapsQuery = encodeURIComponent(`${concert.venue}, ${concert.city}`);
  const mapsUrl = `https://maps.google.com/?q=${mapsQuery}`;
  const spotifyUrl = spotifyId ? `https://open.spotify.com/artist/${spotifyId}` : null;

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message: msg, visible: true, type });
    setTimeout(() => setToast(p => ({ ...p, visible: false })), 2800);
  };

  const handleWishlist = async () => {
    const added = await toggleWishlist(concertId);
    showToast(added ? t('addedToWishlist') : t('removedFromWishlist'), added ? 'success' : 'info');
  };

  const handleVote = async (type: 'going' | 'interested') => {
    const result = await vote(type);
    if (result === null) showToast(t('voteCancelled'), 'info');
    else if (result === 'going') showToast(t('goingVote'));
    else showToast(t('interestedVote'));
  };

  const handleBeenThere = async () => {
    const added = await toggleBeenThere(concertId);
    showToast(added ? t('beenThereAdded') : t('beenThereRemoved'), added ? 'success' : 'info');
  };

  const handleSendComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentAuthor, commentText, replyTo);
    setCommentText('');
    setReplyTo(null);
    showToast(t('commentSent'));
  };

  const handleSendReview = async () => {
    if (!reviewText.trim()) return;
    await addReview(reviewAuthor, reviewRating, reviewText);
    setReviewText('');
    showToast(t('reviewSubmitted'));
  };

  const handlePostListing = async () => {
    if (!tmName.trim() || !tmContact.trim()) {
      Alert.alert('Wajib diisi', 'Nama dan kontak WA harus diisi.');
      return;
    }
    const ok = await addListing(tmType, tmName, tmCategory, parseInt(tmQty) || 1, tmPrice, tmContact, tmNote);
    if (ok) {
      setTmName(''); setTmCategory(''); setTmQty('1'); setTmPrice(''); setTmContact(''); setTmNote('');
      setShowTmForm(false);
      showToast('Listing berhasil diposting! 🎫');
    }
  };

  const handleSaveTmEdit = async () => {
    if (!editTmUid) return;
    await updateListing(editTmUid, {
      ...editTmFields,
      price: (editTmFields.price || '').replace(/\./g, ''),
    });
    setEditTmUid(null); setEditTmFields({});
    showToast('✅ Listing diperbarui!');
  };

  const handlePostGroupBuying = async () => {
    if (!gbName.trim() || !gbContact.trim()) {
      Alert.alert('Wajib diisi', 'Nama dan kontak WA harus diisi.');
      return;
    }
    const ok = await addPost(gbName, gbCategory, gbContact, gbIg, gbNote);
    if (ok) {
      setGbName(''); setGbCategory(''); setGbContact(''); setGbIg(''); setGbNote('');
      setShowGbForm(false);
      showToast('Post berhasil! 🎉');
    }
  };

  const handleSaveGbEdit = async () => {
    if (!editGbUid) return;
    await updatePost(editGbUid, editGbFields);
    setEditGbUid(null); setEditGbFields({});
    showToast('✅ Post diperbarui!');
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: 'info', label: 'Info' },
    { key: 'setlist', label: 'Setlist' },
    { key: 'diskusi', label: t('discussion') },
    { key: 'review', label: 'Review' },
  ];

  const statusColor = concert.confirmStatus === 'confirmed' ? (past ? colors.past : colors.confirmed) : colors.rumor;
  const statusBg = concert.confirmStatus === 'confirmed' ? (past ? colors.pastBg : colors.confirmedBg) : colors.rumorBg;
  const statusLabel = concert.confirmStatus === 'confirmed' ? (past ? '⏰ Past' : '✅ Confirmed') : '🔮 Rumor';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroWrap}>
          <Image
            source={{ uri: `https://www.list-concert-tour.web.id/images/${concert.id}.jpeg` }}
            style={styles.heroImage}
            resizeMode="cover"
          />
          <View style={[styles.heroOverlay, { backgroundColor: 'rgba(0,0,0,0.45)' }]} />
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionBtn} onPress={() => setShowShare(true)}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionBtn} onPress={handleWishlist}>
              <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={20} color={wishlisted ? colors.wishlistActive : '#fff'} />
            </TouchableOpacity>
          </View>
          <View style={[styles.heroBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.heroBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Title block */}
        <View style={[styles.titleBlock, { backgroundColor: colors.surface }]}>
          <Text style={styles.emoji}>{concert.emoji}</Text>
          <Text style={[styles.artistName, { color: colors.text }]}>{concert.artist}</Text>
          <Text style={[styles.tourName, { color: colors.textMuted }]}>{concert.tour}</Text>
          {concert.hot && !past && (
            <View style={[styles.hotBadge, { backgroundColor: colors.hot + '22' }]}>
              <Text style={[styles.hotText, { color: colors.hot }]}>🔥 HOT CONCERT</Text>
            </View>
          )}
        </View>

        {/* Tabs */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {TABS.map(tb => (
            <TouchableOpacity
              key={tb.key}
              style={[styles.tab, tab === tb.key && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              onPress={() => setTab(tb.key)}
            >
              <Text style={[styles.tabText, { color: tab === tb.key ? colors.accent : colors.textMuted }]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ─── INFO TAB ─── */}
        {tab === 'info' && (
          <View style={styles.tabContent}>
            {/* Rumor Warning */}
            {isRumor && (
              <View style={[styles.rumorWarn, { backgroundColor: colors.rumorBg, borderColor: colors.rumor + '44' }]}>
                <Text style={[styles.rumorText, { color: colors.rumor }]}>{t('rumorWarning')}</Text>
                {concert.rumorDetail && <Text style={[styles.rumorDetail, { color: colors.textMuted }]}>{concert.rumorDetail}</Text>}
              </View>
            )}

            {/* Info Rows — urutan sesuai website */}
            {[
              { icon: 'calendar-outline', label: t('dateLabel'), value: concert.dates.join(' & ') },
              { icon: 'time-outline', label: t('timeLabel'), value: concert.time },
              { icon: 'location-outline', label: t('venueLabel'), value: `${concert.venue}, ${concert.city}` },
              { icon: 'business-outline', label: t('promotorLabel'), value: concert.promotor },
              { icon: 'musical-notes-outline', label: t('genreLabel'), value: GENRE_LABEL[concert.genre] || concert.genre },
              { icon: 'ticket-outline', label: t('platformLabel'), value: concert.ticketPlatform },
              { icon: 'cash-outline', label: t('priceRangeLabel'), value: concert.priceRange },
            ].map(row => (
              <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Ionicons name={row.icon as any} size={18} color={colors.accent} style={{ width: 26 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textSubtle }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
                </View>
              </View>
            ))}

            {/* Google Maps */}
            <TouchableOpacity
              style={[styles.outlineBtn, { borderColor: colors.accent }]}
              onPress={() => Linking.openURL(mapsUrl)}
            >
              <Ionicons name="map-outline" size={16} color={colors.accent} />
              <Text style={[styles.outlineBtnText, { color: colors.accent }]}>{t('openMaps')}</Text>
            </TouchableOpacity>

            {/* Ticket Categories */}
            {concert.ticketCategories.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('ticketCategories')}</Text>
                {concert.ticketCategories.map((cat, i) => (
                  <View key={i} style={[styles.catRow, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.catName, { color: colors.textMuted }]}>{cat.name}</Text>
                    <Text style={[styles.catPrice, { color: colors.accent }]}>{cat.price}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Buy Ticket — confirmed upcoming only */}
            {!past && !isRumor && concert.ticketUrl ? (
              <TouchableOpacity
                style={[styles.bigBtn, { backgroundColor: colors.accent }]}
                onPress={() => Linking.openURL(concert.ticketUrl)}
              >
                <Ionicons name="ticket-outline" size={18} color="#fff" />
                <Text style={styles.bigBtnText}>{t('buyTicketNow')}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Google Calendar — upcoming confirmed only */}
            {calUrl && !past && (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: colors.accent }]}
                onPress={() => Linking.openURL(calUrl)}
              >
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                <Text style={[styles.outlineBtnText, { color: colors.accent }]}>{t('addToCalendar')}</Text>
              </TouchableOpacity>
            )}

            {/* Been There — past only */}
            {past && (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: attended ? colors.confirmed : colors.border }]}
                onPress={handleBeenThere}
              >
                <Ionicons
                  name={attended ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={16}
                  color={attended ? colors.confirmed : colors.textMuted}
                />
                <Text style={[styles.outlineBtnText, { color: attended ? colors.confirmed : colors.textMuted }]}>
                  {attended ? `✅ ${t('beenThere')}` : t('markBeenThere')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Going / Interested — sesuai website:
                past = dummy disabled, confirmed = aktif, rumor = aktif */}
            {past ? (
              <View style={styles.voteRow}>
                <View style={[styles.voteBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: 0.5 }]}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.voteBtnText, { color: colors.textMuted }]}>🎟️ Hadir {going}</Text>
                </View>
                <View style={[styles.voteBtn, { backgroundColor: colors.surfaceElevated, borderColor: colors.border, opacity: 0.5 }]}>
                  <Ionicons name="star-outline" size={16} color={colors.textMuted} />
                  <Text style={[styles.voteBtnText, { color: colors.textMuted }]}>⭐ Tertarik {interested}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.voteRow}>
                <TouchableOpacity
                  style={[styles.voteBtn, { backgroundColor: myVote === 'going' ? colors.accent : colors.surfaceElevated, borderColor: colors.accent }]}
                  onPress={() => handleVote('going')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={myVote === 'going' ? '#fff' : colors.accent} />
                  <Text style={[styles.voteBtnText, { color: myVote === 'going' ? '#fff' : colors.accent }]}>🎟️ Going {going}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voteBtn, { backgroundColor: myVote === 'interested' ? colors.accentLight : colors.surfaceElevated, borderColor: colors.accentLight }]}
                  onPress={() => handleVote('interested')}
                >
                  <Ionicons name="star-outline" size={16} color={myVote === 'interested' ? '#fff' : colors.accentLight} />
                  <Text style={[styles.voteBtnText, { color: myVote === 'interested' ? '#fff' : colors.accentLight }]}>⭐ Interested {interested}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Spotify Preview */}
            {spotifyUrl && (
              <TouchableOpacity
                style={[styles.spotifyBtn, { backgroundColor: '#1DB95422' }]}
                onPress={() => Linking.openURL(spotifyUrl)}
              >
                <Ionicons name="musical-notes" size={18} color="#1DB954" />
                <Text style={[styles.spotifyBtnText, { color: '#1DB954' }]}>{t('spotifyPreview')}</Text>
                <Ionicons name="open-outline" size={14} color="#1DB95488" />
              </TouchableOpacity>
            )}

            {/* Description */}
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>📝 Deskripsi</Text>
              <Text style={[styles.desc, { color: colors.textMuted }]}>{concert.description}</Text>
            </View>

            {/* Lineup */}
            {concert.lineup && concert.lineup.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('lineupLabel')}</Text>
                <View style={styles.lineupWrap}>
                  {concert.lineup.map((a, i) => (
                    <View key={i} style={[styles.lineupChip, { backgroundColor: colors.accent + '22', borderColor: colors.accent + '44' }]}>
                      <Text style={[styles.lineupText, { color: colors.accent }]}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Social Media */}
            {(socials.instagram || socials.twitter) && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('socialMedia')}</Text>
                <View style={styles.socialRow}>
                  {socials.instagram && (
                    <TouchableOpacity
                      style={[styles.socialBtn, { backgroundColor: '#E1306C22' }]}
                      onPress={() => Linking.openURL(socials.instagram!)}
                    >
                      <Ionicons name="logo-instagram" size={20} color="#E1306C" />
                      <Text style={[styles.socialText, { color: '#E1306C' }]}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {socials.twitter && (
                    <TouchableOpacity
                      style={[styles.socialBtn, { backgroundColor: '#1DA1F222' }]}
                      onPress={() => Linking.openURL(socials.twitter!)}
                    >
                      <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                      <Text style={[styles.socialText, { color: '#1DA1F2' }]}>Twitter/X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* ─── FORUM JUAL BELI TIKET ─── */}
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>🏷️ {t('forumJualBeli')}</Text>
                {!forumDisabled && (
                  <TouchableOpacity onPress={() => { setShowTmForm(v => !v); setEditTmUid(null); }}>
                    <Ionicons name={showTmForm ? 'close-circle-outline' : 'add-circle-outline'} size={22} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>

              {forumDisabled ? (
                <Text style={[styles.disabledText, { color: colors.textSubtle }]}>
                  {past ? t('forumDisabled') : t('forumDisabledRumor')}
                </Text>
              ) : showTmForm ? (
                <View style={{ gap: 8 }}>
                  <View style={styles.tmTypeRow}>
                    {(['jual', 'beli'] as const).map(tp => (
                      <TouchableOpacity key={tp}
                        style={[styles.tmTypeBtn, { borderColor: tmType === tp ? colors.accent : colors.border, backgroundColor: tmType === tp ? colors.accent + '22' : 'transparent' }]}
                        onPress={() => setTmType(tp)}>
                        <Text style={[styles.tmTypeBtnText, { color: tmType === tp ? colors.accent : colors.textMuted }]}>
                          {tp === 'jual' ? `🎫 ${t('jual')} Tiket` : `🔍 ${t('beli')} Tiket`}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Nama kamu *" placeholderTextColor={colors.textSubtle} value={tmName} onChangeText={setTmName} />
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={t('kategoriTiket')} placeholderTextColor={colors.textSubtle} value={tmCategory} onChangeText={setTmCategory} />
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Jml tiket" placeholderTextColor={colors.textSubtle} value={tmQty} onChangeText={setTmQty} keyboardType="number-pad" />
                    <TextInput style={[styles.input, { flex: 2, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Harga/tiket (contoh: 1.500.000)" placeholderTextColor={colors.textSubtle} value={tmPrice} onChangeText={setTmPrice} keyboardType="number-pad" />
                  </View>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="No WhatsApp * (contoh: 08123...)" placeholderTextColor={colors.textSubtle} value={tmContact} onChangeText={setTmContact} keyboardType="phone-pad" />
                  <TextInput style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={t('catatan')} placeholderTextColor={colors.textSubtle} value={tmNote} onChangeText={setTmNote} multiline />
                  <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.accent }]} onPress={handlePostListing}>
                    <Text style={styles.sendBtnText}>{t('postingListing')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {listings.length === 0 ? (
                <Text style={[styles.emptyInline, { color: colors.textSubtle }]}>{t('belumAdaListing')}</Text>
              ) : (
                listings.map(l => {
                  const waHref = buildWaHref(l.contact);
                  const isOwner = l.ownerUid === tmOwnerUid;
                  const soldLabel = l.type === 'jual' ? 'Terjual' : 'Ditemukan';
                  const priceDisplay = formatRpDisplay(l.price);

                  if (editTmUid === l.uid) {
                    return (
                      <View key={l.uid} style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, gap: 8 }]}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editTmFields.name ?? l.name} onChangeText={v => setEditTmFields((p: any) => ({ ...p, name: v }))} placeholder="Nama" placeholderTextColor={colors.textSubtle} />
                          <TextInput style={[styles.input, { flex: 1, backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editTmFields.qty !== undefined ? String(editTmFields.qty) : String(l.qty)} onChangeText={v => setEditTmFields((p: any) => ({ ...p, qty: parseInt(v) || 1 }))} placeholder="Jml" placeholderTextColor={colors.textSubtle} keyboardType="number-pad" />
                        </View>
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editTmFields.category ?? l.category} onChangeText={v => setEditTmFields((p: any) => ({ ...p, category: v }))} placeholder="Kategori" placeholderTextColor={colors.textSubtle} />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editTmFields.price ?? l.price} onChangeText={v => setEditTmFields((p: any) => ({ ...p, price: v }))} placeholder="Harga" placeholderTextColor={colors.textSubtle} keyboardType="number-pad" />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editTmFields.contact ?? l.contact} onChangeText={v => setEditTmFields((p: any) => ({ ...p, contact: v }))} placeholder="Kontak WA" placeholderTextColor={colors.textSubtle} />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editTmFields.note ?? l.note} onChangeText={v => setEditTmFields((p: any) => ({ ...p, note: v }))} placeholder="Catatan" placeholderTextColor={colors.textSubtle} />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={[styles.sendBtn, { flex: 1, backgroundColor: colors.accent }]} onPress={handleSaveTmEdit}><Text style={styles.sendBtnText}>💾 Simpan</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.sendBtn, { flex: 1, backgroundColor: colors.surfaceElevated }]} onPress={() => setEditTmUid(null)}><Text style={[styles.sendBtnText, { color: colors.textMuted }]}>Batal</Text></TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={l.uid} style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, opacity: l.sold ? 0.6 : 1 }]}>
                      <View style={styles.listingHeader}>
                        <View style={[styles.tmBadge, { backgroundColor: l.type === 'jual' ? colors.confirmed + '22' : colors.accent + '22' }]}>
                          <Text style={[styles.tmBadgeText, { color: l.type === 'jual' ? colors.confirmed : colors.accent }]}>
                            {l.type === 'jual' ? '🎫 JUAL' : '🔍 BELI'}{l.sold ? ' ✓' : ''}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.listingName, { color: colors.text }]}>
                            {l.name}{l.sold ? <Text style={{ color: '#4ade80', fontSize: 11 }}> ({soldLabel})</Text> : null}
                          </Text>
                          <Text style={[styles.listingDetail, { color: colors.textMuted }]}>
                            {l.category} · {l.qty}x{priceDisplay ? ` · ${priceDisplay}` : ''}
                          </Text>
                        </View>
                        {/* Emoji kontak — nomor tidak diekspos langsung */}
                        {waHref && (
                          <TouchableOpacity onPress={() => Linking.openURL(waHref)}>
                            <Text style={{ fontSize: 22 }}>💬</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {l.note ? <Text style={[styles.listingNote, { color: colors.textSubtle }]}>{l.note}</Text> : null}
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                        <Text style={[styles.listingTime, { color: colors.textSubtle }]}>{timeAgo(l.date)}</Text>
                        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                          {l.sold ? (
                            <Text style={{ fontSize: 12, color: '#4ade80' }}>✅ {soldLabel}</Text>
                          ) : isOwner ? (
                            <TouchableOpacity onPress={() => markSold(l.uid)}>
                              <Text style={{ fontSize: 12, color: colors.confirmed }}>✓ Tandai {soldLabel}</Text>
                            </TouchableOpacity>
                          ) : null}
                          {isOwner && !l.sold && (
                            <View style={{ flexDirection: 'row', gap: 6 }}>
                              <TouchableOpacity onPress={() => { setEditTmUid(l.uid); setEditTmFields({}); }}>
                                <Text style={{ fontSize: 16 }}>✏️</Text>
                              </TouchableOpacity>
                              <TouchableOpacity onPress={() => Alert.alert('Hapus', 'Hapus listing ini?', [{ text: 'Batal' }, { text: 'Hapus', style: 'destructive', onPress: () => { deleteListing(l.uid); showToast('🗑️ Listing dihapus.', 'info'); } }])}>
                                <Text style={{ fontSize: 16 }}>🗑️</Text>
                              </TouchableOpacity>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* ─── CARI TEMAN NONTON ─── */}
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>👥 {t('cariTemanNonton')}</Text>
                {!forumDisabled && (
                  <TouchableOpacity onPress={() => { setShowGbForm(v => !v); setEditGbUid(null); }}>
                    <Ionicons name={showGbForm ? 'close-circle-outline' : 'add-circle-outline'} size={22} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.cardSub, { color: colors.textSubtle }]}>
                Cari teman nonton bareng! Kontak ditampilkan sebagai ikon — nomor tidak diekspos.
              </Text>

              {forumDisabled ? (
                <Text style={[styles.disabledText, { color: colors.textSubtle }]}>
                  {past ? t('forumDisabled') : t('forumDisabledRumor')}
                </Text>
              ) : showGbForm ? (
                <View style={{ gap: 8 }}>
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Nama kamu *" placeholderTextColor={colors.textSubtle} value={gbName} onChangeText={setGbName} />
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="Kategori tiket (CAT 1, VIP...)" placeholderTextColor={colors.textSubtle} value={gbCategory} onChangeText={setGbCategory} />
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="No WhatsApp * (contoh: 08123...)" placeholderTextColor={colors.textSubtle} value={gbContact} onChangeText={setGbContact} keyboardType="phone-pad" />
                  <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder="@instagram (opsional)" placeholderTextColor={colors.textSubtle} value={gbIg} onChangeText={setGbIg} />
                  <TextInput style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} placeholder={t('cariTemanPlaceholder')} placeholderTextColor={colors.textSubtle} value={gbNote} onChangeText={setGbNote} multiline />
                  <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.accent }]} onPress={handlePostGroupBuying}>
                    <Text style={styles.sendBtnText}>{t('postCariTeman')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {posts.length === 0 ? (
                <Text style={[styles.emptyInline, { color: colors.textSubtle }]}>{t('belumAdaCariTeman')}</Text>
              ) : (
                posts.map(p => {
                  const waHref = buildWaHrefGB(p.contact);
                  const igHref = p.ig ? `https://instagram.com/${p.ig}` : null;
                  const isOwner = p.ownerUid === gbOwnerUid;

                  if (editGbUid === p.uid) {
                    return (
                      <View key={p.uid} style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder, gap: 8 }]}>
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editGbFields.name ?? p.name} onChangeText={v => setEditGbFields((x: any) => ({ ...x, name: v }))} placeholder="Nama" placeholderTextColor={colors.textSubtle} />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editGbFields.category ?? p.category} onChangeText={v => setEditGbFields((x: any) => ({ ...x, category: v }))} placeholder="Kategori" placeholderTextColor={colors.textSubtle} />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editGbFields.contact ?? p.contact} onChangeText={v => setEditGbFields((x: any) => ({ ...x, contact: v }))} placeholder="No WA" placeholderTextColor={colors.textSubtle} keyboardType="phone-pad" />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editGbFields.ig ?? p.ig} onChangeText={v => setEditGbFields((x: any) => ({ ...x, ig: v.replace('@', '') }))} placeholder="@instagram" placeholderTextColor={colors.textSubtle} />
                        <TextInput style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]} value={editGbFields.note ?? p.note} onChangeText={v => setEditGbFields((x: any) => ({ ...x, note: v }))} placeholder="Catatan" placeholderTextColor={colors.textSubtle} />
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity style={[styles.sendBtn, { flex: 1, backgroundColor: colors.accent }]} onPress={handleSaveGbEdit}><Text style={styles.sendBtnText}>💾 Simpan</Text></TouchableOpacity>
                          <TouchableOpacity style={[styles.sendBtn, { flex: 1, backgroundColor: colors.surfaceElevated }]} onPress={() => setEditGbUid(null)}><Text style={[styles.sendBtnText, { color: colors.textMuted }]}>Batal</Text></TouchableOpacity>
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={p.uid} style={[styles.listingCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                      <View style={styles.listingHeader}>
                        <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
                          <Text style={[styles.avatarText, { color: colors.accent }]}>{p.name[0]?.toUpperCase()}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.listingName, { color: colors.text }]}>{p.name}</Text>
                          <Text style={[styles.listingDetail, { color: colors.textMuted }]}>{timeAgo(p.date)} · {p.category}</Text>
                        </View>
                        {/* Emoji kontak — WA & IG */}
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          {waHref && (
                            <TouchableOpacity onPress={() => Linking.openURL(waHref)}>
                              <Text style={{ fontSize: 22 }}>💬</Text>
                            </TouchableOpacity>
                          )}
                          {igHref && (
                            <TouchableOpacity onPress={() => Linking.openURL(igHref)}>
                              <Text style={{ fontSize: 22 }}>📷</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>
                      {p.note ? <Text style={[styles.listingNote, { color: colors.textMuted }]}>{p.note}</Text> : null}
                      {isOwner && (
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
                          <TouchableOpacity onPress={() => { setEditGbUid(p.uid); setEditGbFields({}); }}>
                            <Text style={{ fontSize: 16 }}>✏️</Text>
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => Alert.alert('Hapus', 'Hapus post ini?', [{ text: 'Batal' }, { text: 'Hapus', style: 'destructive', onPress: () => { deleteGbPost(p.uid); showToast('🗑️ Post dihapus.', 'info'); } }])}>
                            <Text style={{ fontSize: 16 }}>🗑️</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>

            {/* Sources */}
            {concert.sources.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('sources')}</Text>
                {concert.sources.map((s, i) => (
                  <TouchableOpacity key={i} onPress={() => Linking.openURL(s)}>
                    <Text style={[styles.sourceLink, { color: colors.accent }]} numberOfLines={1}>🔗 {s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ─── SETLIST TAB ─── */}
        {tab === 'setlist' && (
          <View style={styles.tabContent}>
            {setlist.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>🎵</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noSetlist')}</Text>
              </View>
            ) : (
              <>
                <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 4 }]}>
                  {setlist.some(s => s.prediction) ? t('setlistPrediction') : t('setlistActual')}
                </Text>
                {setlist.some(s => s.prediction) && (
                  <Text style={[styles.setlistDisclaimer, { color: colors.textSubtle }]}>{t('setlistDisclaimer')}</Text>
                )}
                {setlist.map((s, i) => (
                  <View key={i} style={[styles.setlistRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                    <Text style={[styles.setlistNum, { color: colors.textSubtle }]}>{i + 1}</Text>
                    <Text style={[styles.setlistSong, { color: colors.text }]} numberOfLines={1}>{s.song}</Text>
                    {s.prediction && (
                      <View style={[styles.predBadge, { backgroundColor: colors.rumor + '22' }]}>
                        <Text style={[styles.predText, { color: colors.rumor }]}>Prediksi</Text>
                      </View>
                    )}
                  </View>
                ))}
              </>
            )}
          </View>
        )}

        {/* ─── DISKUSI TAB ─── */}
        {tab === 'diskusi' && (
          <View style={styles.tabContent}>
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>💬 {t('discussion')}</Text>

              {past ? (
                <View style={[styles.disabledBox, { backgroundColor: colors.pastBg }]}>
                  <Text style={[styles.disabledText, { color: colors.past }]}>{t('diskusiDisabled')}</Text>
                </View>
              ) : (
                <>
                  {replyTo && (
                    <View style={[styles.replyPreview, { backgroundColor: colors.inputBg, borderLeftColor: colors.accent }]}>
                      <Text style={[styles.replyPreviewText, { color: colors.textMuted }]} numberOfLines={1}>↩ {replyTo.author}: {replyTo.text}</Text>
                      <TouchableOpacity onPress={() => setReplyTo(null)}>
                        <Ionicons name="close" size={14} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  )}
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder={t('name')}
                    placeholderTextColor={colors.textSubtle}
                    value={commentAuthor}
                    onChangeText={setCommentAuthor}
                  />
                  <TextInput
                    style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder={t('writeComment')}
                    placeholderTextColor={colors.textSubtle}
                    value={commentText}
                    onChangeText={setCommentText}
                    multiline
                  />
                  <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.accent }]} onPress={handleSendComment}>
                    <Text style={styles.sendBtnText}>{t('send')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>💬</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noComments')}</Text>
              </View>
            ) : (
              comments.map((c, i) => (
                <View key={c.uid} style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  {c.replyTo && (
                    <View style={[styles.replyPreview, { backgroundColor: colors.surfaceElevated, borderLeftColor: colors.textSubtle }]}>
                      <Text style={[styles.replyPreviewText, { color: colors.textSubtle }]} numberOfLines={1}>↩ {c.replyTo.author}: {c.replyTo.text}</Text>
                    </View>
                  )}
                  <View style={styles.commentHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.accent + '33' }]}>
                      <Text style={[styles.avatarText, { color: colors.accent }]}>{c.author[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>{c.author}</Text>
                      <Text style={[styles.commentDate, { color: colors.textSubtle }]}>{timeAgo(c.date)}</Text>
                    </View>
                    <TouchableOpacity style={styles.likeBtn} onPress={() => likeComment(i)}>
                      <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.likeCount, { color: colors.textMuted }]}>{c.likes}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.commentText, { color: colors.textMuted }]}>{c.text}</Text>
                  {!past && (
                    <TouchableOpacity onPress={() => setReplyTo({ author: c.author, text: c.text })}>
                      <Text style={[styles.replyBtn, { color: colors.accent }]}>↩ {t('reply')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ─── REVIEW TAB ─── */}
        {tab === 'review' && (
          <View style={styles.tabContent}>
            {reviews.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, alignItems: 'center' }]}>
                <Text style={[styles.avgRatingNum, { color: colors.accent }]}>{avgRating}</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Ionicons key={s} name={s <= Math.round(avgRating) ? 'star' : 'star-outline'} size={20} color={colors.rumor} />
                  ))}
                </View>
                <Text style={[styles.reviewCount, { color: colors.textMuted }]}>{reviews.length} review</Text>
              </View>
            )}

            {past ? (
              !hasReviewed ? (
                <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>⭐ {t('writeReview')}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <TouchableOpacity key={s} onPress={() => setReviewRating(s)}>
                        <Ionicons name={s <= reviewRating ? 'star' : 'star-outline'} size={28} color={colors.rumor} />
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder={t('name')}
                    placeholderTextColor={colors.textSubtle}
                    value={reviewAuthor}
                    onChangeText={setReviewAuthor}
                  />
                  <TextInput
                    style={[styles.input, styles.textarea, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder={t('yourReview')}
                    placeholderTextColor={colors.textSubtle}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                  />
                  <TouchableOpacity style={[styles.sendBtn, { backgroundColor: colors.accent }]} onPress={handleSendReview}>
                    <Text style={styles.sendBtnText}>{t('submitReview')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[styles.card, { backgroundColor: colors.confirmedBg }]}>
                  <Text style={[{ color: colors.confirmed, textAlign: 'center', fontWeight: '600' }]}>✅ Kamu sudah memberikan review!</Text>
                </View>
              )
            ) : (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: 'center' }]}>{t('reviewOnlyPast')}</Text>
              </View>
            )}

            {/* ─── FOTO DARI FANS ─── */}
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.cardHeaderRow}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>📸 {t('fotoDariFans')}</Text>
                {fotoEnabled && (
                  <TouchableOpacity onPress={() => setShowFotoForm(v => !v)}>
                    <Ionicons name={showFotoForm ? 'close-circle-outline' : 'add-circle-outline'} size={22} color={colors.accent} />
                  </TouchableOpacity>
                )}
              </View>

              {!fotoEnabled ? (
                <Text style={[styles.disabledText, { color: colors.textSubtle }]}>
                  {isRumor
                    ? 'Foto fans hanya tersedia setelah konser berlangsung (status: Rumor).'
                    : 'Foto fans hanya tersedia setelah konser berlangsung.'}
                </Text>
              ) : showFotoForm ? (
                <View style={{ gap: 8 }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="Nama kamu (opsional)"
                    placeholderTextColor={colors.textSubtle}
                    value={fotoAuthor}
                    onChangeText={setFotoAuthor}
                  />
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder, color: colors.text }]}
                    placeholder="Caption foto (opsional)"
                    placeholderTextColor={colors.textSubtle}
                    value={fotoCaption}
                    onChangeText={setFotoCaption}
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: fotoLoading ? colors.textSubtle : colors.accent }]}
                    onPress={handlePickPhoto}
                    disabled={fotoLoading}
                  >
                    <Ionicons name="image-outline" size={18} color="#fff" />
                    <Text style={styles.sendBtnText}>{fotoLoading ? 'Memproses...' : t('uploadFoto')}</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {photos.length === 0 ? (
                <Text style={[styles.emptyInline, { color: colors.textSubtle }]}>{t('belumAdaFoto')}</Text>
              ) : (
                <View style={styles.photoGrid}>
                  {photos.map(p => (
                    <View key={p.uid} style={styles.photoItem}>
                      <Image source={{ uri: p.uri }} style={styles.photoThumb} resizeMode="cover" />
                      <Text style={[styles.photoAuthor, { color: colors.textSubtle }]}>{p.author}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {reviews.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyEmoji}>⭐</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('noReviews')}</Text>
              </View>
            ) : (
              reviews.map((r, i) => (
                <View key={r.uid} style={[styles.commentCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
                  <View style={styles.commentHeader}>
                    <View style={[styles.avatar, { backgroundColor: colors.rumor + '33' }]}>
                      <Text style={[styles.avatarText, { color: colors.rumor }]}>{r.author[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.commentAuthor, { color: colors.text }]}>{r.author}</Text>
                      <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Ionicons key={s} name={s <= r.rating ? 'star' : 'star-outline'} size={12} color={colors.rumor} />
                        ))}
                      </View>
                    </View>
                    <TouchableOpacity style={styles.likeBtn} onPress={() => likeReview(i)}>
                      <Ionicons name="heart-outline" size={14} color={colors.textMuted} />
                      <Text style={[styles.likeCount, { color: colors.textMuted }]}>{r.likes}</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.commentText, { color: colors.textMuted }]}>{r.comment}</Text>
                  <Text style={[styles.commentDate, { color: colors.textSubtle }]}>{timeAgo(r.date)}</Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      <ShareSheet visible={showShare} concert={concert} onClose={() => setShowShare(false)} onCopied={() => showToast(t('linkCopied'))} />
      <Toast message={toast.message} visible={toast.visible} type={toast.type} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { position: 'relative', height: 280 },
  heroImage: { width: '100%', height: '100%', backgroundColor: '#1a1025' },
  heroOverlay: { ...StyleSheet.absoluteFillObject },
  backBtn: { position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  heroActions: { position: 'absolute', top: 16, right: 16, flexDirection: 'row', gap: 8 },
  heroActionBtn: { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: 8 },
  heroBadge: { position: 'absolute', bottom: 16, left: 16, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  heroBadgeText: { fontSize: 12, fontWeight: '700' },
  titleBlock: { padding: 20, alignItems: 'flex-start' },
  emoji: { fontSize: 32, marginBottom: 6 },
  artistName: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  tourName: { fontSize: 14, marginBottom: 10 },
  hotBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  hotText: { fontSize: 12, fontWeight: '700' },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },
  tabContent: { padding: 16, gap: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  infoLabel: { fontSize: 11, marginBottom: 3 },
  infoValue: { fontSize: 14, fontWeight: '500' },
  card: { borderRadius: 14, padding: 16, gap: 10 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: -4 },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  catName: { fontSize: 14 },
  catPrice: { fontSize: 14, fontWeight: '600' },
  bigBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineBtnText: { fontSize: 14, fontWeight: '600' },
  spotifyBtn: { borderRadius: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  spotifyBtnText: { fontSize: 14, fontWeight: '700' },
  voteRow: { flexDirection: 'row', gap: 12 },
  voteBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 12, borderWidth: 1, paddingVertical: 12 },
  voteBtnText: { fontSize: 14, fontWeight: '600' },
  desc: { fontSize: 14, lineHeight: 22 },
  lineupWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  lineupChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5 },
  lineupText: { fontSize: 12, fontWeight: '600' },
  socialRow: { flexDirection: 'row', gap: 12 },
  socialBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 12 },
  socialText: { fontSize: 13, fontWeight: '600' },
  sourceLink: { fontSize: 13, paddingVertical: 4 },
  rumorWarn: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  rumorText: { fontSize: 13, fontWeight: '600' },
  rumorDetail: { fontSize: 12, lineHeight: 18 },
  setlistDisclaimer: { fontSize: 11, marginBottom: 8 },
  setlistRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 10, borderWidth: 1, padding: 12, marginBottom: 6 },
  setlistNum: { fontSize: 12, width: 20, textAlign: 'center' },
  setlistSong: { flex: 1, fontSize: 14 },
  predBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  predText: { fontSize: 10, fontWeight: '600' },
  commentCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 8 },
  commentHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 14, fontWeight: '700' },
  commentAuthor: { fontSize: 13, fontWeight: '600' },
  commentDate: { fontSize: 11, marginTop: 2 },
  commentText: { fontSize: 13, lineHeight: 20 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 12 },
  replyBtn: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  replyPreview: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 6, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyPreviewText: { fontSize: 12, flex: 1 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 11, fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  sendBtn: { borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  avgRatingNum: { fontSize: 40, fontWeight: '800' },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  reviewCount: { fontSize: 12, marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 32, gap: 8 },
  emptyEmoji: { fontSize: 36 },
  emptyText: { fontSize: 14 },
  emptyInline: { fontSize: 13, textAlign: 'center', paddingVertical: 8 },
  disabledBox: { borderRadius: 10, padding: 12 },
  disabledText: { fontSize: 13, fontStyle: 'italic' },
  // Ticket Market
  tmTypeRow: { flexDirection: 'row', gap: 10 },
  tmTypeBtn: { flex: 1, borderRadius: 10, borderWidth: 1.5, paddingVertical: 10, alignItems: 'center' },
  tmTypeBtnText: { fontSize: 13, fontWeight: '600' },
  tmBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tmBadgeText: { fontSize: 11, fontWeight: '700' },
  listingCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 6, marginTop: 8 },
  listingHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  listingName: { flex: 1, fontSize: 13, fontWeight: '600' },
  listingTime: { fontSize: 11 },
  listingDetail: { fontSize: 13 },
  listingContact: { fontSize: 13, fontWeight: '600' },
  listingNote: { fontSize: 12 },
  // Fan Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoItem: { width: (width - 80) / 3, gap: 4 },
  photoThumb: { width: '100%', height: (width - 80) / 3, borderRadius: 8, backgroundColor: '#333' },
  photoAuthor: { fontSize: 10, textAlign: 'center' },
});
