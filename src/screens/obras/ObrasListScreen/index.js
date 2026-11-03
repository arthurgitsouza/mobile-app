import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { chart, colors } from '../../../theme';
import { PERFIL } from '../../../constants';
import { useApp } from '../../../store/AppContext';
import { obrasVisiveis, rdosVisiveis } from '../../../domain/selectors';
import { formatDate } from '../../../utils/date';
import { normalizar } from '../../../utils/format';
import {
  Avatar,
  Badge,
  Card,
  Chip,
  EmptyState,
  Icon,
  IconButton,
  ProgressBar,
  Screen,
  Txt,
} from '../../../components/ui';
import { SearchBar } from '../../../components/form';
import { styles, dinamico } from './styles';

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
      .filter(
        (o) => !q || normalizar(`${o.nome} ${o.descricao} ${o.contrato} ${o.clienteNome} ${o.endereco}`).includes(q),
      );
  }, [obras, busca, filtro]);

  return (
    <Screen
      title="Obras"
      subtitle={`${obras.length} ${obras.length === 1 ? 'obra' : 'obras'}`}
      tab={isTab}
      back={!isTab}
      bell={isTab}
      right={
        master ? (
          <IconButton
            icon="plus-circle-outline"
            label="Cadastrar nova obra"
            color={colors.white}
            onPress={() => nav.navigate('ObraForm')}
          />
        ) : undefined
      }
      headerExtra={
        <SearchBar
          onDark
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar obra, contrato ou cliente"
          style={styles.topo}
        />
      }
    >
      <View style={styles.chips}>
        <Chip label="Todas" selected={!filtro} onPress={() => setFiltro('')} />
        {Object.entries(STATUS_OBRA).map(([k, m]) => (
          <Chip
            key={k}
            label={m.label}
            icon={m.icon}
            selected={filtro === k}
            onPress={() => setFiltro(filtro === k ? '' : k)}
          />
        ))}
      </View>

      {lista.length === 0 ? (
        <EmptyState
          icon="office-building-outline"
          title="Nenhuma obra encontrada"
          message={master ? 'Cadastre uma obra pelo botão + no topo.' : 'Você ainda não foi vinculado a nenhuma obra.'}
        />
      ) : null}

      {lista.map((o) => {
        const meta = STATUS_OBRA[o.status];
        const das = rdos.filter((r) => r.obraId === o.id && !['cancelado', 'retificado'].includes(r.status));
        const ultimo = [...das].sort((a, b) => (a.data < b.data ? 1 : -1))[0];
        const equipe = state.users.filter((u) => (o.usuarioIds || []).includes(u.id));
        const dif = o.avancoFisico - o.avancoPrevisto;
        return (
          <Card
            key={o.id}
            onPress={() => nav.navigate('ObraDetail', { obraId: o.id })}
            style={styles.cartao}
            accessibilityLabel={`${o.nome}, ${meta.label}, avanço ${o.avancoFisico}%`}
          >
            <View style={styles.row}>
              <View style={styles.icon}>
                <Icon name="office-building-outline" size={26} color={colors.navy600} />
              </View>
              <View style={styles.fill}>
                <Txt v="h3">{o.nome}</Txt>
                <Txt v="small" muted numberOfLines={1}>
                  {o.descricao} · {o.contrato}
                </Txt>
              </View>
              <Badge label={meta.label} color={meta.color} bg={meta.bg} icon={meta.icon} size="sm" />
            </View>
            <View style={styles.info}>
              <View style={styles.row}>
                <Txt v="small" muted style={styles.fill}>
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
              <Txt v="caption" muted style={styles.fill} numberOfLines={1}>
                {o.clienteNome}
              </Txt>
              <View style={styles.avatares}>
                {equipe.slice(0, 4).map((u, i) => (
                  <Avatar key={u.id} nome={u.nome} size={26} style={dinamico.avatar(i)} />
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
