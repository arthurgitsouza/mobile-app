import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { Icon, Txt } from '../ui';

// Miniaturas de exemplo (fotos fictícias do seed) seguem o esquema de cores do exemplo do documento-base.
const PLACEHOLDER = {
  blue: { bg: '#DDEAF6', border: '#8DA6C2', fg: '#17375E' },
  green: { bg: '#E2EDD9', border: '#9DB58A', fg: '#2F5A1F' },
  peach: { bg: '#FBE4D6', border: '#D9A688', fg: '#7A3B14' },
};

export default function PhotoTile({ foto, width = 110, ratio = 0.75, onPress, selected, style, showState = true }) {
  const [falhou, setFalhou] = useState(false);
  const p = PLACEHOLDER[foto.cor] || PLACEHOLDER.blue;
  const num = String(foto.numero).padStart(2, '0');
  const local = foto.envio === 'local';

  const conteudo = (
    <View style={[styles.tile, { width, height: width * ratio, backgroundColor: p.bg, borderColor: selected ? colors.gold500 : p.border, borderWidth: selected ? 3 : 1 }, style]}>
      {foto.uri && !falhou ? (
        <Image source={{ uri: foto.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" onError={() => setFalhou(true)} accessibilityLabel={foto.legenda || `Foto ${num}`} />
      ) : (
        <View style={styles.center}>
          <Icon name={foto.icone || 'image-outline'} size={Math.max(22, width * 0.26)} color={p.fg} />
          <Txt v="smallStrong" color={p.fg} style={{ letterSpacing: 1 }}>
            FOTO {num}
          </Txt>
        </View>
      )}
      <View style={styles.num}>
        <Txt v="caption" color={colors.white} style={{ fontWeight: '800' }}>
          {num}
        </Txt>
      </View>
      {showState ? (
        <View style={styles.badges}>
          {local ? (
            <View style={[styles.mini, { backgroundColor: colors.warningBg }]}>
              <Icon name="cloud-off-outline" size={12} color={colors.warning} />
            </View>
          ) : null}
          {foto.coordenada ? (
            <View style={[styles.mini, { backgroundColor: colors.infoBg }]}>
              <Icon name="map-marker" size={12} color={colors.info} />
            </View>
          ) : null}
          {!foto.legenda ? (
            <View style={[styles.mini, { backgroundColor: colors.dangerBg }]}>
              <Icon name="text-box-remove-outline" size={12} color={colors.danger} />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );

  if (!onPress) return conteudo;
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Foto ${num}${foto.legenda ? `: ${foto.legenda}` : ', sem legenda'}`} style={({ pressed }) => pressed && { opacity: 0.85 }}>
      {conteudo}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: { borderRadius: radius.md, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  center: { alignItems: 'center', gap: 4 },
  num: { position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(12,32,56,0.78)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 1 },
  badges: { position: 'absolute', bottom: 6, right: 6, flexDirection: 'row', gap: 4 },
  mini: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
