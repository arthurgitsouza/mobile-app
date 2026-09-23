import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius } from '../../theme';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import useCriarRdo from '../../hooks/useCriarRdo';
import { ehDiaUtil, obrasVisiveis, rdoDaData } from '../../domain/selectors';
import { validarRdo } from '../../domain/validation';
import { numeroFormatado } from '../../domain/rdo';
import { formatDateLong, formatDateTime, formatTime, hojeObra, horaAgoraObra, nomeDiaSemana, timeToMinutes } from '../../utils/date';
import { capitalizar } from '../../utils/format';
import { Banner, Button, Card, Icon, ProgressRing, Screen, SyncBanner, StatusBadge, Txt } from '../../components/ui';
import { RdoCard } from '../../components/rdo';
import { DataDeHoje, TituloSecao, tituloBoasVindas } from './shared';

export default function OperacionalHome() {
  const nav = useNavigation();
  const { state, currentUser } = useApp();
  const now = useNow();
  const hoje = hojeObra(now);
  const criar = useCriarRdo();
  const obras = obrasVisiveis(state, currentUser).filter((o) => o.status === 'ativa');
  const cfg = state.settings.lembretes;
  const passouDoLimite = timeToMinutes(horaAgoraObra(now)) >= timeToMinutes(cfg.operacionalFimDia);

  const meus = state.rdos.filter((r) => r.autorId === currentUser.id && !['retificado', 'cancelado'].includes(r.status)).sort((a, b) => (a.data < b.data ? 1 : -1));
  const atencao = meus.filter((r) => r.status === 'devolvido' || (r.status === 'rascunho' && r.data < hoje));
  const recentes = meus.filter((r) => !atencao.includes(r)).slice(0, 4);
  const obraDe = (r) => state.obras.find((o) => o.id === r.obraId);

  return (
    <Screen title="Início" subtitle={tituloBoasVindas(currentUser)} tab bell>
      <DataDeHoje />
      <SyncBanner />

      {obras.map((obra) => {
        const rdo = rdoDaData(state, obra.id, hoje);
        const util = ehDiaUtil(obra, hoje);
        const v = rdo ? validarRdo(rdo, { obra, rdos: state.rdos }) : null;
        const pct = v ? Math.round((v.progresso.completos / v.progresso.total) * 100) : 0;
        return (
          <View key={obra.id} style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Txt v="label" color={colors.gold200}>
                  RDO DE HOJE
                </Txt>
                <Txt v="h2" color={colors.white} numberOfLines={1}>
                  {obra.nome}
                </Txt>
                <Txt v="small" color={colors.textOnDarkMuted}>
                  {capitalizar(nomeDiaSemana(hoje))}, {formatDateLong(hoje)}
                </Txt>
              </View>
              {rdo ? <StatusBadge status={rdo.status} /> : null}
            </View>

            {!rdo ? (
              <>
                <Txt v="body" color={colors.white}>
                  Você ainda não iniciou o RDO de hoje. Registre clima, equipe, equipamentos, atividades e fotos.
                </Txt>
                {!util ? (
                  <Banner tone="info" message="Hoje não é dia útil desta obra, mas você pode registrar um RDO se houve atividade." />
                ) : passouDoLimite ? (
                  <Banner tone="warning" icon="clock-alert-outline" message={`O prazo sugerido para enviar o RDO era ${cfg.operacionalFimDia}.`} />
                ) : (
                  <View style={styles.dica}>
                    <Icon name="clock-outline" size={16} color={colors.gold200} />
                    <Txt v="small" color={colors.gold200}>
                      Prazo sugerido para envio: hoje até {cfg.operacionalFimDia}
                    </Txt>
                  </View>
                )}
                <Button title="Iniciar RDO de hoje" icon="plus-circle-outline" variant="accent" size="lg" onPress={() => criar(obra)} />
              </>
            ) : rdo.status === 'rascunho' || rdo.status === 'devolvido' ? (
              <>
                <View style={styles.progress}>
                  <ProgressRing value={pct} size={72} stroke={8} color={colors.gold500} track="rgba(255,255,255,0.2)" label="Progresso do preenchimento">
                    <Txt v="bodyStrong" color={colors.white}>
                      {pct}%
                    </Txt>
                  </ProgressRing>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="bodyStrong" color={colors.white}>
                      RDO {numeroFormatado(rdo)} · {v.progresso.completos} de {v.progresso.total} etapas
                    </Txt>
                    <Txt v="small" color={colors.textOnDarkMuted}>
                      {v.valido ? 'Pronto para revisão e envio.' : `${v.erros.length} ${v.erros.length === 1 ? 'pendência obrigatória' : 'pendências obrigatórias'} para enviar.`}
                    </Txt>
                    <Txt v="caption" color={colors.textOnDarkMuted}>
                      Salvo automaticamente às {formatTime(rdo.atualizadoEm)}
                    </Txt>
                  </View>
                </View>
                {rdo.status === 'devolvido' && rdo.devolucao ? <Banner tone="warning" title={`Devolvido — corrigir até ${formatDateTime(rdo.devolucao.prazo)}`} message={rdo.devolucao.motivo} /> : null}
                <Button title={rdo.status === 'devolvido' ? 'Corrigir RDO' : 'Continuar preenchimento'} icon="pencil-outline" variant="accent" size="lg" onPress={() => nav.navigate('RdoForm', { rdoId: rdo.id })} />
                {v.valido ? <Button title="Revisar e enviar" icon="send-check-outline" variant="onDark" onPress={() => nav.navigate('RdoForm', { rdoId: rdo.id, passo: 'revisao' })} /> : null}
              </>
            ) : (
              <>
                <Txt v="body" color={colors.white}>
                  {rdo.status === 'submetido' || rdo.status === 'em_analise'
                    ? 'Enviado! Aguardando análise do master. Você será avisado se houver devolução.'
                    : rdo.status === 'enviado_cliente'
                      ? 'Validado pelo master e enviado ao cliente para ciência/aceite.'
                      : rdo.status === 'finalizado'
                        ? 'RDO finalizado com PDF verificável.'
                        : 'Acompanhe a situação do RDO.'}
                </Txt>
                <Button title="Ver RDO de hoje" icon="file-document-outline" variant="onDark" onPress={() => nav.navigate('RdoDetail', { rdoId: rdo.id })} />
              </>
            )}
          </View>
        );
      })}

      {atencao.length ? (
        <>
          <TituloSecao>Precisa da sua atenção</TituloSecao>
          {atencao.map((r) => (
            <RdoCard
              key={r.id}
              rdo={r}
              obra={obraDe(r)}
              agora={now}
              config={cfg}
              onPress={() => nav.navigate('RdoForm', { rdoId: r.id })}
            />
          ))}
          {atencao.some((r) => r.status === 'rascunho') ? (
            <Banner tone="warning" icon="calendar-alert" message="RDO de dia anterior ainda em rascunho: complete e envie para manter o registro em dia." />
          ) : null}
        </>
      ) : null}

      <TituloSecao acao="Ver todos" onAcao={() => nav.navigate('Rdos')}>
        Meus RDOs recentes
      </TituloSecao>
      {recentes.length ? (
        recentes.map((r) => <RdoCard key={r.id} rdo={r} obra={obraDe(r)} agora={now} config={cfg} onPress={() => nav.navigate('RdoDetail', { rdoId: r.id })} />)
      ) : (
        <Txt v="small" muted>
          Você ainda não tem RDOs recentes.
        </Txt>
      )}

      <Card tone="soft" style={{ flexDirection: 'row', gap: 10 }}>
        <Icon name="cloud-off-outline" size={22} color={colors.navy600} />
        <Txt v="small" muted style={{ flex: 1 }}>
          Sem sinal no canteiro? Continue preenchendo e fotografando: tudo fica salvo no aparelho e sincroniza quando a conexão voltar.
        </Txt>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: { backgroundColor: colors.navy700, borderRadius: radius.xl, padding: 18, gap: 12, borderWidth: 1, borderColor: colors.navy600 },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dica: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  progress: { flexDirection: 'row', alignItems: 'center', gap: 14 },
});
