import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { chart, colors, radius } from '../../theme';
import { EVENTOS_AUDITORIA } from '../../constants';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import { diasSemRdo, nomeUsuario, rdoDaData, rdosAguardandoAnalise } from '../../domain/selectors';
import { numeroFormatado } from '../../domain/rdo';
import { combineDateTime, formatDate, hojeObra, tempoRelativo, addHours } from '../../utils/date';
import { contar } from '../../utils/format';
import { Avatar, Banner, Button, Card, CriticidadeBadge, Icon, ProgressBar, Screen, StatusBadge, SyncBanner, Txt } from '../../components/ui';
import { StatTile } from '../../components/charts/StatTile';
import { Grade, TituloSecao, DataDeHoje, tituloBoasVindas } from './shared';

export default function MasterHome() {
  const nav = useNavigation();
  const { state, currentUser } = useApp();
  const now = useNow();
  const hoje = hojeObra(now);
  const cfg = state.settings.lembretes;

  const d = useMemo(() => {
    const aguardando = rdosAguardandoAnalise(state);
    const limite = new Date(now).getTime() - cfg.masterHoras * 3600 * 1000;
    const atrasadosAnalise = aguardando.filter((r) => new Date(r.submetidoEm).getTime() <= limite);
    const comCliente = state.rdos.filter((r) => r.status === 'enviado_cliente');
    const desde30 = addHours(now, -24 * 30);
    // Pendências críticas: abertas, alta/crítica, na versão mais recente de cada obra.
    const criticas = [];
    for (const obra of state.obras) {
      const ultimo = state.rdos
        .filter((r) => r.obraId === obra.id && !['cancelado', 'retificado', 'rascunho'].includes(r.status))
        .sort((a, b) => (a.data < b.data ? 1 : -1))[0];
      (ultimo?.pendencias || [])
        .filter((p) => p.status !== 'resolvida' && ['alta', 'critica'].includes(p.criticidade))
        .forEach((p) => criticas.push({ p, rdo: ultimo, obra }));
    }
    const eventos = state.rdos
      .flatMap((r) => r.auditoria.map((a) => ({ ...a, rdo: r })))
      .filter((a) => !['visualizacao', 'rascunho_salvo', 'criacao'].includes(a.evento))
      .sort((a, b) => (a.dataHora < b.dataHora ? 1 : -1))
      .slice(0, 5);
    return {
      aguardando,
      atrasadosAnalise,
      devolvidos: state.rdos.filter((r) => r.status === 'devolvido'),
      comCliente,
      esclarecimentos: comCliente.filter((r) => r.esclarecimentoPendente),
      finalizados: state.rdos.filter((r) => r.status === 'finalizado' && r.finalizadoEm >= desde30),
      semRdo: state.obras.filter((o) => o.status === 'ativa').reduce((n, o) => n + diasSemRdo(state, o, hoje, 7).length, 0),
      criticas: criticas.slice(0, 4),
      eventos,
    };
  }, [state, now, hoje, cfg.masterHoras]);

  return (
    <Screen title="Painel" subtitle={tituloBoasVindas(currentUser)} tab bell>
      <DataDeHoje />
      <SyncBanner />

      <View style={styles.hero}>
        <Txt v="label" color={colors.gold200}>
          AGUARDANDO SUA ANÁLISE
        </Txt>
        <View style={styles.heroRow}>
          <Txt v="display" color={colors.white} style={styles.heroNum} accessibilityLabel={`${d.aguardando.length} RDOs aguardando análise`}>
            {d.aguardando.length}
          </Txt>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="bodyStrong" color={colors.white}>
              {d.aguardando.length === 1 ? 'RDO pronto para análise' : 'RDOs prontos para análise'}
            </Txt>
            {d.atrasadosAnalise.length ? (
              <View style={styles.heroAlert}>
                <Icon name="clock-alert-outline" size={16} color={colors.gold500} />
                <Txt v="small" color={colors.gold200}>
                  {contar(d.atrasadosAnalise.length, 'com')} mais de {cfg.masterHoras} h sem análise
                </Txt>
              </View>
            ) : (
              <Txt v="small" color={colors.textOnDarkMuted}>
                {d.aguardando.length ? 'Todos dentro do prazo sugerido.' : 'Nada pendente. Bom trabalho!'}
              </Txt>
            )}
          </View>
        </View>
        <Button title="Abrir caixa de análise" icon="clipboard-check-outline" variant="accent" onPress={() => nav.navigate('Analysis')} />
      </View>

      <Grade>
        <StatTile label="Devolvidos para correção" value={d.devolvidos.length} icon="undo-variant" onPress={() => nav.navigate('Rdos', { status: 'devolvido' })} hint={d.devolvidos.length ? 'Aguardando o operacional' : 'Nenhum pendente'} />
        <StatTile label="Aguardando o cliente" value={d.comCliente.length} icon="account-clock-outline" onPress={() => nav.navigate('Rdos', { status: 'enviado_cliente' })} hint={d.esclarecimentos.length ? `${contar(d.esclarecimentos.length, 'esclarecimento')} para responder` : 'Sem esclarecimentos'} destaque={d.esclarecimentos.length > 0} />
        <StatTile label="Finalizados em 30 dias" value={d.finalizados.length} icon="file-pdf-box" onPress={() => nav.navigate('Rdos', { status: 'finalizado' })} hint="PDF final e hash disponíveis" />
        <StatTile label="Dias úteis sem RDO (7 dias)" value={d.semRdo} icon="calendar-alert" onPress={() => nav.navigate('Reports')} hint={d.semRdo ? 'Registros atrasados nas obras' : 'Cobertura completa'} destaque={d.semRdo > 0} />
      </Grade>

      <TituloSecao acao="Ver obras" onAcao={() => nav.navigate('Obras')}>
        Obras hoje
      </TituloSecao>
      {state.obras.map((obra) => {
        const rdoHoje = rdoDaData(state, obra.id, hoje);
        const defasagem = obra.avancoFisico - obra.avancoPrevisto;
        return (
          <Card key={obra.id} onPress={() => nav.navigate('ObraDetail', { obraId: obra.id })} style={{ gap: 10 }} accessibilityLabel={`${obra.nome}, avanço ${obra.avancoFisico}%`}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{obra.nome}</Txt>
                <Txt v="caption" muted>
                  {obra.descricao} · {obra.contrato}
                </Txt>
              </View>
              {rdoHoje ? <StatusBadge status={rdoHoje.status} size="sm" /> : <Txt v="caption" color={colors.warning} style={{ fontWeight: '800' }}>Sem RDO hoje</Txt>}
            </View>
            <View style={{ gap: 4 }}>
              <View style={styles.row}>
                <Txt v="small" muted style={{ flex: 1 }}>
                  Avanço físico {obra.avancoFisico}% · previsto {obra.avancoPrevisto}%
                </Txt>
                <Txt v="smallStrong" color={defasagem >= 0 ? chart.deltaGood : chart.deltaBad}>
                  {defasagem >= 0 ? '+' : ''}
                  {defasagem} p.p.
                </Txt>
              </View>
              <ProgressBar value={obra.avancoFisico} label={`Avanço físico de ${obra.nome}`} />
            </View>
          </Card>
        );
      })}

      <TituloSecao>Pendências críticas</TituloSecao>
      {d.criticas.length ? (
        d.criticas.map(({ p, rdo, obra }) => {
          const vencida = new Date(combineDateTime(p.prazo, p.prazoHora || '23:59')).getTime() < new Date(now).getTime();
          return (
            <Card key={p.id} onPress={() => nav.navigate('RdoDetail', { rdoId: rdo.id })} style={{ gap: 6 }} accessibilityLabel={`Pendência ${p.criticidade}: ${p.descricao}`}>
              <View style={styles.row}>
                <CriticidadeBadge nivel={p.criticidade} size="sm" />
                <Txt v="caption" muted style={{ flex: 1 }} numberOfLines={1}>
                  {obra.nome} · RDO nº {numeroFormatado(rdo)}
                </Txt>
                {vencida ? (
                  <View style={styles.vencida}>
                    <Icon name="clock-alert-outline" size={13} color={colors.danger} />
                    <Txt v="caption" color={colors.danger} style={{ fontWeight: '800' }}>
                      Vencida
                    </Txt>
                  </View>
                ) : null}
              </View>
              <Txt v="small" numberOfLines={2}>
                {p.descricao}
              </Txt>
              <Txt v="caption" muted>
                {p.responsavel} · prazo {formatDate(p.prazo)} {p.prazoHora || ''}
              </Txt>
            </Card>
          );
        })
      ) : (
        <Banner tone="success" message="Nenhuma pendência de criticidade alta ou crítica em aberto." />
      )}

      <TituloSecao>Atalhos</TituloSecao>
      <Grade>
        <Atalho icon="office-building-plus-outline" label="Nova obra" onPress={() => nav.navigate('ObraForm')} />
        <Atalho icon="account-multiple-outline" label="Usuários e permissões" onPress={() => nav.navigate('Users')} />
        <Atalho icon="chart-box-outline" label="Relatórios e indicadores" onPress={() => nav.navigate('Reports')} />
        <Atalho icon="folder-outline" label="Central de arquivos" onPress={() => nav.navigate('Files')} />
      </Grade>

      <TituloSecao acao="Auditoria" onAcao={() => nav.navigate('Audit')}>
        Atividade recente
      </TituloSecao>
      <Card style={{ gap: 12 }}>
        {d.eventos.map((e) => (
          <Pressable key={e.id} onPress={() => nav.navigate('RdoDetail', { rdoId: e.rdo.id, tab: 'historico' })} accessibilityRole="button" style={styles.evento}>
            <Avatar nome={nomeUsuario(state, e.usuarioId)} size={32} />
            <View style={{ flex: 1 }}>
              <Txt v="smallStrong" numberOfLines={1}>
                {EVENTOS_AUDITORIA[e.evento]?.label || e.evento}
              </Txt>
              <Txt v="caption" muted numberOfLines={1}>
                {nomeUsuario(state, e.usuarioId)} · RDO nº {numeroFormatado(e.rdo)} · {tempoRelativo(e.dataHora, now)}
              </Txt>
            </View>
          </Pressable>
        ))}
      </Card>
    </Screen>
  );
}

function Atalho({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.atalho, pressed && { opacity: 0.85 }]}>
      <View style={styles.atalhoIcon}>
        <Icon name={icon} size={24} color={colors.navy700} />
      </View>
      <Txt v="smallStrong" style={{ flex: 1 }} numberOfLines={2}>
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy700, borderRadius: radius.xl, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.navy600 },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  heroNum: { fontSize: 64, lineHeight: 70, letterSpacing: -2 },
  heroAlert: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  vencida: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.dangerBg, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  evento: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44 },
  atalho: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, minHeight: 64 },
  atalhoIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
});
