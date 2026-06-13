import React, { useState } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, Linking, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useWishlist } from '../hooks/useWishlist';
import { useSocialFeatures } from '../hooks/useSocialFeatures';
import { useDiscussion } from '../hooks/useDiscussion';
import { useReviews } from '../hooks/useReviews';
import { useBeenThere } from '../hooks/useBeenThere';
import { ShareSheet } from '../components/ShareSheet';
import { Toast } from '../components/Toast';
import { CONCERTS, SETLISTS, ARTIST_SOCIALS } from '../data/concerts';
import { getGoogleCalendarUrl, isPast, timeAgo } from '../utils/helpers';

const { width } = Dimensions.get('window');
type Tab = 'info' | 'setlist' | 'diskusi' | 'review';

export function DetailScreen({ route, navigation }: any) {
  const { concertId } = route.params;
  const concert = CONCERTS.find(c => c.id === concertId);
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { toggle: toggleWishlist, isWishlisted } = useWishlist();
  const { going, interested, myVote, vote } = useSocialFeatures(concertId);
  const { comments, addComment, likeComment } = useDiscussion(concertId);
  const { reviews, hasReviewed, avgRating, addReview, likeReview } = useReviews(concertId);
  const { toggle: toggleBeenThere, hasAttended } = useBeenThere();

  const [tab, setTab] = useState<Tab>('info');
  const [showShare, setShowShare] = useState(false);
  const [toast, setToast] = useState({ message: '', visible: false, type: 'success' as 'success' | 'error' | 'info' });

  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [replyTo, setReplyTo] = useState<{ author: string; text: string } | null>(null);

  const [reviewAuthor, setReviewAuthor] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  if (!concert) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: colors.text }}>Konser tidak ditemukan</Text>
      </View>
    );
  }

  const past = isPast(concert);
  const setlist = SETLISTS[concertId] || [];
  const socials = ARTIST_SOCIALS[concertId] || {};
  const calUrl = getGoogleCalendarUrl(concert);
  const wishlisted = isWishlisted(concertId);
  const attended = hasAttended(concertId);

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
          {/* Back */}
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          {/* Share + Wishlist */}
          <View style={styles.heroActions}>
            <TouchableOpacity style={styles.heroActionBtn} onPress={() => setShowShare(true)}>
              <Ionicons name="share-outline" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.heroActionBtn} onPress={handleWishlist}>
              <Ionicons name={wishlisted ? 'heart' : 'heart-outline'} size={20} color={wishlisted ? colors.wishlistActive : '#fff'} />
            </TouchableOpacity>
          </View>
          {/* Status */}
          <View style={[styles.heroBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.heroBadgeText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Title block */}
        <View style={[styles.titleBlock, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emoji]}>{concert.emoji}</Text>
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
            <TouchableOpacity key={tb.key} style={[styles.tab, tab === tb.key && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]} onPress={() => setTab(tb.key)}>
              <Text style={[styles.tabText, { color: tab === tb.key ? colors.accent : colors.textMuted }]}>{tb.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* INFO TAB */}
        {tab === 'info' && (
          <View style={styles.tabContent}>
            {concert.confirmStatus === 'rumor' && (
              <View style={[styles.rumorWarn, { backgroundColor: colors.rumorBg, borderColor: colors.rumor + '44' }]}>
                <Text style={[styles.rumorText, { color: colors.rumor }]}>{t('rumorWarning')}</Text>
                {concert.rumorDetail && <Text style={[styles.rumorDetail, { color: colors.textMuted }]}>{concert.rumorDetail}</Text>}
              </View>
            )}

            {/* Date/Venue info */}
            {[
              { icon: 'calendar-outline', label: t('dateLabel'), value: concert.dates.join(' & ') },
              { icon: 'time-outline', label: t('timeLabel'), value: concert.time },
              { icon: 'location-outline', label: t('venueLabel'), value: `${concert.venue}, ${concert.city}` },
              { icon: 'business-outline', label: t('promotorLabel'), value: concert.promotor },
            ].map(row => (
              <View key={row.label} style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Ionicons name={row.icon as any} size={18} color={colors.accent} style={{ width: 26 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoLabel, { color: colors.textSubtle }]}>{row.label}</Text>
                  <Text style={[styles.infoValue, { color: colors.text }]}>{row.value}</Text>
                </View>
              </View>
            ))}

            {/* Ticket categories */}
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

            {/* Buy Ticket */}
            {!past && concert.confirmStatus === 'confirmed' && concert.ticketUrl ? (
              <TouchableOpacity style={[styles.bigBtn, { backgroundColor: colors.accent }]} onPress={() => Linking.openURL(concert.ticketUrl)}>
                <Ionicons name="ticket-outline" size={18} color="#fff" />
                <Text style={styles.bigBtnText}>{t('buyTicketNow')} – {concert.ticketPlatform}</Text>
              </TouchableOpacity>
            ) : null}

            {/* Google Calendar — hanya untuk konser mendatang */}
            {calUrl && !past && (
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: colors.accent }]} onPress={() => Linking.openURL(calUrl)}>
                <Ionicons name="calendar-outline" size={16} color={colors.accent} />
                <Text style={[styles.outlineBtnText, { color: colors.accent }]}>{t('addToCalendar')}</Text>
              </TouchableOpacity>
            )}

            {/* Been There (past only) */}
            {past && (
              <TouchableOpacity
                style={[styles.outlineBtn, { borderColor: attended ? colors.confirmed : colors.border }]}
                onPress={handleBeenThere}
              >
                <Ionicons name={attended ? 'checkmark-circle' : 'checkmark-circle-outline'} size={16} color={attended ? colors.confirmed : colors.textMuted} />
                <Text style={[styles.outlineBtnText, { color: attended ? colors.confirmed : colors.textMuted }]}>
                  {attended ? `✅ ${t('beenThere')}` : t('markBeenThere')}
                </Text>
              </TouchableOpacity>
            )}

            {/* Going / Interested — hanya upcoming & confirmed */}
            {!past && concert.confirmStatus === 'confirmed' && (
              <View style={styles.voteRow}>
                <TouchableOpacity
                  style={[styles.voteBtn, { backgroundColor: myVote === 'going' ? colors.accent : colors.surfaceElevated, borderColor: colors.accent }]}
                  onPress={() => handleVote('going')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={myVote === 'going' ? '#fff' : colors.accent} />
                  <Text style={[styles.voteBtnText, { color: myVote === 'going' ? '#fff' : colors.accent }]}>{t('going')} {going}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voteBtn, { backgroundColor: myVote === 'interested' ? colors.accentLight : colors.surfaceElevated, borderColor: colors.accentLight }]}
                  onPress={() => handleVote('interested')}
                >
                  <Ionicons name="star-outline" size={16} color={myVote === 'interested' ? '#fff' : colors.accentLight} />
                  <Text style={[styles.voteBtnText, { color: myVote === 'interested' ? '#fff' : colors.accentLight }]}>{t('interested')} {interested}</Text>
                </TouchableOpacity>
              </View>
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

            {/* Social links */}
            {(socials.instagram || socials.twitter) && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>{t('socialMedia')}</Text>
                <View style={styles.socialRow}>
                  {socials.instagram && (
                    <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#E1306C22' }]} onPress={() => Linking.openURL(socials.instagram!)}>
                      <Ionicons name="logo-instagram" size={20} color="#E1306C" />
                      <Text style={[styles.socialText, { color: '#E1306C' }]}>Instagram</Text>
                    </TouchableOpacity>
                  )}
                  {socials.twitter && (
                    <TouchableOpacity style={[styles.socialBtn, { backgroundColor: '#1DA1F222' }]} onPress={() => Linking.openURL(socials.twitter!)}>
                      <Ionicons name="logo-twitter" size={20} color="#1DA1F2" />
                      <Text style={[styles.socialText, { color: '#1DA1F2' }]}>Twitter/X</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

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

        {/* SETLIST TAB */}
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
                    <Text style={[styles.setlistNum, { color: colors.textSubtle }]}>{i+1}</Text>
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

        {/* DISKUSI TAB */}
        {tab === 'diskusi' && (
          <View style={styles.tabContent}>
            {/* Add comment */}
            <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>💬 {t('discussion')}</Text>
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
                  <TouchableOpacity onPress={() => setReplyTo({ author: c.author, text: c.text })}>
                    <Text style={[styles.replyBtn, { color: colors.accent }]}>↩ {t('reply')}</Text>
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}

        {/* REVIEW TAB */}
        {tab === 'review' && (
          <View style={styles.tabContent}>
            {/* Avg rating */}
            {reviews.length > 0 && (
              <View style={[styles.card, { backgroundColor: colors.surfaceElevated, alignItems: 'center' }]}>
                <Text style={[styles.avgRatingNum, { color: colors.accent }]}>{avgRating}</Text>
                <View style={styles.starsRow}>
                  {[1,2,3,4,5].map(s => (
                    <Ionicons key={s} name={s <= Math.round(avgRating) ? 'star' : 'star-outline'} size={20} color={colors.rumor} />
                  ))}
                </View>
                <Text style={[styles.reviewCount, { color: colors.textMuted }]}>{reviews.length} review</Text>
              </View>
            )}

            {/* Write review */}
            {past ? (
              !hasReviewed ? (
                <View style={[styles.card, { backgroundColor: colors.surfaceElevated }]}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>⭐ {t('writeReview')}</Text>
                  <View style={styles.starsRow}>
                    {[1,2,3,4,5].map(s => (
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

            {/* Reviews list */}
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
                        {[1,2,3,4,5].map(s => (
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
  catRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1 },
  catName: { fontSize: 14 },
  catPrice: { fontSize: 14, fontWeight: '600' },
  bigBtn: { borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  bigBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  outlineBtn: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  outlineBtnText: { fontSize: 14, fontWeight: '600' },
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
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontWeight: '700' },
  commentAuthor: { fontSize: 14, fontWeight: '600' },
  commentDate: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  likeCount: { fontSize: 12 },
  replyBtn: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  replyPreview: { borderLeftWidth: 3, paddingLeft: 10, paddingVertical: 4, borderRadius: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  replyPreviewText: { fontSize: 12, flex: 1 },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 4, marginBottom: 4 },
  avgRatingNum: { fontSize: 40, fontWeight: '800' },
  reviewCount: { fontSize: 12 },
  input: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  textarea: { minHeight: 80, textAlignVertical: 'top' },
  sendBtn: { borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  sendBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
