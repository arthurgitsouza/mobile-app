import React, { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../../theme';
import { maskDecimal, maskInteger, maskTime } from '../../utils/format';
import { Icon, Txt } from '../ui';
import Field from './Field';

export const inputStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 50, paddingHorizontal: 14, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.white,
  },
  focused: { borderColor: colors.navy600, backgroundColor: colors.white },
  error: { borderColor: colors.danger },
  readonly: { backgroundColor: colors.grayBg, borderColor: colors.border },
  input: { flex: 1, fontSize: 16, color: colors.text, paddingVertical: 12, minWidth: 0 },
  multiline: { minHeight: 96, textAlignVertical: 'top', paddingTop: 12 },
});

export function TextField({
  label, required, help, error, value, onChangeText, placeholder, multiline, keyboardType, maxLength, suffix, prefixIcon,
  editable = true, autoCapitalize = 'sentences', secureTextEntry, onBlur, onFocus, returnKeyType, onSubmitEditing, inputRef, mask,
  autoComplete, textContentType, right, style, autoCorrect, numberOfLines,
}) {
  const [focused, setFocused] = useState(false);
  return (
    <Field label={label} required={required} help={help} error={error} right={right} style={style}>
      <View style={[inputStyles.wrap, focused && inputStyles.focused, !!error && inputStyles.error, !editable && inputStyles.readonly, multiline && { alignItems: 'flex-start' }]}>
        {prefixIcon ? <Icon name={prefixIcon} size={20} color={colors.textMuted} style={multiline ? { marginTop: 14 } : undefined} /> : null}
        <TextInput
          ref={inputRef}
          value={value ?? ''}
          onChangeText={(t) => onChangeText?.(mask ? mask(t) : t)}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          maxLength={maxLength}
          editable={editable}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoComplete={autoComplete}
          textContentType={textContentType}
          secureTextEntry={secureTextEntry}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          accessibilityLabel={`${label || placeholder || 'Campo'}${required ? ', obrigatório' : ''}`}
          accessibilityHint={help}
          style={[inputStyles.input, multiline && inputStyles.multiline]}
        />
        {suffix ? (
          <Txt v="smallStrong" muted>
            {suffix}
          </Txt>
        ) : null}
      </View>
    </Field>
  );
}

export function NumberField(props) {
  return <TextField keyboardType="decimal-pad" mask={maskDecimal} autoCapitalize="none" {...props} />;
}

export function IntegerField(props) {
  return <TextField keyboardType="number-pad" mask={maskInteger} autoCapitalize="none" {...props} />;
}

export function TimeField(props) {
  return <TextField keyboardType="number-pad" mask={maskTime} maxLength={5} placeholder="HH:MM" prefixIcon="clock-outline" autoCapitalize="none" {...props} />;
}

export function PasswordField({ label = 'Senha', ...props }) {
  const [visible, setVisible] = useState(false);
  return (
    <TextField
      label={label}
      secureTextEntry={!visible}
      autoCapitalize="none"
      autoCorrect={false}
      prefixIcon="lock-outline"
      right={
        <Pressable onPress={() => setVisible((v) => !v)} accessibilityRole="button" accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 32 }}>
          <Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.blue500} />
          <Txt v="smallStrong" color={colors.blue500}>
            {visible ? 'Ocultar' : 'Mostrar'}
          </Txt>
        </Pressable>
      }
      {...props}
    />
  );
}

export function SearchBar({ value, onChangeText, placeholder = 'Buscar', onDark, style, onSubmit }) {
  return (
    <View style={[styles.search, onDark ? styles.searchDark : styles.searchLight, style]}>
      <Icon name="magnify" size={20} color={onDark ? colors.textOnDarkMuted : colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={onDark ? colors.textOnDarkMuted : colors.textSubtle}
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="search"
        onSubmitEditing={onSubmit}
        accessibilityLabel={placeholder}
        style={[styles.searchInput, { color: onDark ? colors.white : colors.text }]}
      />
      {value ? (
        <Pressable onPress={() => onChangeText('')} accessibilityRole="button" accessibilityLabel="Limpar busca" hitSlop={10}>
          <Icon name="close-circle" size={18} color={onDark ? colors.textOnDarkMuted : colors.textSubtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 46, paddingHorizontal: 12, borderRadius: radius.md },
  searchLight: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.borderStrong },
  searchDark: { backgroundColor: 'rgba(255,255,255,0.14)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
});
