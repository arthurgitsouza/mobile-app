import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme';
import { formatDateTime } from '../../utils/date';
import { Badge, Button, IconButton, KeyValue, Txt } from '../ui';
import PhotoTile from './PhotoTile';

// Visualizador de foto com os metadados exigidos pelo grupo K (legenda, local, autoria, data/hora, vínculo…).
export default function PhotoViewer({ fotos, indice, onClose, onIndice, nomeAutor, vinculoRotulo, onEditar, onComentar }) {
  const insets = useSafeAreaInsets();
  const [largura, setLargura] = useState(320);
  const foto = fotos?.[indice];
  if (!foto) return null;
  const n = String(foto.numero).padStart(2, '0');
  const vinculo = vinculoRotulo?.(foto);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={[styles.root, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.bar}>
          <Txt v="bodyStrong" color={colors.white} style={{ flex: 1 }}>
            Foto {n} de {fotos.length}
          </Txt>
          <IconButton icon="close" label="Fechar visualização" color={colors.white} onPress={onClose} />
        </View>
        <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} showsVerticalScrollIndicator={false}>
          <View onLayout={(e) => setLargura(e.nativeEvent.layout.width)} style={{ alignItems: 'center' }}>
            <PhotoTile foto={foto} width={largura} ratio={0.75} showState={false} />
          </View>
          <View style={styles.nav}>
            <Button title="Anterior" icon="chevron-left" variant="onDark" size="sm" full={false} disabled={indice <= 0} onPress={() => onIndice(indice - 1)} />
            <Button title="Próxima" iconRight="chevron-right" variant="onDark" size="sm" full={false} disabled={indice >= fotos.length - 1} onPress={() => onIndice(indice + 1)} />
          </View>
          <View style={styles.card}>
            <Txt v="bodyStrong">{foto.legenda || 'Sem legenda — obrigatória para o envio'}</Txt>
            <KeyValue inline label="Local" value={foto.local} />
            <KeyValue inline label="Vínculo" value={vinculo || 'Sem vínculo'} />
            <KeyValue inline label="Autoria" value={nomeAutor?.(foto.autorId)} />
            <KeyValue inline label="Data/hora" value={formatDateTime(foto.dataHora)} />
            <KeyValue
              inline
              label="Coordenada"
              value={foto.coordenada ? `${foto.coordenada.lat.toFixed(5)}, ${foto.coordenada.lng.toFixed(5)} (±${Math.round(foto.coordenada.precisao || 0)} m)` : 'Não registrada (opcional)'}
            />
            <KeyValue inline label="Arquivo" value={foto.meta ? `${foto.meta.largura}×${foto.meta.altura} px · compressão ${foto.meta.compressao}% registrada` : '—'} />
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Badge
                label={foto.envio === 'local' ? 'Somente no aparelho' : 'Enviada ao servidor'}
                color={foto.envio === 'local' ? colors.warning : colors.success}
                bg={foto.envio === 'local' ? colors.warningBg : colors.successBg}
                icon={foto.envio === 'local' ? 'cloud-off-outline' : 'cloud-check-outline'}
                size="sm"
              />
            </View>
            {onComentar || onEditar ? (
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                {onEditar ? <Button title="Editar legenda" icon="pencil-outline" variant="secondary" size="sm" onPress={() => onEditar(foto)} style={{ flex: 1 }} /> : null}
                {onComentar ? <Button title="Comentar foto" icon="comment-text-outline" variant="tonal" size="sm" onPress={() => onComentar(foto)} style={{ flex: 1 }} /> : null}
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(8,20,36,0.96)' },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  nav: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 10 },
});
