import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, statusMeta } from '../../theme';
import { ETAPAS_FLUXO } from '../../constants';
import { etapaAtual } from '../../domain/workflow';
import { Icon, Txt } from '../ui';

const CURTO = { rascunho: 'Rascunho', submetido: 'Enviado', em_analise: 'Análise', validado: 'Validado', enviado_cliente: 'Cliente', ciencia: 'Ciência', finalizado: 'Final' };

// Linha do fluxo do RDO (seção 5): Rascunho → … → Finalizado. Estados de exceção aparecem como aviso.
export default function WorkflowTimeline({ rdo }) {
  const atual = etapaAtual(rdo);
  const finalizado = rdo.status === 'finalizado';
  const excecao = ['cancelado', 'retificado'].includes(rdo.status);
  const devolvido = rdo.status === 'devolvido';
  const n = ETAPAS_FLUXO.length;
  const meta = statusMeta[rdo.status];

  return (
    <View accessible accessibilityLabel={`Fluxo do RDO: etapa ${atual + 1} de ${n}. Situação: ${meta.label}.`}>
      <View style={styles.row}>
        {ETAPAS_FLUXO.map((e, i) => {
          const feito = i < atual || finalizado || (excecao && i <= atual);
          const corrente = i === atual && !finalizado && !excecao;
          const cor = devolvido && corrente ? colors.warning : excecao ? colors.textSubtle : colors.navy700;
          return (
            <View key={e.key} style={styles.step}>
              <View style={styles.dotRow}>
                <View style={[styles.line, { opacity: i === 0 ? 0 : 1 }, i <= atual || finalizado ? { backgroundColor: cor } : null]} />
                <View
                  style={[
                    styles.dot,
                    feito && { backgroundColor: cor, borderColor: cor },
                    corrente && { borderColor: cor, backgroundColor: colors.white, borderWidth: 3 },
                    finalizado && { backgroundColor: colors.success, borderColor: colors.success },
                  ]}
                >
                  {feito || finalizado ? <Icon name="check" size={13} color={colors.white} /> : corrente && devolvido ? <Icon name="undo-variant" size={12} color={colors.warning} /> : null}
                </View>
                <View style={[styles.line, { opacity: i === n - 1 ? 0 : 1 }, i < atual || finalizado ? { backgroundColor: cor } : null]} />
              </View>
              <Txt v="caption" numberOfLines={1} color={corrente ? cor : colors.textMuted} style={[styles.label, corrente && { fontWeight: '800' }]}>
                {CURTO[e.key]}
              </Txt>
            </View>
          );
        })}
      </View>
      {excecao ? (
        <View style={[styles.note, { backgroundColor: meta.bg }]}>
          <Icon name={meta.icon} size={16} color={meta.color} />
          <Txt v="smallStrong" color={meta.color}>
            {rdo.status === 'retificado' ? 'Versão substituída por retificação (histórico preservado)' : 'RDO cancelado (histórico preservado)'}
          </Txt>
        </View>
      ) : devolvido ? (
        <View style={[styles.note, { backgroundColor: meta.bg }]}>
          <Icon name="undo-variant" size={16} color={meta.color} />
          <Txt v="smallStrong" color={meta.color}>
            Devolvido ao operacional para correção
          </Txt>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  step: { flex: 1, alignItems: 'center', gap: 4 },
  dotRow: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 3, backgroundColor: colors.border },
  dot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.borderStrong, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 10.5, textAlign: 'center' },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, padding: 10, borderRadius: 10 },
});
