import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { CONTEXTOS_COMENTARIO, EVENTOS_AUDITORIA, PERFIS } from '../../constants';
import { formatDateTime } from '../../utils/date';
import { Avatar, Badge, Icon, Txt } from '../ui';

const TIPO_COMENTARIO = {
  devolucao: { label: 'Devolução', color: colors.warning, bg: colors.warningBg, icon: 'undo-variant' },
  esclarecimento: { label: 'Esclarecimento', color: colors.info, bg: colors.infoBg, icon: 'help-circle-outline' },
  resposta: { label: 'Resposta', color: colors.success, bg: colors.successBg, icon: 'message-reply-text-outline' },
  sistema: { label: 'Sistema', color: colors.gray, bg: colors.grayBg, icon: 'information-outline' },
};

// Comentário em contexto (RF-12): mostra a seção/foto a que se refere e a visibilidade (interno × cliente).
export function CommentItem({ comentario, nome, fotos }) {
  const t = TIPO_COMENTARIO[comentario.tipo];
  let contexto = CONTEXTOS_COMENTARIO.find((c) => c.value === comentario.contexto)?.label;
  if (comentario.contexto === 'fotos' && comentario.contextoRef) {
    const f = fotos?.find((x) => x.id === comentario.contextoRef);
    if (f) contexto = `Fotos › Foto ${String(f.numero).padStart(2, '0')}`;
  }
  return (
    <View style={[styles.comment, comentario.tipo === 'devolucao' && { borderColor: colors.warning }]}>
      <View style={styles.head}>
        <Avatar nome={nome} size={34} />
        <View style={{ flex: 1 }}>
          <Txt v="smallStrong" numberOfLines={1}>
            {nome}
          </Txt>
          <Txt v="caption" muted>
            {PERFIS[comentario.papel]?.label} · {formatDateTime(comentario.dataHora)}
          </Txt>
        </View>
        {t ? <Badge label={t.label} color={t.color} bg={t.bg} icon={t.icon} size="sm" /> : null}
      </View>
      {contexto && comentario.contexto !== 'geral' ? (
        <View style={styles.ctx}>
          <Icon name="link-variant" size={12} color={colors.navy600} />
          <Txt v="caption" color={colors.navy600} style={{ fontWeight: '800' }}>
            {contexto}
          </Txt>
        </View>
      ) : null}
      <Txt v="body">{comentario.texto}</Txt>
      <View style={styles.vis}>
        <Icon name={comentario.visibilidade === 'cliente' ? 'eye-outline' : 'lock-outline'} size={12} color={colors.textSubtle} />
        <Txt v="caption" subtle>
          {comentario.visibilidade === 'cliente' ? 'Visível ao cliente' : 'Interno (master e operacional)'}
        </Txt>
      </View>
    </View>
  );
}

// Linha da trilha de auditoria (RF-19): evento, ator, data/hora, versão e, quando houver, antes/depois.
export function AuditItem({ evento, nome, papel, ultimo }) {
  const meta = EVENTOS_AUDITORIA[evento.evento] || { label: evento.evento, icone: 'circle-small' };
  return (
    <View style={styles.audit}>
      <View style={styles.rail}>
        <View style={styles.dot}>
          <Icon name={meta.icone} size={16} color={colors.navy700} />
        </View>
        {!ultimo ? <View style={styles.trilho} /> : null}
      </View>
      <View style={{ flex: 1, paddingBottom: 14, gap: 2 }}>
        <Txt v="smallStrong">{meta.label}</Txt>
        <Txt v="caption" muted>
          {nome}
          {papel ? ` (${PERFIS[papel]?.label})` : ''} · {formatDateTime(evento.dataHora)} · v{evento.versao ?? 1}
        </Txt>
        {evento.detalhe ? (
          <Txt v="small" muted numberOfLines={4}>
            {evento.detalhe}
          </Txt>
        ) : null}
        {evento.meta?.alteracoes?.length ? (
          <View style={styles.diff}>
            <Txt v="caption" color={colors.goldText} style={{ fontWeight: '800' }}>
              Alterações (antes → depois)
            </Txt>
            {evento.meta.alteracoes.map((a, i) => (
              <Txt key={i} v="caption" color={colors.goldText}>
                • {a.caminho}: {a.antes} → {a.depois}
              </Txt>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 12, gap: 8 },
  head: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  ctx: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', backgroundColor: colors.blue100, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  vis: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  audit: { flexDirection: 'row', gap: 12 },
  rail: { alignItems: 'center', width: 32 },
  dot: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
  trilho: { flex: 1, width: 2, backgroundColor: colors.border, marginTop: 2 },
  diff: { backgroundColor: colors.gold50, borderRadius: 8, padding: 8, gap: 2, marginTop: 4 },
});
