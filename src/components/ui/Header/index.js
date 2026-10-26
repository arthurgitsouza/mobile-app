import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import IconButton from '../IconButton';
import Txt from '../Txt';
import { styles, dinamico } from './styles';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Cabeçalho azul-marinho com filete dourado (identidade do exemplo de RDO do documento-base).
export default function Header({ title, subtitle, onBack, right, children, style }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.wrap, dinamico.wrap(insets.top), style]}>
      <View style={styles.row}>
        {onBack ? (
          <IconButton icon="arrow-left" label="Voltar" onPress={onBack} color={colors.white} style={styles.back} />
        ) : null}
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
