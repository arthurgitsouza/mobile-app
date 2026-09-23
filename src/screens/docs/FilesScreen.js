import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { colors, radius } from '../../theme';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { hashCurto } from '../../domain/integridade';
import { obrasVisiveis, rdosVisiveis } from '../../domain/selectors';
import { formatDate, formatDateTime } from '../../utils/date';
import { normalizar } from '../../utils/format';
import { nomeArquivoPdf } from '../../utils/pdf';
import { Badge, Card, Chip, EmptyState, Icon, Screen, SegmentedTabs, Txt } from '../../components/ui';
import { SearchBar } from '../../components/form';

// PDF e central de arquivos (seção 13): PDFs finais dos RDOs e exportações geradas.
export default function FilesScreen() {
  const nav = useNavigation();
  const isTab = useNavigationState((s) => s.type === 'tab');
  const { state, currentUser } = useApp();
  const master = currentUser.perfil === PERFIL.MASTER;
  const [aba, setAba] = useState('pdf');
  const [busca, setBusca] = useState('');
  const [obraId, setObraId] = useState('');
  const obras = obrasVisiveis(state, currentUser);

  const pdfs = useMemo(() => {
    const q = normalizar(busca);
    return rdosVisiveis(state, currentUser)
      .filter((r) => r.status === 'finalizado' || (r.status === 'retificado' && r.hashFinal))
      .filter((r) => (obraId ? r.obraId === obraId : true))
      .map((r) => ({ rdo: r, obra: state.obras.find((o) => o.id === r.obraId) }))
      .map((x) => ({ ...x, nome: nomeArquivoPdf(x.rdo, x.obra) }))
      .filter((x) => !q || normalizar(`${x.nome} ${x.obra?.nome}`).includes(q))
      .sort((a, b) => (a.rdo.finalizadoEm < b.rdo.finalizadoEm ? 1 : -1));
  }, [state, currentUser, busca, obraId]);

  return (
    <Screen
      title="Arquivos"
      subtitle="PDFs e exportações"
      tab={isTab}
      back={!isTab}
      bell={isTab}
      headerExtra={
        <View style={{ gap: 8, marginTop: 8 }}>
          <SearchBar onDark value={busca} onChangeText={setBusca} placeholder="Buscar arquivo ou obra" />
          {master ? (
            <SegmentedTabs compact items={[{ key: 'pdf', label: 'PDFs dos RDOs', count: pdfs.length }, { key: 'export', label: 'Exportações', count: state.files.length }]} value={aba} onChange={setAba} />
          ) : null}
        </View>
      }
    >
      {aba === 'pdf' ? (
        <>
          {obras.length > 1 ? (
            <View style={styles.chips}>
              <Chip label="Todas as obras" selected={!obraId} onPress={() => setObraId('')} />
              {obras.map((o) => (
                <Chip key={o.id} label={o.nome} selected={obraId === o.id} onPress={() => setObraId(obraId === o.id ? '' : o.id)} />
              ))}
            </View>
          ) : null}
          {pdfs.length === 0 ? <EmptyState icon="file-pdf-box" title="Nenhum PDF ainda" message="O PDF final é gerado quando o cliente dá ciência/aceite e o RDO é finalizado." /> : null}
          {pdfs.map(({ rdo, obra, nome }) => (
            <Card key={rdo.id} onPress={() => nav.navigate('PdfViewer', { rdoId: rdo.id })} style={styles.arquivo} accessibilityLabel={`PDF ${nome}`}>
              <View style={styles.pdf}>
                <Icon name="file-pdf-box" size={32} color={colors.danger} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt v="bodyStrong" numberOfLines={2}>
                  {nome}
                </Txt>
                <Txt v="caption" muted>
                  {obra?.nome} · RDO de {formatDate(rdo.data)} · finalizado {formatDateTime(rdo.finalizadoEm)}
                </Txt>
                <View style={styles.tags}>
                  {rdo.assinaturas.cliente?.tipo === 'ressalva' ? <Badge label="Com ressalva" color={colors.warning} bg={colors.warningBg} icon="alert-decagram-outline" size="sm" /> : <Badge label="Aceite integral" color={colors.success} bg={colors.successBg} icon="check-decagram-outline" size="sm" />}
                  <Badge label={`hash ${hashCurto(rdo.hashFinal, 8)}`} color={colors.navy700} bg={colors.blue100} icon="pound" size="sm" />
                </View>
              </View>
              <Icon name="chevron-right" size={22} color={colors.textSubtle} />
            </Card>
          ))}
        </>
      ) : (
        <>
          {state.files.length === 0 ? <EmptyState icon="table-arrow-right" title="Nenhuma exportação" message="Gere planilhas CSV/Excel em Mais → Relatórios e indicadores → Exportar." actionLabel="Abrir relatórios" onAction={() => nav.navigate('Reports')} /> : null}
          {state.files.map((f) => (
            <Card key={f.id} style={styles.arquivo}>
              <View style={[styles.pdf, { backgroundColor: colors.successBg }]}>
                <Icon name="file-delimited-outline" size={30} color={colors.success} />
              </View>
              <View style={{ flex: 1, gap: 3 }}>
                <Txt v="bodyStrong" numberOfLines={2}>
                  {f.nome}
                </Txt>
                <Txt v="caption" muted>
                  {f.descricao} · {formatDateTime(f.criadoEm)}
                </Txt>
              </View>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  arquivo: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  pdf: { width: 54, height: 54, borderRadius: radius.md, backgroundColor: colors.dangerBg, alignItems: 'center', justifyContent: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 },
});
