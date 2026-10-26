import React from 'react';
import { View } from 'react-native';
import { colors } from '../../../theme';
import { shadows } from '../../../theme/shadows';
import Icon from '../Icon';
import { styles, dinamico } from './styles';

// Marca do app: capacete de obra sobre quadrado dourado (o dourado é o acento do documento-base).
export default function BrandMark({ size = 64, style }) {
  return (
    <View style={[styles.box, shadows.raised, dinamico.marca(size), style]} accessible accessibilityLabel="RDO Mobile">
      <Icon name="hard-hat" size={size * 0.58} color={colors.navy900} />
    </View>
  );
}
