import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';

// Ícones são decorativos: o significado sempre vem também por texto (RNF-05).
export default function Icon({ name, size = 20, color = colors.text, style }) {
  return (
    <MaterialCommunityIcons
      name={name}
      size={size}
      color={color}
      style={style}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}
