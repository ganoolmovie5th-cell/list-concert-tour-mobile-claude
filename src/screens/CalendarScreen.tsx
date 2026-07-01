import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { CONCERTS } from '../data/concerts';
import { genreColor } from '../utils/helpers';
import { Concert } from '../types';

const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
const MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS_ID = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
const DAYS_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export function CalendarScreen({ navigation }: any) {
  const { colors, lang, t } = useApp();
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const MONTHS = lang === 'id' ? MONTHS_ID : MONTHS_EN;
  const DAYS = lang === 'id' ? DAYS_ID : DAYS_EN;

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y-1); } else setMonth(m => m-1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y+1); } else setMonth(m => m+1); };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const concertsThisMonth = CONCERTS.filter(c => {
    const d = c.rawDate;
    return d.getFullYear() === year && d.getMonth() === month;
  });

  const concertsByDay: Record<number, Concert[]> = {};
  concertsThisMonth.forEach(c => {
    const day = c.rawDate.getDate();
    if (!concertsByDay[day]) concertsByDay[day] = [];
    concertsByDay[day].push(c);
  });

  const cells: (number | null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMonth}, (_,i) => i+1)];
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i+7));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>📅 {t('calendarTitle')}</Text>
        </View>

        {/* Month navigator */}
        <View style={[styles.monthNav, { backgroundColor: colors.surface }]}>
          <TouchableOpacity onPress={prev} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-back" size={22} color={colors.accent} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: colors.text }]}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={next} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="chevron-forward" size={22} color={colors.accent} />
          </TouchableOpacity>
        </View>

        {/* Day headers */}
        <View style={[styles.dayHeaders, { backgroundColor: colors.surface }]}>
          {DAYS.map(d => (
            <Text key={d} style={[styles.dayHeader, { color: colors.textMuted }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={[styles.grid, { backgroundColor: colors.surface }]}>
          {weeks.map((week, wi) => (
            <View key={wi} style={styles.week}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={styles.emptyCell} />;
                const concerts = concertsByDay[day] || [];
                const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
                return (
                  <TouchableOpacity
                    key={di}
                    style={[styles.cell, isToday && { backgroundColor: colors.accent + '22' }]}
                    onPress={() => concerts.length > 0 && navigation.navigate('Detail', { concertId: concerts[0].id })}
                    activeOpacity={concerts.length > 0 ? 0.7 : 1}
                  >
                    <Text style={[styles.dayNum, { color: isToday ? colors.accent : colors.text, fontWeight: isToday ? '800' : '400' }]}>{day}</Text>
                    <View style={styles.dots}>
                      {concerts.slice(0, 3).map((c, i) => (
                        <View key={i} style={[styles.dot, { backgroundColor: genreColor(c.genre, colors as unknown as Record<string,string>) }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Concert list */}
        {concertsThisMonth.length > 0 && (
          <View style={{ marginTop: 16, paddingHorizontal: 16 }}>
            <Text style={[styles.listTitle, { color: colors.text }]}>
              {concertsThisMonth.length} konser di {MONTHS[month]} {year}
            </Text>
            {concertsThisMonth.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.concertRow, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}
                onPress={() => navigation.navigate('Detail', { concertId: c.id })}
                activeOpacity={0.8}
              >
                <View style={[styles.concertDot, { backgroundColor: genreColor(c.genre, colors as unknown as Record<string,string>) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.concertArtist, { color: colors.text }]}>{c.emoji} {c.artist}</Text>
                  <Text style={[styles.concertDate, { color: colors.textMuted }]}>{c.dates[0]} · {c.venue}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={colors.textSubtle} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        {concertsThisMonth.length === 0 && (
          <View style={styles.noEvent}>
            <Text style={[styles.noEventText, { color: colors.textMuted }]}>Tidak ada konser bulan ini</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 20, fontWeight: '800' },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, marginTop: 12, marginHorizontal: 16, borderRadius: 14 },
  monthLabel: { fontSize: 17, fontWeight: '700' },
  dayHeaders: { flexDirection: 'row', marginHorizontal: 16, marginTop: 8, borderRadius: 10, paddingVertical: 8 },
  dayHeader: { flex: 1, textAlign: 'center', fontSize: 11, fontWeight: '600' },
  grid: { marginHorizontal: 16, marginTop: 4, borderRadius: 14, overflow: 'hidden', paddingBottom: 8 },
  week: { flexDirection: 'row' },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 8, margin: 1 },
  emptyCell: { flex: 1 },
  dayNum: { fontSize: 14 },
  dots: { flexDirection: 'row', gap: 2, marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  listTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  concertRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  concertDot: { width: 10, height: 10, borderRadius: 5 },
  concertArtist: { fontSize: 14, fontWeight: '600', marginBottom: 3 },
  concertDate: { fontSize: 12 },
  noEvent: { alignItems: 'center', paddingTop: 32 },
  noEventText: { fontSize: 14 },
});
