import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme';
import { addMonths, daysInMonth, diaDaSemana, formatMonthYear, hojeObra, nomesDiasCurtos, ymOf } from '../../utils/date';
import { capitalizar } from '../../utils/format';
import IconButton from './IconButton';
import Txt from './Txt';

const INICIAIS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

/**
 * Calendário mensal. marks: { 'YYYY-MM-DD': [cor, cor, ...] } (até 3 pontos por dia).
 * Datas fora de [min, max] ficam desabilitadas. `faltando`: datas destacadas como "sem RDO".
 */
export default function CalendarMonth({ month, onMonthChange, selected, onSelect, marks = {}, min, max, faltando = [], style }) {
  const hoje = hojeObra();
  const total = daysInMonth(month);
  const primeiro = diaDaSemana(`${month}-01`);
  const cells = [...Array(primeiro).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);
  const rows = Array.from({ length: cells.length / 7 }, (_, r) => cells.slice(r * 7, r * 7 + 7));
  const semRdo = new Set(faltando);

  return (
    <View style={style}>
      <View style={styles.head}>
        <IconButton icon="chevron-left" label="Mês anterior" onPress={() => onMonthChange(addMonths(month, -1))} />
        <Txt v="h3" accessibilityRole="header">
          {capitalizar(formatMonthYear(month))}
        </Txt>
        <IconButton icon="chevron-right" label="Próximo mês" onPress={() => onMonthChange(addMonths(month, 1))} />
      </View>
      <View style={styles.week}>
        {INICIAIS.map((l, i) => (
          <Text key={i} style={styles.weekText} accessibilityLabel={nomesDiasCurtos[i]}>
            {l}
          </Text>
        ))}
      </View>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((dia, ci) => {
            if (!dia) return <View key={ci} style={styles.cell} />;
            const ymd = `${month}-${String(dia).padStart(2, '0')}`;
            const bloqueado = (min && ymd < min) || (max && ymd > max);
            const sel = ymd === selected;
            const ehHoje = ymd === hoje;
            const pontos = marks[ymd] || [];
            return (
              <Pressable
                key={ci}
                disabled={bloqueado}
                onPress={() => onSelect?.(ymd)}
                accessibilityRole="button"
                accessibilityLabel={`${dia} de ${formatMonthYear(month)}${ehHoje ? ', hoje' : ''}${pontos.length ? `, ${pontos.length} RDO` : ''}${semRdo.has(ymd) ? ', sem RDO' : ''}`}
                accessibilityState={{ selected: sel, disabled: !!bloqueado }}
                style={styles.cell}
              >
                <View style={[styles.day, ehHoje && styles.today, semRdo.has(ymd) && !sel && styles.missing, sel && styles.selected]}>
                  <Text style={[styles.dayText, bloqueado && { color: colors.borderStrong }, ci === 0 && !bloqueado && { color: colors.textSubtle }, sel && { color: colors.white, fontWeight: '800' }]}>
                    {dia}
                  </Text>
                </View>
                <View style={styles.dots}>
                  {pontos.slice(0, 3).map((c, i) => (
                    <View key={i} style={[styles.dot, { backgroundColor: c }]} />
                  ))}
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export const mesDe = ymOf;

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  week: { flexDirection: 'row', marginBottom: 2 },
  weekText: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '800', color: colors.textMuted, paddingVertical: 6 },
  row: { flexDirection: 'row' },
  cell: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'flex-start', paddingTop: 2 },
  day: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  today: { borderWidth: 1.5, borderColor: colors.navy600 },
  missing: { backgroundColor: colors.warningBg },
  selected: { backgroundColor: colors.navy700, borderColor: colors.navy700 },
  dayText: { fontSize: 14.5, fontWeight: '600', color: colors.text },
  dots: { flexDirection: 'row', gap: 2, height: 6, marginTop: 1 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
});
