import React from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { styles } from './styles';
import { chart, colors } from '../../../theme';
import { EVENTOS_PUBLICOS } from '../../../constants';
import { useApp } from '../../../store/AppContext';
import { useNow } from '../../../hooks/useNow';
import { nomeUsuario, obrasVisiveis, rdosVisiveis } from '../../../domain/selectors';
import { numeroFormatado } from '../../../domain/rdo';
import { formatDate, tempoRelativo } from '../../../utils/date';
import { Banner, Button, Card, Icon, ProgressBar, Screen, Txt } from '../../../components/ui';
import { RdoCard } from '../../../components/rdo';
import { StatTile } from '../../../components/charts/StatTile';
import { DataDeHoje, Grade, TituloSecao, tituloBoasVindas } from '../Shared';

export default function ClientHome() {
  const nav = useNavigation();
  const { state, currentUser } = useApp();
  const now = useNow();
  const cfg = state.settings.lembretes;
  const obras = obrasVisiveis(state, currentUser);
  const rdos = rdosVisiveis(state, currentUser);
  const aguardando = rdos
    .filter((r) => r.status === 'enviado_cliente')
    .sort((a, b) => (a.liberadoAoClienteEm > b.liberadoAoClienteEm ? 1 : -1));
  const finalizados = rdos.filter((r) => r.status === 'finalizado').sort((a, b) => (a.data < b.data ? 1 : -1));
  const obraDe = (r) => state.obras.find((o) => o.id === r.obraId);
  const comRessalva = finalizados.filter((r) => r.assinaturas.cliente?.tipo === 'ressalva').length;
  const publicos = rdos
    .flatMap((r) => r.auditoria.map((a) => ({ ...a, rdo: r })))
    .filter((a) => EVENTOS_PUBLICOS.includes(a.evento))
    .sort((a, b) => (a.dataHora < b.dataHora ? 1 : -1))
    .slice(0, 4);

  return (
    <Screen title="Início" subtitle={tituloBoasVindas(currentUser)} tab bell>
      <DataDeHoje />

      <View style={styles.hero}>
        <Txt v="label" color={colors.gold200}>
          AGUARDANDO SUA CIÊNCIA/ACEITE
        </Txt>
        <View style={styles.heroRow}>
          <Txt
            v="display"
            color={colors.white}
            style={styles.heroNum}
            accessibilityLabel={`${aguardando.length} RDOs aguardando sua ciência`}
          >
            {aguardando.length}
          </Txt>
          <Txt v="body" color={colors.white} style={styles.heroTextFlex}>
            {aguardando.length === 0
              ? 'Você está em dia. Novos RDOs validados aparecerão aqui.'
              : aguardando.length === 1
                ? 'RDO validado pelo responsável técnico aguarda sua manifestação.'
                : 'RDOs validados pelo responsável técnico aguardam sua manifestação.'}
          </Txt>
        </View>
      </View>

      {aguardando.map((r) => (
        <View key={r.id} style={styles.cardGapSmall}>
          <RdoCard
            rdo={r}
            obra={obraDe(r)}
            agora={now}
            config={cfg}
            onPress={() => nav.navigate('RdoDetail', { rdoId: r.id })}
          />
          <Button
            title="Revisar e dar ciência"
            icon="draw-pen"
            variant="accent"
            onPress={() => nav.navigate('SignClient', { rdoId: r.id })}
          />
        </View>
      ))}

      <Grade>
        <StatTile
          label="RDOs finalizados"
          value={finalizados.length}
          icon="file-pdf-box"
          onPress={() => nav.navigate('Rdos', { status: 'finalizado' })}
          hint="Com PDF e hash de verificação"
        />
        <StatTile
          label="Com sua ressalva"
          value={comRessalva}
          icon="alert-decagram-outline"
          hint="Integram o PDF final"
        />
      </Grade>

      <TituloSecao>Suas obras</TituloSecao>
      {obras.map((o) => (
        <Card
          key={o.id}
          onPress={() => nav.navigate('ObraDetail', { obraId: o.id })}
          style={styles.cardGapMedium}
          accessibilityLabel={`${o.nome}, avanço ${o.avancoFisico}%`}
        >
          <View style={styles.row}>
            <View style={styles.flexOne}>
              <Txt v="bodyStrong">{o.nome}</Txt>
              <Txt v="caption" muted>
                {o.descricao} · {o.contrato}
              </Txt>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textSubtle} />
          </View>
          <View style={styles.progressContainer}>
            <View style={styles.row}>
              <Txt v="small" muted style={styles.flexOne}>
                Avanço físico {o.avancoFisico}% · previsto {o.avancoPrevisto}%
              </Txt>
              <Txt v="smallStrong" color={o.avancoFisico >= o.avancoPrevisto ? chart.deltaGood : chart.deltaBad}>
                {o.avancoFisico - o.avancoPrevisto >= 0 ? '+' : ''}
                {o.avancoFisico - o.avancoPrevisto} p.p.
              </Txt>
            </View>
            <ProgressBar value={o.avancoFisico} label={`Avanço físico de ${o.nome}`} />
          </View>
        </Card>
      ))}

      {finalizados.length ? (
        <>
          <TituloSecao acao="Ver arquivos" onAcao={() => nav.navigate('Files')}>
            Últimos RDOs finalizados
          </TituloSecao>
          {finalizados.slice(0, 2).map((r) => (
            <RdoCard
              key={r.id}
              rdo={r}
              obra={obraDe(r)}
              agora={now}
              config={cfg}
              onPress={() => nav.navigate('RdoDetail', { rdoId: r.id })}
            />
          ))}
        </>
      ) : null}

      {publicos.length ? (
        <>
          <TituloSecao>Histórico recente</TituloSecao>
          <Card style={styles.cardGapLarge}>
            {publicos.map((e) => (
              <View key={e.id} style={styles.row}>
                <View style={styles.evento}>
                  <Icon name="check-decagram-outline" size={18} color={colors.navy700} />
                </View>
                <View style={styles.flexOne}>
                  <Txt v="smallStrong" numberOfLines={1}>
                    RDO nº {numeroFormatado(e.rdo)} · {formatDate(e.rdo.data)}
                  </Txt>
                  <Txt v="caption" muted numberOfLines={2}>
                    {nomeUsuario(state, e.usuarioId)} · {tempoRelativo(e.dataHora, now)}
                  </Txt>
                </View>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Banner
        tone="info"
        message="Você visualiza apenas os RDOs liberados pelo responsável técnico. Ciência/aceite e ressalvas ficam registradas com data, hora e trilha de auditoria."
      />
    </Screen>
  );
}
