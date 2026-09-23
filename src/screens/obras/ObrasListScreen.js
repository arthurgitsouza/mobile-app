import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { chart, colors } from '../../theme';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { obrasVisiveis, rdosVisiveis } from '../../domain/selectors';
import { formatDate } from '../../utils/date';
import { normalizar } from '../../utils/format';
import { Avatar, Badge, Card, Chip, EmptyState, Icon, IconButton, ProgressBar, Screen, Txt } from '../../components/ui';
import { SearchBar } from '../../components/form';

export const STATUS_OBRA = {
  ativa: { label: 'Ativa', color: colors.success, bg: colors.successBg, icon: 'hard-hat' },
  paralisada: { label: 'Paralisada', color: colors.warning, bg: colors.warningBg, icon: 'pause-circle-outline' },
  concluida: { label: 'Concluída', color: colors.gray, bg: colors.grayBg, icon: 'flag-checkered' },
};

// Lista de obras e acesso ao detalhe (seção 13). Cada perfil vê apenas as obras autorizadas (RF-03).
export default function ObrasListScreen() {
  const nav = useNavigation();
  const isTab = useNavigationState((s) => s.type === 'tab');
  const { state, currentUser } = useApp();
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState('');
  const master = currentUser.perfil === PERFIL.MASTER;
  const obras = obrasVisiveis(state, currentUser);
  const rdos = useMemo(() => rdosVisiveis(state, currentUser), [state, currentUser]);

  const lista = useMemo(() => {
    const q = normalizar(busca);
    return obras
      .filter((o) => (filtro ? o.status === filtro : true))
      .filter((o) => !q || normalizar(`${o.nome} ${o.descricao} ${o.contrato} ${o.clienteNome} ${o.endereco}`).includes(q));
  }, [obras, busca, filtro]);

  return (
    <Screen
      title="Obras"
      subtitle={`${obras.length} ${obras.length === 1 ? 'obra' : 'obras'}`}
      tab={isTab}
      back={!isTab}
      bell={isTab}
      right={master ? <IconButton icon="plus-circle-outline" label="Cadastrar nova obra" color={colors.white} onPress={() => nav.navigate('ObraForm')} /> : undefined}
      headerExtra={<SearchBar onDark value={busca} onChangeText={setBusca} placeholder="Buscar obra, contrato ou cliente" style={{ marginTop: 8 }} />}
    >
      <View style={styles.chips}>
        <Chip label="Todas" selected={!filtro} onPress={() => setFiltro('')} />
        {Object.entries(STATUS_OBRA).map(([k, m]) => (
          <Chip key={k} label={m.label} icon={m.icon} selected={filtro === k} onPress={() => setFiltro(filtro === k ? '' : k)} />
        ))}
      </View>

      {lista.length === 0 ? <EmptyState icon="office-building-outline" title="Nenhuma obra encontrada" message={master ? 'Cadastre uma obra pelo botão + no topo.' : 'Você ainda não foi vinculado a nenhuma obra.'} /> : null}

      {lista.map((o) => {
        const meta = STATUS_OBRA[o.status];
        const das = rdos.filter((r) => r.obraId === o.id && !['cancelado', 'retificado'].includes(r.status));
        const ultimo = [...das].sort((a, b) => (a.data < b.data ? 1 : -1))[0];
        const equipe = state.users.filter((u) => (o.usuarioIds || []).includes(u.id));
        const dif = o.avancoFisico - o.avancoPrevisto;
        return (
          <Card key={o.id} onPress={() => nav.navigate('ObraDetail', { obraId: o.id })} style={{ gap: 12 }} accessibilityLabel={`${o.nome}, ${meta.label}, avanço ${o.avancoFisico}%`}>
            <View style={styles.row}>
              <View style={styles.icon}>
                <Icon name="office-building-outline" size={26} color={colors.navy600} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="h3">{o.nome}</Txt>
                <Txt v="small" muted numberOfLines={1}>
                  {o.descricao} · {o.contrato}
                </Txt>
              </View>
              <Badge label={meta.label} color={meta.color} bg={meta.bg} icon={meta.icon} size="sm" />
            </View>
            <View style={{ gap: 4 }}>
              <View style={styles.row}>
                <Txt v="small" muted style={{ flex: 1 }}>
                  Avanço físico {o.avancoFisico}% · previsto {o.avancoPrevisto}%
                </Txt>
                <Txt v="smallStrong" color={dif >= 0 ? chart.deltaGood : chart.deltaBad}>
                  {dif >= 0 ? '+' : ''}
                  {dif} p.p.
                </Txt>
              </View>
              <ProgressBar value={o.avancoFisico} label={`Avanço físico de ${o.nome}`} />
            </View>
            <View style={styles.row}>
              <Icon name="account-tie-outline" size={16} color={colors.textMuted} />
              <Txt v="caption" muted style={{ flex: 1 }} numberOfLines={1}>
                {o.clienteNome}
              </Txt>
              <View style={{ flexDirection: 'row' }}>
                {equipe.slice(0, 4).map((u, i) => (
                  <Avatar key={u.id} nome={u.nome} size={26} style={{ marginLeft: i ? -8 : 0, borderWidth: 2, borderColor: colors.white }} />
                ))}
              </View>
            </View>
            <Txt v="caption" subtle>
              {das.length} RDOs{ultimo ? ` · último em ${formatDate(ultimo.data)}` : ''}
            </Txt>
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
});
