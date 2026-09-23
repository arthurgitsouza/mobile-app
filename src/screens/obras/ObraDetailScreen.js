import React from 'react';
import { StyleSheet, View } from 'react-native';
import { chart, colors } from '../../theme';
import { PERFIL, PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import useCriarRdo from '../../hooks/useCriarRdo';
import { diasSemRdo, ehDiaUtil, rdoDaData, rdosVisiveis } from '../../domain/selectors';
import { formatDate, hojeObra, nomeDiaCurto, nomesDiasCurtos } from '../../utils/date';
import { Avatar, Badge, Banner, Button, Card, CriticidadeBadge, EmptyState, IconButton, KeyValue, ProgressBar, Screen, SectionTitle, StatusBadge, Txt } from '../../components/ui';
import { RdoCard } from '../../components/rdo';
import { StatTile } from '../../components/charts/StatTile';
import { Grade } from '../home/shared';
import { STATUS_OBRA } from './ObrasListScreen';

// Detalhe da obra: contrato, cronograma, avanço, equipe vinculada, RDO de hoje e últimos registros.
export default function ObraDetailScreen({ route, navigation }) {
  const { obraId } = route.params;
  const { state, currentUser } = useApp();
  const now = useNow();
  const criar = useCriarRdo();
  const obra = state.obras.find((o) => o.id === obraId);
  const master = currentUser.perfil === PERFIL.MASTER;
  const operacional = currentUser.perfil === PERFIL.OPERACIONAL;

  const permitido = obra && (master || (obra.usuarioIds || []).includes(currentUser.id));
  if (!permitido) {
    return (
      <Screen title="Obra" back>
        <EmptyState icon="lock-outline" title="Obra indisponível" message="Você só visualiza as obras às quais foi vinculado." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const hoje = hojeObra(now);
  const rdos = rdosVisiveis(state, currentUser).filter((r) => r.obraId === obraId && !['cancelado', 'retificado'].includes(r.status));
  const recentes = [...rdos].sort((a, b) => (a.data < b.data ? 1 : -1)).slice(0, 3);
  const hojeRdo = rdoDaData(state, obraId, hoje);
  const semRdo = diasSemRdo(state, obra, hoje, 14);
  const meta = STATUS_OBRA[obra.status];
  const equipe = state.users.filter((u) => (obra.usuarioIds || []).includes(u.id));
  const dif = obra.avancoFisico - obra.avancoPrevisto;
  const ultimo = recentes[0];
  const abertas = (ultimo?.pendencias || []).filter((p) => p.status !== 'resolvida');
  const cfg = state.settings.lembretes;

  return (
    <Screen
      title={obra.nome}
      subtitle={`${obra.descricao} · ${obra.contrato}`}
      back
      right={master ? <IconButton icon="pencil-outline" label="Editar obra" color={colors.white} onPress={() => navigation.navigate('ObraForm', { obraId })} /> : undefined}
    >
      <View style={styles.row}>
        <Badge label={meta.label} color={meta.color} bg={meta.bg} icon={meta.icon} />
        {hojeRdo ? <StatusBadge status={hojeRdo.status} label={`Hoje: ${hojeRdo.status === 'rascunho' ? 'rascunho' : STATUS_TEXTO[hojeRdo.status]}`} /> : <Badge label={ehDiaUtil(obra, hoje) ? 'Sem RDO hoje' : 'Hoje não é dia útil'} color={colors.warning} bg={colors.warningBg} icon="calendar-alert" />}
      </View>

      {operacional && !hojeRdo ? <Button title="Iniciar RDO de hoje nesta obra" icon="plus-circle-outline" variant="accent" onPress={() => criar(obra)} /> : null}
      {operacional && hojeRdo && ['rascunho', 'devolvido'].includes(hojeRdo.status) ? <Button title="Continuar RDO de hoje" icon="pencil-outline" variant="accent" onPress={() => navigation.navigate('RdoForm', { rdoId: hojeRdo.id })} /> : null}

      <Card style={{ gap: 10 }}>
        <View style={styles.row}>
          <Txt v="bodyStrong" style={{ flex: 1 }}>
            Avanço físico {obra.avancoFisico}%
          </Txt>
          <Txt v="smallStrong" color={dif >= 0 ? chart.deltaGood : chart.deltaBad}>
            {dif >= 0 ? '+' : ''}
            {dif} p.p. vs. previsto
          </Txt>
        </View>
        <ProgressBar value={obra.avancoFisico} height={12} label="Avanço físico" />
        <Txt v="small" muted>
          Previsto para hoje: {obra.avancoPrevisto}%
        </Txt>
        <ProgressBar value={obra.avancoPrevisto} height={6} color={chart.neutral} label="Avanço previsto" />
      </Card>

      <Grade>
        <StatTile label="RDOs registrados" value={rdos.length} icon="file-document-multiple-outline" onPress={() => navigation.navigate('RdoList', { obraId })} />
        <StatTile label="Finalizados" value={rdos.filter((r) => r.status === 'finalizado').length} icon="file-pdf-box" onPress={() => navigation.navigate('RdoList', { obraId, status: 'finalizado' })} />
        {master ? <StatTile label="Aguardando análise" value={rdos.filter((r) => ['submetido', 'em_analise'].includes(r.status)).length} icon="clipboard-check-outline" onPress={() => navigation.navigate('RdoList', { obraId })} /> : null}
        {!operacional ? <StatTile label="Dias úteis sem RDO (14 d)" value={semRdo.length} icon="calendar-alert" destaque={semRdo.length > 0} hint={semRdo.length ? 'Registros atrasados' : 'Cobertura completa'} /> : null}
      </Grade>

      <SectionTitle>Contrato e localização</SectionTitle>
      <Card style={{ gap: 8 }}>
        <KeyValue inline label="Contrato / OS" value={[obra.contrato, obra.os].filter(Boolean).join(' · ')} />
        <KeyValue inline label="Cliente" value={obra.clienteNome} />
        <KeyValue inline label="Empresa executora" value={obra.empresaExecutora} />
        <KeyValue inline label="Endereço" value={obra.endereco} />
        <KeyValue inline label="Engenheiro / RT" value={obra.engenheiroRT} />
        <KeyValue inline label="Período contratual" value={`${formatDate(obra.inicio)} a ${formatDate(obra.fim)}`} />
        <KeyValue inline label="Dias úteis" value={(obra.diasUteis || []).map((d) => nomesDiasCurtos[d]).join(', ')} />
        <KeyValue inline label="Assinatura do operacional" value={obra.exigeAssinaturaOperacional ? 'Exigida no envio' : 'Não exigida'} />
      </Card>

      <SectionTitle>Equipe e clientes vinculados</SectionTitle>
      <Card style={{ gap: 12 }}>
        {equipe.length ? (
          equipe.map((u) => (
            <View key={u.id} style={styles.row}>
              <Avatar nome={u.nome} size={38} />
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{u.nome}</Txt>
                <Txt v="caption" muted>
                  {PERFIS[u.perfil].label} · {u.cargo}
                </Txt>
              </View>
            </View>
          ))
        ) : (
          <Txt v="small" muted>
            Nenhum usuário vinculado ainda.
          </Txt>
        )}
        {master ? <Button title="Gerenciar vínculos" icon="account-multiple-plus-outline" variant="tonal" size="sm" full={false} onPress={() => navigation.navigate('ObraForm', { obraId })} /> : null}
      </Card>

      {abertas.length ? (
        <>
          <SectionTitle>Pendências em aberto (último RDO)</SectionTitle>
          {abertas.slice(0, 3).map((p) => (
            <Card key={p.id} onPress={() => navigation.navigate('RdoDetail', { rdoId: ultimo.id })} style={{ gap: 6 }}>
              <CriticidadeBadge nivel={p.criticidade} size="sm" />
              <Txt v="small">{p.descricao}</Txt>
              <Txt v="caption" muted>
                {p.responsavel} · prazo {formatDate(p.prazo)} {p.prazoHora || ''}
              </Txt>
            </Card>
          ))}
        </>
      ) : null}

      <SectionTitle>Últimos RDOs</SectionTitle>
      {recentes.length ? (
        recentes.map((r) => <RdoCard key={r.id} rdo={r} obra={obra} showObra={false} agora={now} config={cfg} onPress={() => navigation.navigate('RdoDetail', { rdoId: r.id })} />)
      ) : (
        <Banner tone="info" message="Nenhum RDO registrado para esta obra ainda." />
      )}
      {rdos.length > 3 ? <Button title="Ver todos os RDOs desta obra" icon="format-list-bulleted" variant="secondary" onPress={() => navigation.navigate('RdoList', { obraId })} /> : null}
      <Txt v="caption" subtle style={{ textAlign: 'center' }}>
        {nomeDiaCurto(hoje)}, {formatDate(hoje)}
      </Txt>
    </Screen>
  );
}

const STATUS_TEXTO = { submetido: 'enviado', em_analise: 'em análise', devolvido: 'devolvido', validado: 'validado', enviado_cliente: 'com o cliente', finalizado: 'finalizado' };

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
});
