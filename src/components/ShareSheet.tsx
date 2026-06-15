import React from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable, Share, StyleSheet, Clipboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { Concert } from '../types';
import { getShareText } from '../utils/helpers';

interface ShareSheetProps {
  visible: boolean;
  onClose: () => void;
  concert: Concert;
  onCopied?: () => void;
}

export function ShareSheet({ visible, onClose, concert, onCopied }: ShareSheetProps) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const shareText = getShareText(concert);
  const shareUrl = `https://www.list-concert-tour.web.id`;

  const openWhatsApp = () => {
    Linking.openURL(`whatsapp://send?text=${encodeURIComponent(shareText)}`);
    onClose();
  };

  const openTelegram = () => {
    Linking.openURL(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`);
    onClose();
  };

  const nativeShare = async () => {
    await Share.share({ message: shareText, url: shareUrl });
    onClose();
  };

  const copyLink = () => {
    Clipboard.setString(shareUrl);
    onCopied?.();
    onClose();
  };

  const buttons = [
    { icon: 'logo-whatsapp' as const, label: t('openWhatsApp'), color: '#25D366', onPress: openWhatsApp },
    { icon: 'paper-plane-outline' as const, label: t('openTelegram'), color: '#0088cc', onPress: openTelegram },
    { icon: 'share-outline' as const, label: t('nativeShare'), color: colors.accent, onPress: nativeShare },
    { icon: 'copy-outline' as const, label: t('copyLink'), color: colors.textMuted, onPress: copyLink },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.overlay }]} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: colors.surface }]} onPress={e => e.stopPropagation()}>
          <Text style={[styles.title, { color: colors.text }]}>{t('shareVia')}</Text>
          <Text style={[styles.artist, { color: colors.textMuted }]}>{concert.artist}</Text>
          <View style={styles.buttons}>
            {buttons.map(b => (
              <TouchableOpacity key={b.label} style={styles.btn} onPress={b.onPress}>
                <View style={[styles.iconWrap, { backgroundColor: b.color + '22' }]}>
                  <Ionicons name={b.icon} size={26} color={b.color} />
                </View>
                <Text style={[styles.btnLabel, { color: colors.textMuted }]}>{b.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TouchableOpacity style={[styles.cancel, { backgroundColor: colors.surfaceElevated }]} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  artist: { fontSize: 13, marginBottom: 20 },
  buttons: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  btn: { alignItems: 'center', gap: 8 },
  iconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  btnLabel: { fontSize: 11, textAlign: 'center', maxWidth: 64 },
  cancel: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelText: { fontSize: 15, fontWeight: '600' },
});
