import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import dayjs from 'dayjs';
import { useTheme } from '@/store/ThemeContext';
import {
  BsDate,
  NEPALI_MONTHS,
  NEPALI_WEEKDAYS,
  addBsMonths,
  bsToAdIsoString,
  buildBsMonthGrid,
  toDevanagariDigits,
} from '@/utils/nepaliCalendar';

const EN_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOLIDAY_RED = '#DC2626';
const SATURDAY = 6;
const CELL_WIDTH = `${100 / 7}%` as const;

interface PanchangCalendarProps {
  today: BsDate;
  selected: BsDate;
  onSelect: (bs: BsDate) => void;
}

const sameDay = (a: BsDate, b: BsDate) => a.year === b.year && a.month === b.month && a.date === b.date;

export const PanchangCalendar = ({ today, selected, onSelect }: PanchangCalendarProps) => {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const [view, setView] = useState({ year: selected.year, month: selected.month });

  // Jump the view along when the picked day is in another month (greyed-out day or "Today").
  const select = (bs: BsDate) => {
    if (bs.year !== view.year || bs.month !== view.month) setView({ year: bs.year, month: bs.month });
    onSelect(bs);
  };

  const grid = useMemo(() => buildBsMonthGrid(view.year, view.month), [view]);

  const adRangeLabel = useMemo(() => {
    const start = dayjs(bsToAdIsoString({ year: view.year, month: view.month, date: 1 }));
    const lastCell = [...grid].reverse().find((c) => c.inCurrentMonth)!;
    const end = dayjs(bsToAdIsoString(lastCell.bs));
    return start.year() === end.year()
      ? `${start.format('MMM')} – ${end.format('MMM YYYY')}`
      : `${start.format('MMM YYYY')} – ${end.format('MMM YYYY')}`;
  }, [grid, view]);

  const goToMonth = (delta: number) => setView((v) => addBsMonths(v.year, v.month, delta));

  const swipe = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderRelease: (_, g) => {
          if (g.dx < -50) setView((v) => addBsMonths(v.year, v.month, 1));
          else if (g.dx > 50) setView((v) => addBsMonths(v.year, v.month, -1));
        },
      }),
    []
  );

  const viewingCurrentMonth = view.year === today.year && view.month === today.month;
  const gridLine = isDark ? '#2A2F3A' : '#EEE7DF';
  const headerBg = isDark ? '#1B1F27' : '#FFF7ED';

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: gridLine }]}>
      {/* Month header */}
      <View style={[styles.header, { backgroundColor: headerBg }]}>
        <TouchableOpacity
          onPress={() => goToMonth(-1)}
          style={[styles.navBtn, { backgroundColor: colors.card, borderColor: gridLine }]}
          accessibilityLabel="Previous month"
        >
          <Ionicons name="chevron-back" size={18} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {NEPALI_MONTHS[view.month]} {toDevanagariDigits(view.year)}
          </Text>
          <Text style={[styles.monthSubtitle, { color: colors.text + '70' }]}>{adRangeLabel}</Text>
        </View>

        <TouchableOpacity
          onPress={() => goToMonth(1)}
          style={[styles.navBtn, { backgroundColor: colors.card, borderColor: gridLine }]}
          accessibilityLabel="Next month"
        >
          <Ionicons name="chevron-forward" size={18} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Weekday header */}
      <View style={[styles.weekRow, { borderBottomColor: gridLine }]}>
        {NEPALI_WEEKDAYS.map((w, i) => {
          const color = i === SATURDAY ? HOLIDAY_RED : colors.text;
          return (
            <View key={w} style={styles.weekCell}>
              <Text style={[styles.weekNp, { color }]}>{w}</Text>
              <Text style={[styles.weekEn, { color: i === SATURDAY ? HOLIDAY_RED + 'AA' : colors.text + '60' }]}>
                {EN_WEEKDAYS[i]}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Day grid */}
      <View style={styles.grid} {...swipe.panHandlers}>
        {grid.map((cell, index) => {
          const col = index % 7;
          const isSelected = sameDay(cell.bs, selected);
          const isSaturday = col === SATURDAY;
          const isLastRow = index >= grid.length - 7;

          let dateColor = isSaturday ? HOLIDAY_RED : colors.text;
          if (!cell.inCurrentMonth) dateColor = dateColor + '35';
          if (cell.isToday && !isSelected) dateColor = colors.primary;
          if (isSelected) dateColor = '#FFF';

          return (
            <Pressable
              key={`${cell.bs.year}-${cell.bs.month}-${cell.bs.date}`}
              onPress={() => select(cell.bs)}
              style={[
                styles.cell,
                {
                  borderColor: gridLine,
                  borderRightWidth: col === 6 ? 0 : StyleSheet.hairlineWidth,
                  borderBottomWidth: isLastRow ? 0 : StyleSheet.hairlineWidth,
                },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={dayjs(bsToAdIsoString(cell.bs)).format('dddd, MMMM D, YYYY')}
            >
              <View
                style={[
                  styles.cellInner,
                  cell.isToday && !isSelected && { backgroundColor: colors.primary + '18' },
                  isSelected && { backgroundColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.adDate,
                    { color: isSelected ? '#FFFFFFB0' : cell.inCurrentMonth ? colors.text + '55' : colors.text + '25' },
                  ]}
                >
                  {cell.adDay}
                </Text>
                <Text style={[styles.bsDate, { color: dateColor }]}>{toDevanagariDigits(cell.bs.date)}</Text>
                {cell.isToday && (
                  <View style={[styles.todayDot, { backgroundColor: isSelected ? '#FFF' : colors.primary }]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Footer: legend + today */}
      <View style={[styles.footer, { borderTopColor: gridLine }]}>
        <View style={styles.legend}>
          <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.legendText, { color: colors.text + '80' }]}>Today</Text>
          <View style={[styles.legendDot, { backgroundColor: HOLIDAY_RED, marginLeft: 12 }]} />
          <Text style={[styles.legendText, { color: colors.text + '80' }]}>Holiday</Text>
        </View>

        {(!viewingCurrentMonth || !sameDay(selected, today)) && (
          <TouchableOpacity
            onPress={() => select(today)}
            style={[styles.todayBtn, { borderColor: colors.primary }]}
          >
            <Ionicons name="today-outline" size={13} color={colors.primary} />
            <Text style={[styles.todayBtnText, { color: colors.primary }]}>Today</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleWrap: { alignItems: 'center', flex: 1 },
  monthTitle: { fontSize: 20, fontWeight: '800' },
  monthSubtitle: { fontSize: 12, fontWeight: '600', marginTop: 2 },

  weekRow: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingVertical: 8 },
  weekCell: { width: CELL_WIDTH, alignItems: 'center' },
  weekNp: { fontSize: 12, fontWeight: '700' },
  weekEn: { fontSize: 9, fontWeight: '600', marginTop: 1, textTransform: 'uppercase', letterSpacing: 0.5 },

  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL_WIDTH, aspectRatio: 1, padding: 3 },
  cellInner: {
    flex: 1,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adDate: { position: 'absolute', top: 3, right: 5, fontSize: 9, fontWeight: '600' },
  bsDate: { fontSize: 18, fontWeight: '700' },
  todayDot: { position: 'absolute', bottom: 5, width: 4, height: 4, borderRadius: 2 },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 48,
  },
  legend: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  legendText: { fontSize: 11, fontWeight: '600' },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  todayBtnText: { fontSize: 12, fontWeight: '700' },
});
