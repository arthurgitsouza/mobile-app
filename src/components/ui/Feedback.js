import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import Icon from './Icon';
import Txt from './Txt';
import Button from './Button';

export function EmptyState({ icon = 'clipboard-text-outline', title, message, actionLabel, onAction, style }) {
  return (
    <View style={[styles.empty, style]}>
      <View style={styles.emptyIcon}>
        <Icon name={icon} size={30} color={colors.navy600} />
      </View>
      <Txt v="h3" style={{ textAlign: 'center' }}>
        {title}
      </Txt>
      {message ? (
        <Txt v="small" muted style={{ textAlign: 'center', maxWidth: 300 }}>
          {message}
        </Txt>
      ) : null}
      {actionLabel ? <Button title={actionLabel} onPress={onAction} full={false} size="sm" variant="tonal" style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

const TONES = {
  info: { bg: colors.infoBg, fg: colors.info, icon: 'information-outline' },
  warning: { bg: colors.warningBg, fg: colors.warning, icon: 'alert-outline' },
  danger: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert-circle-outline' },
  success: { bg: colors.successBg, fg: colors.success, icon: 'check-circle-outline' },
  gold: { bg: colors.gold50, fg: colors.goldText, icon: 'star-four-points-outline' },
  neutral: { bg: colors.grayBg, fg: colors.gray, icon: 'information-outline' },
};

// Aviso em linha. O texto usa a cor do tom (contraste ≥ 4,5:1 sobre o fundo do tom).
export function Banner({ tone = 'info', title, message, icon, actionLabel, onAction, style, children }) {
  const t = TONES[tone];
  return (
    <View style={[styles.banner, { backgroundColor: t.bg }, style]} accessibilityRole="alert">
      <Icon name={icon || t.icon} size={20} color={t.fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 2 }}>
        {title ? (
          <Txt v="smallStrong" color={t.fg}>
            {title}
          </Txt>
        ) : null}
        {message ? (
          <Txt v="small" color={t.fg}>
            {message}
          </Txt>
        ) : null}
        {children}
        {actionLabel ? (
          <Pressable onPress={onAction} accessibilityRole="button" accessibilityLabel={actionLabel} style={styles.bannerAction} hitSlop={8}>
            <Txt v="smallStrong" color={t.fg} style={{ textDecorationLine: 'underline' }}>
              {actionLabel}
            </Txt>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32, paddingHorizontal: 24 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: radius.md },
  bannerAction: { alignSelf: 'flex-start', paddingVertical: 4, minHeight: 32, justifyContent: 'center' },
});
