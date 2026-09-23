import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { notaFinal } from '../../data/seedAcademico';
import { formatNumber } from '../../utils/format';
import { Badge, Banner, Card, EmptyState, Icon, ProgressBar, Screen, SectionTitle, Txt } from '../../components/ui';

export function mediaDoGrupo(grupo, criterios) {
  const notas = grupo.entregas.filter((e) => e.status === 'avaliada').map((e) => notaFinal(e.notas, criterios)).filter((n) => n != null);
  return notas.length ? Math.round((notas.reduce((a, b) => a + b, 0) / notas.length) * 10) / 10 : null;
}

// Módulo acadêmico opcional (RF-20): entregas dos grupos, critérios, notas, comentários e versões.
export default function AcademicScreen({ navigation }) {
  const { state, currentUser } = useApp();
  const { grupos, criterios, fases } = state.academico;

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Acadêmico" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" />
      </Screen>
    );
  }

  const ordenados = [...grupos].sort((a, b) => (mediaDoGrupo(b, criterios) ?? -1) - (mediaDoGrupo(a, criterios) ?? -1));

  return (
    <Screen title="Módulo acadêmico" subtitle="Avaliação das entregas · opcional" back>
      <Banner tone="info" icon="school-outline" message="Acompanhe as 10 entregas de cada grupo (seção 16), avalie por critérios ponderados e registre comentários e versões. A decisão de manter este módulo no app ou em um painel separado está em aberto (seção 20)." />

      <SectionTitle>Grupos (por média)</SectionTitle>
      {ordenados.map((g, i) => {
        const avaliadas = g.entregas.filter((e) => e.status === 'avaliada').length;
        const emAval = g.entregas.filter((e) => e.status === 'em_avaliacao').length;
        const media = mediaDoGrupo(g, criterios);
        return (
          <Card key={g.id} onPress={() => navigation.navigate('AcademicGroup', { grupoId: g.id })} style={{ gap: 10 }} accessibilityLabel={`${g.nome}, média ${media ?? 'sem nota'}, ${avaliadas} de ${fases.length} avaliadas`}>
            <View style={styles.row}>
              <View style={styles.pos}>
                <Txt v="bodyStrong" color={colors.white}>
                  {i + 1}º
                </Txt>
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{g.nome}</Txt>
                <Txt v="caption" muted numberOfLines={1}>
                  {g.integrantes.join(' · ')}
                </Txt>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Txt v="h2">{media != null ? formatNumber(media, 1) : '—'}</Txt>
                <Txt v="caption" muted>
                  média
                </Txt>
              </View>
            </View>
            <ProgressBar value={(avaliadas / fases.length) * 100} label={`${avaliadas} de ${fases.length} entregas avaliadas`} />
            <View style={styles.row}>
              <Txt v="caption" muted style={{ flex: 1 }}>
                {avaliadas} de {fases.length} avaliadas
              </Txt>
              {emAval ? <Badge label={`${emAval} aguardando avaliação`} color={colors.info} bg={colors.infoBg} icon="progress-clock" size="sm" /> : null}
              <Icon name="chevron-right" size={20} color={colors.textSubtle} />
            </View>
          </Card>
        );
      })}

      <SectionTitle>Critérios de avaliação (peso)</SectionTitle>
      <Card style={{ gap: 10 }}>
        {criterios.map((c) => (
          <View key={c.id} style={styles.row}>
            <Txt v="small" style={{ flex: 1 }}>
              {c.nome}
            </Txt>
            <Badge label={`${c.peso}%`} color={colors.navy700} bg={colors.blue100} size="sm" />
          </View>
        ))}
        <Txt v="caption" muted>
          Baseados na declaração final do documento: aderência ao fluxo de obra, consistência dos dados, segurança, rastreabilidade, funcionamento em condições reais e clareza da documentação.
        </Txt>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pos: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center' },
});
