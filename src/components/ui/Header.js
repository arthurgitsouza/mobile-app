import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import IconButton from './IconButton';
import Txt from './Txt';

// Cabeçalho azul-marinho com filete dourado (identidade do exemplo de RDO do documento-base).
export default function Header({ title, subtitle, onBack, right, children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 8 }, style]}>
      <View style={styles.row}>
        {onBack ? <IconButton icon="arrow-left" label="Voltar" onPress={onBack} color={colors.white} style={styles.back} /> : null}
        <View style={styles.titles}>
          {subtitle ? (
            <Txt v="caption" color={colors.textOnDarkMuted} numberOfLines={1}>
              {subtitle}
            </Txt>
          ) : null}
          <Txt v="h2" color={colors.white} numberOfLines={1} accessibilityRole="header">
            {title}
          </Txt>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {children}
      <View style={styles.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.navy700, paddingHorizontal: 12, paddingBottom: 14 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48, gap: 4 },
  back: { marginLeft: -4 },
  titles: { flex: 1, paddingLeft: 4, paddingRight: 4, gap: 1 },
  right: { flexDirection: 'row', alignItems: 'center' },
  gold: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: colors.gold500 },
});
