import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { colors, statusMeta } from '../../theme';
import { PERFIL, STATUS_ORDEM } from '../../constants';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import useCriarRdo from '../../hooks/useCriarRdo';
import { diasSemRdo, obrasVisiveis, rdosVisiveis } from '../../domain/selectors';
import { addDays, formatDate, formatMonthYear, hojeObra, ymOf } from '../../utils/date';
import { normalizar } from '../../utils/format';
import { BottomSheet, Button, Chip, EmptyState, IconButton, Screen, SegmentedTabs, SyncBanner, Txt } from '../../components/ui';
import CalendarMonth from '../../components/ui/CalendarMonth';
import { SearchBar, ChipGroup, SelectField } from '../../components/form';
import { RdoCard } from '../../components/rdo';

const PERIODOS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: 'todos', label: 'Tudo' },
];

// Calendário/lista de RDOs com filtros e status (seção 13; RF-16: obra, período, número, status, autor, atividade e ocorrência).
export default function RdoListScreen({ route, navigation }) {
  const nav = useNavigation();
  const isTab = useNavigationState((s) => s.type === 'tab');
  const { state, currentUser } = useApp();
  const now = useNow();
  const hoje = hojeObra(now);
  const criar = useCriarRdo();
  const operacional = currentUser.perfil === PERFIL.OPERACIONAL;
  const obras = obrasVisiveis(state, currentUser);

  const [modo, setModo] = useState('lista');
  const [busca, setBusca] = useState('');
  const [obraId, setObraId] = useState(route.params?.obraId || '');
  const [status, setStatus] = useState(route.params?.status || '');
  const [periodo, setPeriodo] = useState('todos');
  const [autorId, setAutorId] = useState('');
  const [filtros, setFiltros] = useState(false);
  const [mes, setMes] = useState(ymOf(hoje));
  const [dia, setDia] = useState(hoje);
  const [escolhaObra, setEscolhaObra] = useState(false);

  // Parâmetros vindos de atalhos do painel (ex.: "Devolvidos").
  useEffect(() => {
    const p = route.params;
    if (p && (p.status !== undefined || p.obraId !== undefined)) {
      setStatus(p.status || '');
      setObraId(p.obraId || '');
      setModo('lista');
      navigation.setParams({ status: undefined, obraId: undefined });
    }
  }, [route.params, navigation]);

  const todos = useMemo(() => rdosVisiveis(state, currentUser), [state, currentUser]);
  const obraEfetiva = obraId || (obras.length === 1 ? obras[0].id : '');

  const filtrados = useMemo(() => {
    const q = normalizar(busca);
    const corte = periodo === 'todos' ? null : addDays(hoje, -Number(periodo));
    return todos
      .filter((r) => (obraId ? r.obraId === obraId : true))
      .filter((r) => (status ? r.status === status : true))
      .filter((r) => (autorId ? r.autorId === autorId : true))
      .filter((r) => (corte ? r.data >= corte : true))
      .filter((r) => {
        if (!q) return true;
        const obra = state.obras.find((o) => o.id === r.obraId);
        const autor = state.users.find((u) => u.id === r.autorId);
        const texto = [
          String(r.numero), String(r.numero).padStart(4, '0'), obra?.nome, autor?.nome,
          ...r.atividades.map((a) => `${a.servico} ${a.descricao}`),
          ...r.ocorrencias.map((o) => `${o.codigo} ${o.fato}`),
        ].join(' ');
        return normalizar(texto).includes(q);
      })
      .sort((a, b) => (a.data === b.data ? b.numero - a.numero : a.data < b.data ? 1 : -1));
  }, [todos, obraId, status, autorId, periodo, busca, hoje, state.obras, state.users]);

  const contagem = useMemo(() => {
    const c = {};
    todos.forEach((r) => (c[r.status] = (c[r.status] || 0) + 1));
    return c;
  }, [todos]);

  // Calendário: pontos coloridos por RDO e dias úteis sem RDO (quando há uma obra definida).
  const marks = useMemo(() => {
    const m = {};
    filtrados.forEach((r) => {
      (m[r.data] = m[r.data] || []).push(statusMeta[r.status].color);
    });
    return m;
  }, [filtrados]);
  const faltando = useMemo(() => {
    const obra = state.obras.find((o) => o.id === obraEfetiva);
    if (!obra || currentUser.perfil === PERFIL.CLIENTE) return [];
    return diasSemRdo(state, obra, hoje, 45).filter((d) => ymOf(d) === mes);
  }, [state, obraEfetiva, hoje, mes, currentUser.perfil]);
  const doDia = filtrados.filter((r) => r.data === dia);

  const ativos = [obraId, status, autorId, periodo !== 'todos' ? periodo : ''].filter(Boolean).length;
  const obraDe = (r) => state.obras.find((o) => o.id === r.obraId);
  const nomeAutor = (r) => state.users.find((u) => u.id === r.autorId)?.nome;
  const abrir = (r) => nav.navigate('RdoDetail', { rdoId: r.id });

  const novoRdo = (data) => {
    if (obras.length === 1) return criar(obras[0], data);
    setEscolhaObra(data || true);
  };

  const cabecalho = (
    <View style={{ gap: 10, marginTop: 8 }}>
      <View style={styles.searchRow}>
        <SearchBar onDark value={busca} onChangeText={setBusca} placeholder="Buscar nº, atividade, ocorrência, autor" style={{ flex: 1 }} />
        <IconButton icon="filter-variant" label={ativos ? `Filtros, ${ativos} ativos` : 'Filtros'} color={colors.white} badge={ativos || undefined} onPress={() => setFiltros(true)} />
      </View>
      <SegmentedTabs
        compact
        items={[
          { key: 'lista', label: 'Lista', icon: 'format-list-bulleted' },
          { key: 'calendario', label: 'Calendário', icon: 'calendar-month-outline' },
        ]}
        value={modo}
        onChange={setModo}
      />
    </View>
  );

  return (
    <Screen
      title={operacional ? 'Meus RDOs' : 'RDOs'}
      subtitle={`${filtrados.length} ${filtrados.length === 1 ? 'registro' : 'registros'}`}
      tab={isTab}
      back={!isTab}
      bell={isTab}
      headerExtra={cabecalho}
      floating={
        operacional ? (
          <View style={styles.fab}>
            <Button title="Novo RDO" icon="plus" variant="accent" full={false} onPress={() => novoRdo(modo === 'calendario' && dia <= hoje ? dia : undefined)} style={styles.fabBtn} />
          </View>
        ) : null
      }
    >
      <SyncBanner />

      {/* filtro rápido por status */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }} style={{ flexGrow: 0 }}>
        <Chip label="Todos" selected={!status} onPress={() => setStatus('')} count={todos.length} />
        {STATUS_ORDEM.filter((s) => contagem[s]).map((s) => (
          <Chip key={s} label={statusMeta[s].label} icon={statusMeta[s].icon} selected={status === s} onPress={() => setStatus(status === s ? '' : s)} count={contagem[s]} />
        ))}
      </ScrollView>

      {modo === 'lista' ? (
        filtrados.length ? (
          filtrados.map((r) => (
            <RdoCard key={r.id} rdo={r} obra={obraDe(r)} agora={now} config={state.settings.lembretes} autorNome={currentUser.perfil === PERFIL.MASTER ? nomeAutor(r) : undefined} onPress={() => abrir(r)} />
          ))
        ) : (
          <EmptyState
            icon="file-search-outline"
            title="Nenhum RDO encontrado"
            message={ativos || busca ? 'Ajuste a busca ou os filtros para ver mais registros.' : 'Ainda não há RDOs para exibir.'}
            actionLabel={ativos || busca ? 'Limpar filtros' : undefined}
            onAction={() => {
              setBusca('');
              setObraId('');
              setStatus('');
              setAutorId('');
              setPeriodo('todos');
            }}
          />
        )
      ) : (
        <>
          <View style={styles.cal}>
            <CalendarMonth month={mes} onMonthChange={setMes} selected={dia} onSelect={setDia} marks={marks} faltando={faltando} />
            <View style={styles.legenda}>
              <Legenda cor={colors.navy600} texto="RDO registrado" />
              <Legenda cor={colors.warning} texto="Dia útil sem RDO" fundo />
            </View>
          </View>
          <Txt v="h3">
            {formatDate(dia)} {dia === hoje ? '· hoje' : ''}
          </Txt>
          {doDia.length ? (
            doDia.map((r) => <RdoCard key={r.id} rdo={r} obra={obraDe(r)} agora={now} config={state.settings.lembretes} autorNome={currentUser.perfil === PERFIL.MASTER ? nomeAutor(r) : undefined} onPress={() => abrir(r)} />)
          ) : (
            <EmptyState
              icon="calendar-blank-outline"
              title="Sem RDO nesta data"
              message={operacional && dia <= hoje ? 'Você pode criar o RDO desta data (datas futuras não são permitidas).' : undefined}
              actionLabel={operacional && dia <= hoje ? 'Criar RDO desta data' : undefined}
              onAction={() => novoRdo(dia)}
            />
          )}
          <Txt v="caption" subtle style={{ textAlign: 'center' }}>
            {formatMonthYear(mes)}
          </Txt>
        </>
      )}

      <BottomSheet
        visible={filtros}
        onClose={() => setFiltros(false)}
        title="Filtros"
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button
              title="Limpar"
              variant="secondary"
              onPress={() => {
                setObraId('');
                setStatus('');
                setAutorId('');
                setPeriodo('todos');
              }}
              style={{ flex: 1 }}
            />
            <Button title="Aplicar" icon="check" onPress={() => setFiltros(false)} style={{ flex: 1.3 }} />
          </View>
        }
      >
        {obras.length > 1 ? <ChipGroup label="Obra" options={[{ value: '', label: 'Todas' }, ...obras.map((o) => ({ value: o.id, label: o.nome }))]} value={obraId} onChange={setObraId} required /> : null}
        <ChipGroup label="Período" options={PERIODOS} value={periodo} onChange={setPeriodo} required />
        <ChipGroup label="Situação" options={[{ value: '', label: 'Todas' }, ...STATUS_ORDEM.map((s) => ({ value: s, label: statusMeta[s].label }))]} value={status} onChange={setStatus} required />
        {currentUser.perfil === PERFIL.MASTER ? (
          <SelectField
            label="Autor"
            value={autorId}
            onChange={setAutorId}
            options={[{ value: '', label: 'Todos os autores' }, ...state.users.filter((u) => u.perfil === PERFIL.OPERACIONAL).map((u) => ({ value: u.id, label: u.nome }))]}
            placeholder="Todos os autores"
          />
        ) : null}
      </BottomSheet>

      <BottomSheet visible={!!escolhaObra} onClose={() => setEscolhaObra(false)} title="Novo RDO — escolha a obra">
        {obras.map((o) => (
          <Button
            key={o.id}
            title={o.nome}
            icon="office-building-outline"
            variant="secondary"
            onPress={() => {
              const data = typeof escolhaObra === 'string' ? escolhaObra : undefined;
              setEscolhaObra(false);
              criar(o, data);
            }}
          />
        ))}
      </BottomSheet>
    </Screen>
  );
}

function Legenda({ cor, texto, fundo }) {
  return (
    <View style={styles.leg}>
      <View style={[styles.legDot, { backgroundColor: fundo ? colors.warningBg : cor }, fundo && { borderWidth: 1, borderColor: cor }]} />
      <Txt v="caption" muted>
        {texto}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fab: { position: 'absolute', right: 16, bottom: 16 },
  fabBtn: { paddingHorizontal: 22, height: 54, borderRadius: 27 },
  cal: { backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 12 },
  legenda: { flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 4 },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legDot: { width: 12, height: 12, borderRadius: 6 },
});
