import React, { useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors } from '../../../theme';
import { uid } from '../../../utils/format';
import { nowISO } from '../../../utils/date';
import { Banner, Button, Card, Icon, LinkButton, Txt, useUI } from '../../../components/ui';
import { PhotoTile } from '../../../components/rdo';
import { capturarFoto, escolherDaGaleria } from '../../../services/media';
import { haptic } from '../../../utils/feedback';
import PhotoEditorSheet from './PhotoEditorSheet';

const EXEMPLOS = [
  { cor: 'blue', icone: 'wall' },
  { cor: 'green', icone: 'cube-outline' },
  { cor: 'peach', icone: 'pipe' },
];

const renumerar = (fotos) => fotos.map((f, i) => ({ ...f, numero: i + 1 }));

// Grupo K — Registro fotográfico: câmera/galeria, legenda obrigatória, local, vínculo e coordenada opcional.
export default function StepFotos({ rdo, update, ctx, mostrarErros }) {
  const { currentUser, catalogos } = ctx;
  const { notice, confirm, toast } = useUI();
  const { width } = useWindowDimensions();
  const tile = Math.floor((Math.min(width, 560) - 32 - 16) / 3);
  const [editandoId, setEditandoId] = useState(null);
  const [fila, setFila] = useState([]);
  const nomeAutor = (id) => ctx.usuarios.find((u) => u.id === id)?.nome || 'Autor';

  const adicionar = (assets, exemplo = false) => {
    const agora = nowISO();
    const base = rdo.fotos.length;
    const novas = assets.map((a, i) => ({
      id: uid('ft'),
      numero: base + i + 1,
      uri: exemplo ? null : a.uri,
      ...(exemplo ? { cor: a.cor, icone: a.icone } : {}),
      legenda: '',
      local: '',
      vinculo: null,
      autorId: currentUser.id,
      dataHora: agora,
      coordenada: null,
      meta: { largura: a.width || 1600, altura: a.height || 1200, compressao: 80 },
      envio: 'local',
    }));
    update((d) => ({ fotos: [...d.fotos, ...novas] }));
    setFila(novas.slice(1).map((f) => f.id));
    setEditandoId(novas[0].id);
    haptic.tap();
  };

  const tirar = async () => {
    const r = await capturarFoto();
    if (r.erro) return notice({ icon: 'camera-off-outline', title: 'Câmera indisponível', message: r.erro });
    if (r.assets?.length) adicionar(r.assets);
    return undefined;
  };
  const galeria = async () => {
    const r = await escolherDaGaleria(6);
    if (r.erro) return notice({ icon: 'image-off-outline', title: 'Galeria indisponível', message: r.erro });
    if (r.assets?.length) adicionar(r.assets);
    return undefined;
  };
  const exemplo = () => {
    const i = rdo.fotos.length % EXEMPLOS.length;
    adicionar([{ ...EXEMPLOS[i], width: 1600, height: 1200 }], true);
  };

  const foto = rdo.fotos.find((f) => f.id === editandoId);

  const salvarFoto = (atualizada) => {
    update((d) => ({ fotos: d.fotos.map((f) => (f.id === atualizada.id ? atualizada : f)) }));
    const [proxima, ...resto] = fila;
    setFila(resto);
    setEditandoId(proxima || null);
    if (!proxima) toast.show({ type: 'success', title: 'Foto salva', message: 'Legenda registrada.' });
  };

  const removerFoto = async (f) => {
    const ok = await confirm({ destructive: true, title: 'Remover foto?', message: `A Foto ${String(f.numero).padStart(2, '0')} será removida deste RDO.`, confirmLabel: 'Remover' });
    if (!ok) return;
    update((d) => ({ fotos: renumerar(d.fotos.filter((x) => x.id !== f.id)) }));
    setFila((q) => q.filter((id) => id !== f.id));
    setEditandoId(null);
  };

  const semLegenda = rdo.fotos.filter((f) => !f.legenda?.trim()).length;

  return (
    <View style={{ gap: 14 }}>
      <View style={styles.acoes}>
        <Button title="Tirar foto" icon="camera-outline" onPress={tirar} style={{ flex: 1 }} />
        <Button title="Galeria" icon="image-multiple-outline" variant="secondary" onPress={galeria} style={{ flex: 1 }} />
      </View>

      {rdo.fotos.length === 0 ? (
        <Card tone="soft" style={{ alignItems: 'center', gap: 8 }}>
          <Icon name="camera-plus-outline" size={34} color={colors.navy600} />
          <Txt v="bodyStrong" style={{ textAlign: 'center' }}>
            Nenhuma foto ainda
          </Txt>
          <Txt v="small" muted style={{ textAlign: 'center' }}>
            Recomendado: ao menos 3 fotos com legenda, local e vínculo à atividade ou ocorrência. Funciona offline: as fotos ficam no aparelho até a sincronização.
          </Txt>
          <LinkButton title="Sem câmera à mão? Usar imagem de exemplo" icon="image-outline" onPress={exemplo} />
        </Card>
      ) : (
        <>
          <View style={styles.grid}>
            {rdo.fotos.map((f) => (
              <View key={f.id} style={{ width: tile, gap: 4 }}>
                <PhotoTile foto={f} width={tile} onPress={() => setEditandoId(f.id)} />
                <Txt v="caption" color={f.legenda ? colors.textMuted : colors.danger} numberOfLines={2} style={!f.legenda ? { fontWeight: '800' } : undefined}>
                  {f.legenda || 'Sem legenda (obrigatória)'}
                </Txt>
              </View>
            ))}
          </View>
          <LinkButton title="Adicionar imagem de exemplo" icon="image-plus" onPress={exemplo} />
        </>
      )}

      {semLegenda > 0 && mostrarErros ? <Banner tone="danger" message={`${semLegenda} ${semLegenda === 1 ? 'foto sem legenda' : 'fotos sem legenda'}: toque na miniatura para completar.`} /> : null}
      <Banner tone="neutral" icon="shield-lock-outline" title="Privacidade" message="Evite fotografar pessoas identificáveis sem necessidade. A localização é opcional e só é registrada com a sua autorização, foto a foto." />

      <PhotoEditorSheet
        foto={foto}
        rdo={rdo}
        catalogos={catalogos}
        nomeAutor={nomeAutor}
        onSalvar={salvarFoto}
        onRemover={removerFoto}
        onClose={() => {
          setFila([]);
          setEditandoId(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  acoes: { flexDirection: 'row', gap: 10 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
