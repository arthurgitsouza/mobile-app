import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, statusMeta } from '../../theme';
import { atrasoDeAcao } from '../../domain/workflow';
import { resumoEquipamentos, totalTrabalhadores, numeroFormatado } from '../../domain/rdo';
import { formatDateShort, nomeDiaCurto, formatDateTime, tempoRelativo } from '../../utils/date';
import { Card, Icon, StatusBadge, Txt } from '../ui';

function Contagem({ icon, valor, label }) {
  return (
    <View style={styles.count} accessible accessibilityLabel={`${valor} ${label}`}>
      <Icon name={icon} size={15} color={colors.textMuted} />
      <Txt v="smallStrong" muted>
        {valor}
      </Txt>
    </View>
  );
}

// Cartão de RDO nas listas: número, status, obra/data/turno, resumo de recursos e alertas de prazo.
export default function RdoCard({ rdo, obra, onPress, showObra = true, agora, autorNome, config }) {
  const meta = statusMeta[rdo.status];
  const nowMs = new Date(agora || Date.now()).getTime();
  const atraso = atrasoDeAcao(rdo, nowMs, { master: config?.masterHoras || 24, cliente: config?.clienteHoras?.[0] || 24 });
  const ocorr = rdo.ocorrencias?.length || 0;
  const turno = { diurno: 'Diurno', noturno: 'Noturno', misto: 'Misto' }[rdo.turno] || rdo.turno;

  return (
    <Card
      onPress={onPress}
      padded={false}
      accessibilityLabel={`RDO ${numeroFormatado(rdo)}${showObra && obra ? `, ${obra.nome}` : ''}, ${meta.label}`}
      style={styles.card}
    >
      <View style={[styles.bar, { backgroundColor: meta.color }]} />
      <View style={styles.body}>
        <View style={styles.top}>
          <Txt v="h3" style={{ flex: 1 }} numberOfLines={1}>
            RDO nº {numeroFormatado(rdo)}
            {rdo.versao > 1 ? <Txt v="smallStrong" muted>{`  v${rdo.versao}`}</Txt> : null}
          </Txt>
          <StatusBadge status={rdo.status} size="sm" />
        </View>
        <Txt v="small" muted numberOfLines={1}>
          {showObra && obra ? `${obra.nome} · ` : ''}
          {nomeDiaCurto(rdo.data)}, {formatDateShort(rdo.data)} · {turno}
          {autorNome ? ` · ${autorNome}` : ''}
        </Txt>
        <View style={styles.counts}>
          <Contagem icon="account-group-outline" valor={totalTrabalhadores(rdo)} label="trabalhadores" />
          <Contagem icon="excavator" valor={resumoEquipamentos(rdo).unidades} label="equipamentos" />
          <Contagem icon="camera-outline" valor={rdo.fotos?.length || 0} label="fotos" />
          {ocorr ? <Contagem icon="alert-octagon-outline" valor={ocorr} label="ocorrências" /> : null}
          {rdo.sync?.pendente ? (
            <View style={[styles.flag, { backgroundColor: colors.warningBg }]}>
              <Icon name="cloud-off-outline" size={13} color={colors.warning} />
              <Txt v="caption" color={colors.warning} style={{ fontWeight: '800' }}>
                Aguardando envio
              </Txt>
            </View>
          ) : null}
        </View>
        {rdo.status === 'devolvido' && rdo.devolucao ? (
          <Aviso tone="warning" icon="undo-variant" texto={`Corrigir até ${formatDateTime(rdo.devolucao.prazo)}: ${rdo.devolucao.motivo}`} />
        ) : null}
        {rdo.esclarecimentoPendente ? <Aviso tone="info" icon="help-circle-outline" texto="Cliente solicitou esclarecimento" /> : null}
        {atraso && atraso.responsavel !== 'operacional' ? (
          <Aviso tone="danger" icon="clock-alert-outline" texto={`Prazo sugerido excedido: ${atraso.horas} h ${atraso.responsavel === 'master' ? 'sem análise' : 'sem ciência do cliente'}`} />
        ) : null}
        {atraso && atraso.responsavel === 'operacional' ? <Aviso tone="danger" icon="clock-alert-outline" texto="Prazo de correção vencido" /> : null}
        {rdo.status === 'submetido' && rdo.submetidoEm && !atraso ? (
          <Txt v="caption" subtle>
            Enviado {tempoRelativo(rdo.submetidoEm, agora)}
          </Txt>
        ) : null}
      </View>
    </Card>
  );
}

function Aviso({ tone, icon, texto }) {
  const c = tone === 'danger' ? colors.danger : tone === 'warning' ? colors.warning : colors.info;
  const bg = tone === 'danger' ? colors.dangerBg : tone === 'warning' ? colors.warningBg : colors.infoBg;
  return (
    <View style={[styles.aviso, { backgroundColor: bg }]}>
      <Icon name={icon} size={15} color={c} />
      <Txt v="caption" color={c} style={{ flex: 1, fontWeight: '700' }} numberOfLines={2}>
        {texto}
      </Txt>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', overflow: 'hidden' },
  bar: { width: 5 },
  body: { flex: 1, padding: 12, gap: 6 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  counts: { flexDirection: 'row', alignItems: 'center', gap: 14, flexWrap: 'wrap' },
  count: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  flag: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  aviso: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8, borderRadius: 8 },
});
