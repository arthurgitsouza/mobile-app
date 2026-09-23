import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from 'react-native';
import { colors, radius } from '../../theme';
import { formatDate, hojeObra, nomeDiaSemana, ymOf } from '../../utils/date';
import { normalizar, toNumber } from '../../utils/format';
import { BottomSheet, Chip, Icon, Txt } from '../ui';
import CalendarMonth from '../ui/CalendarMonth';
import Field from './Field';
import { inputStyles } from './inputs';

const normalizeOptions = (options = []) => options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));

// ---------------- Data ----------------
export function DateField({ label, required, help, error, value, onChange, min, max, placeholder = 'Selecionar data', disabled, marks, style }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(ymOf(value || hojeObra()));
  return (
    <Field label={label} required={required} help={help} error={error} style={style}>
      <Pressable
        onPress={() => {
          setMonth(ymOf(value || hojeObra()));
          setOpen(true);
        }}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label || 'Data'}: ${value ? `${formatDate(value)}, ${nomeDiaSemana(value)}` : 'não selecionada'}`}
        style={[inputStyles.wrap, !!error && inputStyles.error, disabled && inputStyles.readonly]}
      >
        <Icon name="calendar-month-outline" size={20} color={colors.textMuted} />
        <Txt v="body" color={value ? colors.text : colors.textSubtle} style={{ flex: 1 }}>
          {value ? `${formatDate(value)} · ${nomeDiaSemana(value)}` : placeholder}
        </Txt>
        <Icon name="chevron-down" size={20} color={colors.textMuted} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => setOpen(false)} title={label || 'Selecionar data'}>
        <CalendarMonth
          month={month}
          onMonthChange={setMonth}
          selected={value}
          min={min}
          max={max}
          marks={marks}
          onSelect={(d) => {
            onChange?.(d);
            setOpen(false);
          }}
        />
      </BottomSheet>
    </Field>
  );
}

// ---------------- Seleção em lista ----------------
export function SelectField({ label, required, help, error, value, onChange, options, placeholder = 'Selecione', searchable, allowCustom, disabled, title, style }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const opts = useMemo(() => normalizeOptions(options), [options]);
  const current = opts.find((o) => o.value === value);
  const shown = current?.label || value || '';
  const mostrarBusca = searchable ?? (opts.length > 8 || allowCustom);
  const filtrados = q ? opts.filter((o) => normalizar(o.label).includes(normalizar(q))) : opts;
  const existe = opts.some((o) => normalizar(o.label) === normalizar(q));

  const escolher = (v) => {
    onChange?.(v);
    setOpen(false);
    setQ('');
  };

  return (
    <Field label={label} required={required} help={help} error={error} style={style}>
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={`${label || 'Seleção'}${required ? ', obrigatório' : ''}: ${shown || 'não selecionado'}`}
        style={[inputStyles.wrap, !!error && inputStyles.error, disabled && inputStyles.readonly]}
      >
        {current?.icone ? <Icon name={current.icone} size={20} color={colors.navy600} /> : null}
        <Txt v="body" color={shown ? colors.text : colors.textSubtle} style={{ flex: 1 }} numberOfLines={1}>
          {shown || placeholder}
        </Txt>
        <Icon name="chevron-down" size={20} color={colors.textMuted} />
      </Pressable>
      <BottomSheet visible={open} onClose={() => { setOpen(false); setQ(''); }} title={title || label || 'Selecione'}>
        {mostrarBusca ? (
          <View style={[inputStyles.wrap, { minHeight: 46 }]}>
            <Icon name="magnify" size={20} color={colors.textMuted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder={allowCustom ? 'Buscar ou digitar novo' : 'Buscar'}
              placeholderTextColor={colors.textSubtle}
              autoCapitalize="sentences"
              style={[inputStyles.input, { paddingVertical: 8 }]}
              accessibilityLabel="Buscar opção"
            />
          </View>
        ) : null}
        {allowCustom && q.trim() && !existe ? (
          <Pressable onPress={() => escolher(q.trim())} accessibilityRole="button" accessibilityLabel={`Usar ${q.trim()}`} style={[styles.option, { backgroundColor: colors.blue50 }]}>
            <Icon name="plus-circle-outline" size={22} color={colors.navy600} />
            <Txt v="bodyStrong" color={colors.navy600} style={{ flex: 1 }}>
              Usar “{q.trim()}”
            </Txt>
          </Pressable>
        ) : null}
        {filtrados.map((o) => {
          const ativo = o.value === value;
          return (
            <Pressable
              key={String(o.value)}
              disabled={o.disabled}
              onPress={() => escolher(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: ativo, disabled: !!o.disabled }}
              accessibilityLabel={o.label}
              style={[styles.option, ativo && { backgroundColor: colors.blue50 }, o.disabled && { opacity: 0.45 }]}
            >
              {o.icone ? <Icon name={o.icone} size={22} color={ativo ? colors.navy700 : colors.textMuted} /> : null}
              <View style={{ flex: 1 }}>
                <Txt v={ativo ? 'bodyStrong' : 'body'} color={ativo ? colors.navy700 : colors.text}>
                  {o.label}
                </Txt>
                {o.nota ? (
                  <Txt v="caption" muted>
                    {o.nota}
                  </Txt>
                ) : null}
              </View>
              <Icon name={ativo ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={ativo ? colors.navy700 : colors.borderStrong} />
            </Pressable>
          );
        })}
        {!filtrados.length && !(allowCustom && q.trim()) ? (
          <Txt v="small" muted style={{ textAlign: 'center', paddingVertical: 12 }}>
            Nenhuma opção encontrada.
          </Txt>
        ) : null}
      </BottomSheet>
    </Field>
  );
}

// ---------------- Chips (escolha curta) ----------------
export function ChipGroup({ label, required, help, error, options, value, onChange, multi, style, scroll }) {
  const opts = normalizeOptions(options);
  const isOn = (v) => (multi ? (value || []).includes(v) : value === v);
  const toggle = (v) => {
    if (multi) {
      const cur = value || [];
      onChange?.(cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]);
    } else onChange?.(v === value && !required ? '' : v);
  };
  const chips = opts.map((o) => (
    <Chip key={String(o.value)} label={o.nota ? `${o.label} (${o.nota})` : o.label} icon={o.icone} selected={isOn(o.value)} disabled={o.disabled} onPress={() => toggle(o.value)} />
  ));
  return (
    <Field label={label} required={required} help={help} error={error} style={style}>
      {scroll ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }} accessibilityRole="radiogroup" style={{ flexGrow: 0 }}>
          {chips}
        </ScrollView>
      ) : (
        <View style={styles.chips} accessibilityRole="radiogroup">
          {chips}
        </View>
      )}
    </Field>
  );
}

// ---------------- Liga/desliga ----------------
export function SwitchField({ label, description, value, onValueChange, disabled, style, tone }) {
  return (
    <Pressable
      onPress={() => !disabled && onValueChange?.(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityHint={description}
      accessibilityState={{ checked: !!value, disabled: !!disabled }}
      style={[styles.switchRow, tone === 'gold' && { backgroundColor: colors.gold50, borderColor: colors.gold200 }, disabled && { opacity: 0.5 }, style]}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Txt v="bodyStrong">{label}</Txt>
        {description ? (
          <Txt v="small" muted>
            {description}
          </Txt>
        ) : null}
      </View>
      <Switch
        value={!!value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.borderStrong, true: colors.navy600 }}
        thumbColor={colors.white}
        ios_backgroundColor={colors.borderStrong}
        accessible={false}
      />
    </Pressable>
  );
}

// ---------------- Quantidade (− n +) ----------------
export function StepperField({ label, required, help, error, value, onChange, min = 0, max = 999, step = 1, suffix, style }) {
  const n = Math.round(toNumber(value));
  const set = (v) => onChange?.(String(Math.max(min, Math.min(max, v))));
  return (
    <Field label={label} required={required} help={help} error={error} style={style}>
      <View style={styles.stepper}>
        <Pressable onPress={() => set(n - step)} disabled={n <= min} accessibilityRole="button" accessibilityLabel={`Diminuir ${label || ''}`} style={[styles.stepBtn, n <= min && { opacity: 0.4 }]}>
          <Icon name="minus" size={24} color={colors.navy700} />
        </Pressable>
        <View style={styles.stepValue}>
          <TextInput
            value={String(value ?? '')}
            onChangeText={(t) => onChange?.(t.replace(/\D/g, ''))}
            keyboardType="number-pad"
            accessibilityLabel={label || 'Quantidade'}
            style={styles.stepInput}
            selectTextOnFocus
          />
          {suffix ? (
            <Txt v="small" muted>
              {suffix}
            </Txt>
          ) : null}
        </View>
        <Pressable onPress={() => set(n + step)} disabled={n >= max} accessibilityRole="button" accessibilityLabel={`Aumentar ${label || ''}`} style={[styles.stepBtn, n >= max && { opacity: 0.4 }]}>
          <Icon name="plus" size={24} color={colors.navy700} />
        </Pressable>
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, paddingHorizontal: 12, borderRadius: radius.md },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12, minHeight: 56, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: {
    width: 52, height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blue50,
  },
  stepValue: {
    flex: 1, minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.white,
  },
  stepInput: { fontSize: 22, fontWeight: '800', color: colors.text, textAlign: 'center', minWidth: 48, paddingVertical: 6 },
});
