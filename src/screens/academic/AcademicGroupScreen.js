import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { notaFinal } from '../../data/seedAcademico';
import { formatDateTime } from '../../utils/date';
import { formatNumber, toNumber } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Badge, Banner, BottomSheet, Button, Card, EmptyState, Icon, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { NumberField, TextField } from '../../components/form';
import { mediaDoGrupo } from './AcademicScreen';

const STATUS = {
  pendente: { label: 'Pendente', color: colors.gray, bg: colors.grayBg, icon: 'clock-outline' },
  em_avaliacao: { label: 'Em avaliação', color: colors.info, bg: colors.infoBg, icon: 'progress-clock' },
  avaliada: { label: 'Avaliada', color: colors.success, bg: colors.successBg, icon: 'check-circle-outline' },
};

// Entregas de um grupo por fase, com histórico de versões, notas por critério e comentário do professor.
export default function AcademicGroupScreen({ route, navigation }) {
  const { grupoId } = route.params;
  const { state, actions, currentUser } = useApp();
  const { toast } = useUI();
  const grupo = state.academico.grupos.find((g) => g.id === grupoId);
  const { criterios, fases } = state.academico;
  const [faseId, setFaseId] = useState(null);
  const [notas, setNotas] = useState({});
  const [comentario, setComentario] = useState('');
  const [erro, setErro] = useState('');

  if (!grupo || currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Grupo" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const entrega = faseId ? grupo.entregas.find((e) => e.faseId === faseId) : null;
  const fase = faseId ? fases.find((f) => f.id === faseId) : null;
  const media = mediaDoGrupo(grupo, criterios);
  const previa = notaFinal(Object.fromEntries(Object.entries(notas).filter(([, v]) => v !== '').map(([k, v]) => [k, toNumber(v)])), criterios);

  const abrir = (f) => {
    const e = grupo.entregas.find((x) => x.faseId === f.id);
    setNotas(Object.fromEntries(criterios.map((c) => [c.id, e.notas?.[c.id] != null ? String(e.notas[c.id]).replace('.', ',') : ''])));
    setComentario(e.comentario || '');
    setErro('');
    setFaseId(f.id);
  };

  const salvar = () => {
    const valores = {};
    for (const c of criterios) {
      const v = toNumber(notas[c.id]);
      if (notas[c.id] === '' || v < 0 || v > 10) return setErro(`Informe a nota de “${c.nome}” entre 0 e 10.`);
      valores[c.id] = v;
    }
    actions.salvarAvaliacao({ grupoId, faseId, notas: valores, comentario: comentario.trim() });
    haptic.success();
    toast.show({ type: 'success', title: 'Avaliação salva', message: `${grupo.nome} · fase ${faseId}` });
    setFaseId(null);
    return undefined;
  };

  const registrarEntrega = () => {
    const arquivo = `fase${faseId}_${grupo.id}_v${(entrega.versoes.length || 0) + 1}.pdf`;
    actions.registrarEntregaAcademica({ grupoId, faseId, arquivo });
    toast.show({ type: 'success', title: 'Entrega registrada (simulado)', message: arquivo });
    setFaseId(null);
  };

  return (
    <Screen title={grupo.nome} subtitle={grupo.integrantes.join(' · ')} back>
      <Card tone="soft" style={styles.row}>
        <View style={{ flex: 1 }}>
          <Txt v="caption" muted>
            Média ponderada
          </Txt>
          <Txt v="h1">{media != null ? formatNumber(media, 1) : '—'}</Txt>
        </View>
        <View style={{ flex: 1 }}>
          <Txt v="caption" muted>
            Avaliadas
          </Txt>
          <Txt v="h1">
            {grupo.entregas.filter((e) => e.status === 'avaliada').length}/{fases.length}
          </Txt>
        </View>
      </Card>

      <SectionTitle>Entregas por fase</SectionTitle>
      {fases.map((f) => {
        const e = grupo.entregas.find((x) => x.faseId === f.id);
        const s = STATUS[e.status];
        const nf = e.status === 'avaliada' ? notaFinal(e.notas, criterios) : null;
        return (
          <Card key={f.id} onPress={() => abrir(f)} style={{ gap: 6 }} accessibilityLabel={`Fase ${f.id}, ${f.titulo}, ${s.label}${nf != null ? `, nota ${nf}` : ''}`}>
            <View style={styles.row}>
              <View style={styles.num}>
                <Txt v="smallStrong" color={colors.white}>
                  {f.id}
                </Txt>
              </View>
              <Txt v="bodyStrong" style={{ flex: 1 }} numberOfLines={2}>
                {f.titulo}
              </Txt>
              {nf != null ? <Txt v="h3">{formatNumber(nf, 1)}</Txt> : null}
            </View>
            <View style={styles.row}>
              <Badge label={s.label} color={s.color} bg={s.bg} icon={s.icon} size="sm" />
              <Txt v="caption" muted style={{ flex: 1 }}>
                {e.versoes.length ? `${e.versoes.length} versão(ões) · última ${formatDateTime(e.versoes[e.versoes.length - 1].data)}` : 'Sem entrega'}
              </Txt>
              <Icon name="chevron-right" size={20} color={colors.textSubtle} />
            </View>
          </Card>
        );
      })}

      <BottomSheet
        visible={!!faseId}
        onClose={() => setFaseId(null)}
        title={fase ? `Fase ${fase.id} — ${fase.titulo}` : ''}
        subtitle={fase?.conteudo}
        fullHeight
        footer={
          entrega && entrega.status !== 'pendente' ? (
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancelar" variant="secondary" onPress={() => setFaseId(null)} style={{ flex: 1 }} />
              <Button title="Salvar avaliação" icon="check" onPress={salvar} style={{ flex: 1.5 }} />
            </View>
          ) : (
            <Button title="Registrar entrega (simulado)" icon="upload-outline" onPress={registrarEntrega} />
          )
        }
      >
        {entrega ? (
          <>
            <SectionTitle>Histórico de versões</SectionTitle>
            {entrega.versoes.length ? (
              entrega.versoes.map((v) => (
                <View key={v.numero} style={styles.versao}>
                  <Icon name="file-document-outline" size={20} color={colors.navy600} />
                  <View style={{ flex: 1 }}>
                    <Txt v="smallStrong">
                      v{v.numero} · {v.arquivo}
                    </Txt>
                    <Txt v="caption" muted>
                      {formatDateTime(v.data)}
                      {v.comentario ? ` · ${v.comentario}` : ''}
                    </Txt>
                  </View>
                </View>
              ))
            ) : (
              <Banner tone="neutral" message="O grupo ainda não entregou esta fase." />
            )}

            {entrega.status !== 'pendente' ? (
              <>
                <SectionTitle>Notas por critério (0–10)</SectionTitle>
                {criterios.map((c) => (
                  <NumberField key={c.id} label={`${c.nome} (${c.peso}%)`} value={notas[c.id]} onChangeText={(t) => { setNotas((n) => ({ ...n, [c.id]: t })); setErro(''); }} suffix="/10" placeholder="0–10" />
                ))}
                <Card tone="soft" style={styles.row}>
                  <Txt v="bodyStrong" style={{ flex: 1 }}>
                    Nota final ponderada
                  </Txt>
                  <Txt v="h2">{previa != null ? formatNumber(previa, 1) : '—'}</Txt>
                </Card>
                <TextField label="Comentário do professor" multiline value={comentario} onChangeText={setComentario} placeholder="Pontos fortes e melhorias solicitadas…" />
                {erro ? <Banner tone="danger" message={erro} /> : null}
              </>
            ) : null}
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  num: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center' },
  versao: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: 10, backgroundColor: colors.blue50 },
});
