import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { colors, radius } from '../../theme';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import { notificacoesDe } from '../../domain/selectors';
import { CANAIS, STATUS_ENTREGA, TIPOS_NOTIFICACAO, temFalhaDeEntrega } from '../../domain/notificacoes';
import { numeroFormatado } from '../../domain/rdo';
import { emailCliente } from '../../constants/texts';
import { PERFIL } from '../../constants';
import { dateFromISO, formatDate, formatDateTime, hojeObra, addDays, tempoRelativo } from '../../utils/date';
import { Badge, Banner, BottomSheet, Button, Card, EmptyState, Icon, IconButton, KeyValue, Screen, SegmentedTabs, StatusBadge, Txt, useUI } from '../../components/ui';

const COR = { info: [colors.info, colors.infoBg], warning: [colors.warning, colors.warningBg], teal: [colors.teal, colors.tealBg], success: [colors.success, colors.successBg], danger: [colors.danger, colors.dangerBg], gold: [colors.goldText, colors.gold100], gray: [colors.gray, colors.grayBg] };

// Notificações (seção 10): cada item indica obra, RDO, status, prazo e acesso direto ao registro.
export default function NotificationsScreen() {
  const nav = useNavigation();
  const isTab = useNavigationState((s) => s.type === 'tab');
  const { state, actions, currentUser } = useApp();
  const { toast } = useUI();
  const now = useNow();
  const [filtro, setFiltro] = useState('todas');
  const [abertaId, setAbertaId] = useState(null);
  const [email, setEmail] = useState(false);

  const todas = useMemo(() => notificacoesDe(state, currentUser), [state, currentUser]);
  const naoLidas = todas.filter((n) => !n.lida).length;
  const lista = filtro === 'nao_lidas' ? todas.filter((n) => !n.lida) : todas;
  const aberta = todas.find((n) => n.id === abertaId);
  const hoje = hojeObra(now);

  const grupos = useMemo(() => {
    const out = [];
    lista.forEach((n) => {
      const d = dateFromISO(n.dataHora);
      const rotulo = d === hoje ? 'Hoje' : d === addDays(hoje, -1) ? 'Ontem' : formatDate(d);
      const g = out.find((x) => x.rotulo === rotulo);
      if (g) g.itens.push(n);
      else out.push({ rotulo, itens: [n] });
    });
    return out;
  }, [lista, hoje]);

  const abrir = (n) => {
    actions.marcarNotificacaoLida({ id: n.id });
    setEmail(false);
    setAbertaId(n.id);
  };

  const irParaRegistro = (n) => {
    setAbertaId(null);
    if (n.rdoId && state.rdos.some((r) => r.id === n.rdoId)) nav.navigate('RdoDetail', { rdoId: n.rdoId });
    else if (n.obraId) nav.navigate('ObraDetail', { obraId: n.obraId });
  };

  const obraNome = (id) => state.obras.find((o) => o.id === id)?.nome;
  const rdoDe = (n) => state.rdos.find((r) => r.id === n.rdoId);

  return (
    <Screen
      title="Notificações"
      subtitle={naoLidas ? `${naoLidas} não ${naoLidas === 1 ? 'lida' : 'lidas'}` : 'Tudo lido'}
      tab={isTab}
      back={!isTab}
      right={naoLidas ? <IconButton icon="check-all" label="Marcar todas como lidas" color={colors.white} onPress={() => actions.marcarTodasLidas({ userId: currentUser.id })} /> : undefined}
      headerExtra={
        <SegmentedTabs
          compact
          style={{ marginTop: 8 }}
          items={[{ key: 'todas', label: 'Todas', count: todas.length }, { key: 'nao_lidas', label: 'Não lidas', count: naoLidas }]}
          value={filtro}
          onChange={setFiltro}
        />
      }
    >
      {lista.length === 0 ? <EmptyState icon="bell-check-outline" title={filtro === 'nao_lidas' ? 'Nenhuma notificação não lida' : 'Sem notificações'} message="Avisos sobre envio, análise, devolução, assinatura e prazos aparecem aqui e por push/e-mail." /> : null}

      {grupos.map((g) => (
        <View key={g.rotulo} style={{ gap: 8 }}>
          <Txt v="label" color={colors.navy600}>
            {g.rotulo.toUpperCase()}
          </Txt>
          {g.itens.map((n) => {
            const t = TIPOS_NOTIFICACAO[n.tipo] || TIPOS_NOTIFICACAO.sistema;
            const [fg, bg] = COR[t.cor] || COR.gray;
            const vencido = n.prazo && new Date(n.prazo).getTime() < new Date(now).getTime();
            const rdo = rdoDe(n);
            return (
              <Pressable
                key={n.id}
                onPress={() => abrir(n)}
                accessibilityRole="button"
                accessibilityLabel={`${n.lida ? '' : 'Não lida. '}${n.titulo}. ${n.mensagem}`}
                style={({ pressed }) => [styles.item, !n.lida && styles.naoLida, pressed && { opacity: 0.9 }]}
              >
                <View style={[styles.icone, { backgroundColor: bg }]}>
                  <Icon name={t.icone} size={22} color={fg} />
                </View>
                <View style={{ flex: 1, gap: 4 }}>
                  <View style={styles.top}>
                    <Txt v={n.lida ? 'bodyStrong' : 'bodyStrong'} style={{ flex: 1, fontWeight: n.lida ? '600' : '800' }} numberOfLines={2}>
                      {n.titulo}
                    </Txt>
                    {!n.lida ? <View style={styles.dot} accessibilityLabel="Não lida" /> : null}
                  </View>
                  <Txt v="small" muted numberOfLines={3}>
                    {n.mensagem}
                  </Txt>
                  <View style={styles.meta}>
                    {n.obraId ? <Badge label={obraNome(n.obraId) || 'Obra'} color={colors.navy700} bg={colors.blue100} icon="office-building-outline" size="sm" /> : null}
                    {rdo ? <Badge label={`RDO ${numeroFormatado(rdo)}`} color={colors.navy700} bg={colors.blue100} icon="file-document-outline" size="sm" /> : null}
                    {n.rdoStatus ? <StatusBadge status={rdo?.status || n.rdoStatus} size="sm" /> : null}
                    {n.prazo ? <Badge label={`${vencido ? 'Prazo vencido' : 'Prazo'}: ${formatDateTime(n.prazo)}`} color={vencido ? colors.danger : colors.textMuted} bg={vencido ? colors.dangerBg : colors.grayBg} icon="clock-outline" size="sm" /> : null}
                    {temFalhaDeEntrega(n) && !n.resolvida ? <Badge label="Falha de entrega" color={colors.danger} bg={colors.dangerBg} icon="email-alert-outline" size="sm" /> : null}
                  </View>
                  <Txt v="caption" subtle>
                    {tempoRelativo(n.dataHora, now)}
                  </Txt>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}

      <BottomSheet visible={!!aberta} onClose={() => setAbertaId(null)} title={aberta?.titulo || ''} subtitle={aberta ? formatDateTime(aberta.dataHora) : undefined} fullHeight>
        {aberta ? (
          <>
            <Txt v="body">{aberta.mensagem}</Txt>
            <Card tone="soft" style={{ gap: 8 }}>
              <KeyValue inline label="Obra" value={obraNome(aberta.obraId)} />
              <KeyValue inline label="RDO" value={rdoDe(aberta) ? `nº ${numeroFormatado(rdoDe(aberta))} · v${rdoDe(aberta).versao}` : '—'} />
              <KeyValue inline label="Situação" value={aberta.rdoStatus ? undefined : '—'}>
                {aberta.rdoStatus ? <StatusBadge status={rdoDe(aberta)?.status || aberta.rdoStatus} size="sm" /> : null}
              </KeyValue>
              <KeyValue inline label="Prazo" value={aberta.prazo ? formatDateTime(aberta.prazo) : 'Sem prazo definido'} />
            </Card>

            {aberta.tipo === 'falha_entrega' && !aberta.resolvida ? (
              <Banner tone="danger" icon="email-alert-outline" title="Falha na entrega do e-mail" message="O push foi entregue, mas o e-mail não. Você pode reenviar agora.">
                <View style={{ marginTop: 8 }}>
                  <Button
                    title="Reenviar e-mail"
                    icon="email-fast-outline"
                    variant="dangerSolid"
                    size="sm"
                    full={false}
                    onPress={() => {
                      actions.reenviarEntrega({ notificacaoId: aberta.id, userId: currentUser.id });
                      toast.show({ type: 'success', title: 'E-mail reenviado', message: 'Entrega confirmada (simulada).' });
                    }}
                  />
                </View>
              </Banner>
            ) : null}

            <View style={{ gap: 8 }}>
              <Txt v="label" color={colors.navy600}>
                CANAIS DE ENTREGA
              </Txt>
              {aberta.entregas.map((e) => {
                const c = CANAIS[e.canal];
                const s = STATUS_ENTREGA[e.status] || STATUS_ENTREGA.pendente;
                const [fg, bg] = COR[s.cor] || COR.gray;
                return (
                  <View key={e.canal} style={styles.canal}>
                    <Icon name={c.icone} size={20} color={colors.navy600} />
                    <Txt v="small" style={{ flex: 1 }}>
                      {c.label}
                    </Txt>
                    <Badge label={s.label} color={fg} bg={bg} size="sm" />
                  </View>
                );
              })}
            </View>

            {aberta.tipo === 'rdo_validado' && currentUser.perfil !== PERFIL.OPERACIONAL && rdoDe(aberta) ? (
              <View style={{ gap: 8 }}>
                <Button title={email ? 'Ocultar e-mail simulado' : 'Ver e-mail enviado (simulado)'} icon="email-outline" variant="tonal" size="sm" onPress={() => setEmail((v) => !v)} />
                {email ? <EmailPreview n={aberta} rdo={rdoDe(aberta)} obra={state.obras.find((o) => o.id === aberta.obraId)} destino={state.users.find((u) => u.id === aberta.usuarioId)} /> : null}
              </View>
            ) : null}

            <Button title={aberta.rdoId ? 'Abrir o RDO' : 'Abrir a obra'} icon="open-in-new" onPress={() => irParaRegistro(aberta)} />
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

function EmailPreview({ n, rdo, obra, destino }) {
  const e = emailCliente({
    nomeCliente: destino?.nome?.split(' ')[0] || 'cliente',
    rdoNum: `nº ${numeroFormatado(rdo)}`,
    obra: obra?.nome,
    dataFmt: formatDate(rdo.data),
    versao: rdo.versao,
    prazoFmt: n.prazo ? formatDateTime(n.prazo) : '24 horas',
  });
  return (
    <View style={styles.email}>
      <Txt v="caption" muted>
        Para: {destino?.email}
      </Txt>
      <Txt v="smallStrong">Assunto: {e.assunto}</Txt>
      <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: 6 }} />
      <Txt v="small">{e.corpo}</Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  item: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: radius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  naoLida: { borderColor: colors.navy600, backgroundColor: colors.blue50 },
  icone: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.gold500 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  canal: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 },
  email: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 12, gap: 4, backgroundColor: colors.white },
});
