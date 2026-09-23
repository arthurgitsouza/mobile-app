import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { shadows } from '../../theme/shadows';
import Icon from './Icon';

// Marca do app: capacete de obra sobre quadrado dourado (o dourado é o acento do documento-base).
export default function BrandMark({ size = 64, style }) {
  return (
    <View style={[styles.box, shadows.raised, { width: size, height: size, borderRadius: size * 0.28 }, style]} accessible accessibilityLabel="RDO Mobile">
      <Icon name="hard-hat" size={size * 0.58} color={colors.navy900} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.gold500, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.gold200,
  },
});
