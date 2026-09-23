import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { EVENTOS_AUDITORIA, PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { numeroFormatado } from '../../domain/rdo';
import { nomeUsuario } from '../../domain/selectors';
import { formatDateTime } from '../../utils/date';
import { normalizar } from '../../utils/format';
import { Badge, Banner, Button, Card, Chip, EmptyState, Icon, Screen, Txt } from '../../components/ui';
import { SearchBar } from '../../components/form';

const GRUPOS = [
  { key: '', label: 'Todos' },
  { key: 'assinaturas', label: 'Assinaturas', eventos: ['validacao', 'ciencia_cliente', 'ressalva_cliente', 'finalizacao'] },
  { key: 'fluxo', label: 'Envio e análise', eventos: ['submissao', 'sincronizacao', 'analise_iniciada', 'devolucao', 'correcao_reenvio', 'envio_cliente', 'esclarecimento_cliente', 'esclarecimento_respondido', 'comentario'] },
  { key: 'alteracoes', label: 'Alterações', eventos: ['edicao_master', 'retificacao', 'cancelamento', 'exclusao', 'rascunho_salvo', 'criacao'] },
  { key: 'acesso', label: 'Acessos', eventos: ['visualizacao', 'pdf_gerado', 'exportacao'] },
  { key: 'cadastros', label: 'Cadastros', eventos: ['usuario', 'obra'] },
];

// Auditoria geral (RF-19): criação, visualização, alteração, comentário, assinatura, envio e cancelamento — somente leitura.
export default function AuditScreen({ navigation }) {
  const { state, currentUser } = useApp();
  const [grupo, setGrupo] = useState('');
  const [busca, setBusca] = useState('');
  const [limite, setLimite] = useState(40);

  const eventos = useMemo(() => {
    const doRdo = state.rdos.flatMap((r) => r.auditoria.map((a) => ({ ...a, rdo: r })));
    const globais = state.auditoriaGlobal.map((a) => ({ ...a, versao: null, rdo: null }));
    const g = GRUPOS.find((x) => x.key === grupo);
    const q = normalizar(busca);
    return [...doRdo, ...globais]
      .filter((a) => (g?.eventos ? g.eventos.includes(a.evento) : true))
      .filter((a) => {
        if (!q) return true;
        const obra = a.rdo ? state.obras.find((o) => o.id === a.rdo.obraId)?.nome : '';
        return normalizar(`${EVENTOS_AUDITORIA[a.evento]?.label} ${nomeUsuario(state, a.usuarioId)} ${a.detalhe} ${obra} ${a.rdo ? numeroFormatado(a.rdo) : ''}`).includes(q);
      })
      .sort((a, b) => (a.dataHora < b.dataHora ? 1 : -1));
  }, [state, grupo, busca]);

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Auditoria" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" message="A auditoria geral é exclusiva do usuário Master." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Auditoria geral"
      subtitle={`${eventos.length} eventos`}
      back
      headerExtra={<SearchBar onDark value={busca} onChangeText={setBusca} placeholder="Buscar usuário, obra, RDO ou evento" style={{ marginTop: 8 }} />}
    >
      <Banner tone="neutral" icon="shield-lock-outline" message="Trilha somente leitura: cada evento registra usuário, data/hora, objeto e versão. Registros não podem ser editados nem apagados." />
      <View style={styles.chips}>
        {GRUPOS.map((g) => (
          <Chip key={g.key} label={g.label} selected={grupo === g.key} onPress={() => { setGrupo(g.key); setLimite(40); }} />
        ))}
      </View>
      {eventos.length === 0 ? <EmptyState icon="history" title="Nenhum evento" message="Ajuste o filtro ou a busca." /> : null}
      {eventos.slice(0, limite).map((a) => {
        const m = EVENTOS_AUDITORIA[a.evento] || { label: a.evento, icone: 'circle-small' };
        const obra = a.rdo ? state.obras.find((o) => o.id === a.rdo.obraId) : null;
        return (
          <Card key={`${a.id}-${a.rdo?.id || 'g'}`} onPress={a.rdo ? () => navigation.navigate('RdoDetail', { rdoId: a.rdo.id, tab: 'historico' }) : undefined} style={{ gap: 6 }}>
            <View style={styles.row}>
              <View style={styles.icone}>
                <Icon name={m.icone} size={18} color={colors.navy700} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="smallStrong">{m.label}</Txt>
                <Txt v="caption" muted>
                  {nomeUsuario(state, a.usuarioId)} · {formatDateTime(a.dataHora)}
                </Txt>
              </View>
              {a.rdo ? <Badge label={`RDO ${numeroFormatado(a.rdo)} v${a.versao ?? 1}`} color={colors.navy700} bg={colors.blue100} size="sm" /> : <Badge label="Geral" color={colors.gray} bg={colors.grayBg} size="sm" />}
            </View>
            {obra ? (
              <Txt v="caption" subtle>
                {obra.nome}
              </Txt>
            ) : null}
            {a.detalhe ? (
              <Txt v="small" muted numberOfLines={3}>
                {a.detalhe}
              </Txt>
            ) : null}
          </Card>
        );
      })}
      {eventos.length > limite ? <Button title={`Carregar mais (${eventos.length - limite})`} variant="secondary" onPress={() => setLimite((l) => l + 40)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icone: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
});
