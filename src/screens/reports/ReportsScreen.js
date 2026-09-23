import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { chart, colors, statusMeta } from '../../theme';
import { PERFIL, STATUS_ORDEM } from '../../constants';
import { useApp } from '../../store/AppContext';
import { calcularIndicadores, formatarHorasMin, intervaloPeriodo } from '../../domain/reports';
import { csvAtividades, csvMaoDeObra, csvRdos } from '../../domain/exportacao';
import { numeroFormatado } from '../../domain/rdo';
import { compartilharCsv } from '../../services/arquivos';
import { formatDateShort, hojeObra, nomeDiaCurto } from '../../utils/date';
import { formatNumber, formatQuantidade } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Badge, Banner, Button, Card, Chip, CriticidadeBadge, EmptyState, Icon, ProgressBar, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { StatTile } from '../../components/charts/StatTile';
import ChartCard, { TabelaDados } from '../../components/charts/ChartCard';
import BarList from '../../components/charts/BarList';
import ColumnChart from '../../components/charts/ColumnChart';
import LineChart from '../../components/charts/LineChart';
import { Grade } from '../home/shared';

const PERIODOS = [
  { value: '7', label: '7 dias' },
  { value: '30', label: '30 dias' },
  { value: '90', label: '90 dias' },
  { value: 'todos', label: 'Tudo' },
];
const COR_STATUS_CRIT = { baixa: chart.status.good, media: chart.status.warning, alta: chart.status.serious, critica: chart.status.critical };

// Relatórios e indicadores (seção 14): forma escolhida pela função de cada dado, cor pela regra da paleta validada.
export default function ReportsScreen({ navigation }) {
  const { state, actions, currentUser } = useApp();
  const { toast, notice } = useUI();
  const hoje = hojeObra();
  const [obraId, setObraId] = useState('');
  const [periodo, setPeriodo] = useState('30');
  const [servicoSel, setServicoSel] = useState('');
  const [exportando, setExportando] = useState('');
  const { de, ate } = intervaloPeriodo(periodo, hoje);

  const ind = useMemo(() => calcularIndicadores(state, { obraIds: obraId ? [obraId] : [], de, ate }), [state, obraId, de, ate]);

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Relatórios" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" message="Os indicadores gerenciais são exclusivos do usuário Master." />
      </Screen>
    );
  }

  const c = ind.contagem;
  const pctPreench = c.previstos ? Math.round((c.preenchidos / c.previstos) * 100) : 0;
  const corObra = (id) => chart.series[Math.max(0, state.obras.findIndex((o) => o.id === id)) % chart.series.length];
  const obrasNaTela = ind.obras;
  const multi = obrasNaTela.length > 1;

  // HH por dia (até 14 últimos dias com registro) — empilhado por obra quando há mais de uma.
  const dias = ind.hhPorDia.slice(-14);
  const seriesHH = multi ? obrasNaTela.map((o) => ({ nome: o.nome, cor: corObra(o.id), id: o.id })) : [{ nome: 'Homem-hora', cor: chart.series[0], id: null }];
  const dadosHH = dias.map((d) => ({
    chave: d.data,
    rotulo: nomeDiaCurto(d.data).slice(0, 1).toUpperCase(),
    rotulo2: d.data.slice(8),
    descricao: `${nomeDiaCurto(d.data)}, ${formatDateShort(d.data)}`,
    valores: multi ? seriesHH.map((s) => d.porObra[s.id] || 0) : [d.hh],
  }));

  const topN = (lista, n = 6) => {
    if (lista.length <= n) return lista;
    const resto = lista.slice(n).reduce((s, x) => s + x.hh, 0);
    return [...lista.slice(0, n), { nome: 'Outras', hh: resto }];
  };

  const servicoAtual = ind.servicos.find((s) => s.servico === servicoSel) || ind.servicos[0];

  const exportar = async (tipo) => {
    setExportando(tipo);
    try {
      const rdos = state.rdos.filter((r) => (!obraId || r.obraId === obraId) && r.data >= de && r.data <= ate);
      const csv = tipo === 'rdos' ? csvRdos(rdos, state.obras, state.users) : tipo === 'atividades' ? csvAtividades(rdos, state.obras) : csvMaoDeObra(rdos, state.obras);
      const nome = `rdo_${tipo}_${periodo === 'todos' ? 'todos' : `${de}_${ate}`}${obraId ? `_${obraId.replace('obra_', '')}` : ''}.csv`;
      await compartilharCsv(nome, csv);
      actions.registrarExportacao({ userId: currentUser.id, arquivo: { nome, tipo: 'csv', descricao: `${rdos.length} RDOs · ${obraId ? state.obras.find((o) => o.id === obraId)?.nome : 'todas as obras'} · ${PERIODOS.find((p) => p.value === periodo).label}` } });
      haptic.success();
      toast.show({ type: 'success', title: 'Exportação gerada', message: `${nome} (abre no Excel/Power BI).` });
    } catch (e) {
      await notice({ icon: 'table-alert', title: 'Não foi possível exportar', message: 'Tente novamente em instantes.' });
    } finally {
      setExportando('');
    }
  };

  const equipDados = ind.equipamentos.slice(0, 6).map((e) => ({
    label: e.tipo,
    segmentos: [{ valor: e.produtivas, cor: chart.series[0] }, { valor: e.paradas, cor: chart.series[1] }],
    texto: `${formatQuantidade(e.produtivas)} h / ${formatQuantidade(e.paradas)} h`,
  }));

  return (
    <Screen title="Relatórios e indicadores" subtitle={`${ind.totalRdos} RDOs no período`} back>
      <View style={{ gap: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 16 }} style={{ flexGrow: 0 }}>
          <Chip label="Todas as obras" selected={!obraId} onPress={() => setObraId('')} />
          {state.obras.map((o) => (
            <Chip key={o.id} label={o.nome} selected={obraId === o.id} onPress={() => setObraId(obraId === o.id ? '' : o.id)} />
          ))}
        </ScrollView>
        <View style={styles.chips}>
          {PERIODOS.map((p) => (
            <Chip key={p.value} label={p.label} icon="calendar-range" selected={periodo === p.value} onPress={() => setPeriodo(p.value)} />
          ))}
        </View>
      </View>

      {/* 1 · RDOs — KPIs */}
      <SectionTitle>RDOs no período</SectionTitle>
      <Card style={{ gap: 8 }}>
        <View style={styles.row}>
          <Txt v="bodyStrong" style={{ flex: 1 }}>
            Preenchimento: {c.preenchidos} de {c.previstos} previstos
          </Txt>
          <Txt v="h3">{pctPreench}%</Txt>
        </View>
        <ProgressBar value={pctPreench} height={12} label="RDOs preenchidos sobre previstos" />
        <Txt v="caption" muted>
          Previstos = dias úteis da obra desde o início do registro digital. Preenchidos = RDOs enviados ao master.
        </Txt>
      </Card>
      <Grade>
        <StatTile label="Previstos" value={c.previstos} icon="calendar-check-outline" />
        <StatTile label="Preenchidos" value={c.preenchidos} icon="file-check-outline" />
        <StatTile label="Pendentes de análise" value={c.pendentes} icon="clipboard-clock-outline" destaque={c.pendentes > 0} />
        <StatTile label="Devolvidos" value={c.devolvidos} icon="undo-variant" destaque={c.devolvidos > 0} />
        <StatTile label="Validados" value={c.validados} icon="check-decagram-outline" />
        <StatTile label="Assinados (finalizados)" value={c.assinados} icon="file-sign" />
      </Grade>

      <ChartCard
        titulo="Situação dos RDOs"
        subtitulo="Quantidade por estado do fluxo"
        tabela={{ colunas: ['Situação', 'RDOs'], linhas: STATUS_ORDEM.filter((s) => ind.distribuicao.some((d) => d.status === s)).map((s) => [statusMeta[s].label, String(ind.distribuicao.find((d) => d.status === s).n)]) }}
      >
        <BarList
          dados={STATUS_ORDEM.filter((s) => ind.distribuicao.some((d) => d.status === s)).map((s) => ({ label: statusMeta[s].label, icone: statusMeta[s].icon, valor: ind.distribuicao.find((d) => d.status === s).n }))}
          rotuloLargura={132}
        />
      </ChartCard>

      {/* 2 · Prazos do fluxo */}
      <SectionTitle>Prazos do fluxo</SectionTitle>
      <Grade>
        <StatTile label="Tempo médio: envio → validação" value={ind.tempos.envioAteValidacaoH == null ? '—' : ind.tempos.envioAteValidacaoH.toFixed(1).replace('.', ',')} unit={ind.tempos.envioAteValidacaoH == null ? '' : 'h'} icon="timer-sand" hint={`${ind.tempos.n1} RDOs · meta sugerida: 24 h`} />
        <StatTile label="Tempo médio: validação → aceite" value={ind.tempos.validacaoAteAceiteH == null ? '—' : ind.tempos.validacaoAteAceiteH.toFixed(1).replace('.', ',')} unit={ind.tempos.validacaoAteAceiteH == null ? '' : 'h'} icon="timer-check-outline" hint={`${ind.tempos.n2} RDOs · meta sugerida: 48 h`} />
      </Grade>

      {/* 3 · Efetivo e homem-hora */}
      <SectionTitle>Efetivo e homem-hora</SectionTitle>
      {dias.length ? (
        <ChartCard
          titulo="Homem-hora por dia"
          subtitulo={multi ? 'Empilhado por obra · últimos dias com registro' : 'Últimos dias com registro'}
          legenda={multi ? seriesHH.map((s) => ({ label: s.nome, cor: s.cor })) : undefined}
          tabela={{ colunas: ['Dia', 'Efetivo', 'HH'], linhas: dias.map((d) => [`${nomeDiaCurto(d.data)} ${formatDateShort(d.data)}`, String(d.efetivo), formatNumber(d.hh, 0)]) }}
        >
          <ColumnChart dados={dadosHH} series={seriesHH} unidade="HH" formatar={(v) => formatNumber(v, 0)} />
        </ChartCard>
      ) : (
        <Banner tone="info" message="Nenhum RDO com mão de obra no período selecionado." />
      )}
      {ind.hhPorFuncao.length ? (
        <>
          <ChartCard titulo="Homem-hora por função" subtitulo="Total no período" tabela={{ colunas: ['Função', 'HH'], linhas: ind.hhPorFuncao.map((f) => [f.nome, formatNumber(f.hh, 0)]) }}>
            <BarList dados={topN(ind.hhPorFuncao).map((f) => ({ label: f.nome, valor: f.hh }))} formatar={(v) => `${formatNumber(v, 0)} HH`} />
          </ChartCard>
          <ChartCard titulo="Homem-hora por empresa/equipe" subtitulo="Total no período" tabela={{ colunas: ['Equipe', 'HH'], linhas: ind.hhPorEmpresa.map((f) => [f.nome, formatNumber(f.hh, 0)]) }}>
            <BarList dados={ind.hhPorEmpresa.map((f) => ({ label: f.nome, valor: f.hh }))} formatar={(v) => `${formatNumber(v, 0)} HH`} rotuloLargura={132} />
          </ChartCard>
        </>
      ) : null}

      {/* 4 · Equipamentos */}
      <SectionTitle>Equipamentos</SectionTitle>
      {equipDados.length ? (
        <ChartCard
          titulo="Horas produtivas e paradas por equipamento"
          subtitulo="Somatório do período (horas × quantidade)"
          legenda={[{ label: 'Produtivas', cor: chart.series[0] }, { label: 'Paradas (improdutivas)', cor: chart.series[1] }]}
          tabela={{ colunas: ['Equipamento', 'Disp.', 'Prod.', 'Paradas'], linhas: ind.equipamentos.map((e) => [e.tipo, `${formatQuantidade(e.disponiveis)} h`, `${formatQuantidade(e.produtivas)} h`, `${formatQuantidade(e.paradas)} h`]) }}
        >
          <BarList dados={equipDados} rotuloLargura={104} />
        </ChartCard>
      ) : (
        <Banner tone="info" message="Nenhum equipamento registrado no período." />
      )}

      {/* 5 · Quantidades por serviço */}
      <SectionTitle>Quantidades executadas por serviço (EAP)</SectionTitle>
      {ind.servicos.length ? (
        <>
          <Card style={{ gap: 8 }}>
            <Txt v="h3">Total executado no período</Txt>
            <Txt v="small" muted>
              Serviços têm unidades diferentes (m², m³, kg): por isso a leitura é em tabela, não em barras comparáveis.
            </Txt>
            <TabelaDados colunas={['Serviço', 'Total']} linhas={ind.servicos.map((s) => [s.servico, `${formatQuantidade(s.total)} ${s.unidade}`])} />
          </Card>
          <ChartCard titulo="Evolução acumulada" subtitulo={servicoAtual ? `${servicoAtual.servico} (${servicoAtual.unidade})` : ''}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }} style={{ flexGrow: 0 }}>
              {ind.servicos.slice(0, 6).map((s) => (
                <Chip key={s.servico} label={s.servico} selected={servicoAtual?.servico === s.servico} onPress={() => setServicoSel(s.servico)} />
              ))}
            </ScrollView>
            {servicoAtual && servicoAtual.evolucao.length > 1 ? (
              <LineChart pontos={servicoAtual.evolucao.map((p) => ({ rotulo: formatDateShort(p.data), valor: p.acumulado }))} unidade={servicoAtual.unidade} formatar={(v) => formatNumber(v, v < 100 ? 1 : 0)} />
            ) : (
              <Txt v="small" muted>
                São necessários ao menos 2 dias com este serviço para traçar a evolução.
              </Txt>
            )}
          </ChartCard>
        </>
      ) : (
        <Banner tone="info" message="Nenhuma atividade registrada no período." />
      )}

      {/* 6 · Clima e impactos */}
      <SectionTitle>Clima e impactos no serviço</SectionTitle>
      <Grade>
        <StatTile label="Dias com chuva" value={ind.clima.diasComChuva} icon="weather-pouring" />
        <StatTile label="Precipitação registrada" value={formatNumber(ind.clima.mmTotal, 0)} unit="mm" icon="water-outline" />
        <StatTile label="Horas paralisadas" value={formatarHorasMin(ind.clima.minutosParalisados).replace(' h', '')} unit="h" icon="pause-circle-outline" hint={`${ind.clima.diasImpactados} dia(s) com impacto`} />
        <StatTile label="Ocorrências com impacto no prazo" value={ind.ocorrencias.impactoPrazo} icon="clock-alert-outline" hint={`de ${ind.ocorrencias.total} ocorrências`} />
      </Grade>

      {/* 7 · Ocorrências, NC, incidentes, pendências */}
      <SectionTitle>Ocorrências, qualidade, segurança e pendências</SectionTitle>
      <Grade>
        <StatTile label="Não conformidades" value={ind.ocorrencias.naoConformidades} icon="alert-decagram-outline" />
        <StatTile label="Incidentes / quase acidentes" value={ind.ocorrencias.incidentes} icon="shield-alert-outline" />
      </Grade>
      <ChartCard
        titulo="Pendências abertas por criticidade"
        subtitulo={`${ind.ocorrencias.pendenciasAbertas} em aberto na versão mais recente de cada obra`}
        tabela={{ colunas: ['Criticidade', 'Pendências'], linhas: ind.ocorrencias.pendenciasPorCriticidade.map((p) => [p.nivel, String(p.n)]) }}
      >
        <View style={{ gap: 10 }}>
          {ind.ocorrencias.pendenciasPorCriticidade.map((p) => {
            const max = Math.max(1, ...ind.ocorrencias.pendenciasPorCriticidade.map((x) => x.n));
            return (
              <View key={p.nivel} style={styles.row} accessible accessibilityLabel={`${p.nivel}: ${p.n} pendências`}>
                <View style={{ width: 96 }}>
                  <CriticidadeBadge nivel={p.nivel} size="sm" />
                </View>
                <View style={{ flex: 1, height: 16, justifyContent: 'center' }}>
                  <View style={{ width: `${(p.n / max) * 100}%`, minWidth: p.n ? 4 : 0, height: 16, backgroundColor: COR_STATUS_CRIT[p.nivel], borderTopRightRadius: 4, borderBottomRightRadius: 4 }} />
                </View>
                <Txt v="smallStrong" style={{ width: 28, textAlign: 'right' }}>
                  {p.n}
                </Txt>
              </View>
            );
          })}
        </View>
      </ChartCard>

      {/* 8 · Cobertura fotográfica e incompletos */}
      <SectionTitle>Cobertura fotográfica e registros incompletos</SectionTitle>
      <Card style={{ gap: 8 }}>
        <View style={styles.row}>
          <Txt v="bodyStrong" style={{ flex: 1 }}>
            RDOs com ao menos 3 fotos legendadas
          </Txt>
          <Txt v="h3">{ind.cobertura.pct}%</Txt>
        </View>
        <ProgressBar value={ind.cobertura.pct} height={12} color={ind.cobertura.pct >= 80 ? chart.seq[450] : chart.status.serious} label="Cobertura fotográfica" />
        <View style={styles.row}>
          <Icon name={ind.cobertura.pct >= 80 ? 'check-circle-outline' : 'alert-outline'} size={16} color={ind.cobertura.pct >= 80 ? colors.success : colors.warning} />
          <Txt v="caption" muted>
            {ind.cobertura.comFotos} de {ind.cobertura.total} RDOs enviados · {ind.cobertura.pct >= 80 ? 'boa cobertura' : 'cobertura abaixo da meta de 80%'}
          </Txt>
        </View>
      </Card>
      {ind.cobertura.incompletos.length ? (
        <Card style={{ gap: 10 }}>
          <Txt v="h3">Registros incompletos ({ind.cobertura.incompletos.length})</Txt>
          {ind.cobertura.incompletos.slice(0, 6).map(({ rdo, faltas }) => (
            <View key={rdo.id} style={styles.row}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="smallStrong" onPress={() => navigation.navigate('RdoDetail', { rdoId: rdo.id })} accessibilityRole="link">
                  RDO {numeroFormatado(rdo)} · {state.obras.find((o) => o.id === rdo.obraId)?.nome} · {formatDateShort(rdo.data)}
                </Txt>
                <Txt v="caption" muted>
                  {faltas.join(' · ')}
                </Txt>
              </View>
              <Badge label={statusMeta[rdo.status].label} color={statusMeta[rdo.status].color} bg={statusMeta[rdo.status].bg} size="sm" />
            </View>
          ))}
        </Card>
      ) : null}

      {/* 9 · Exportação */}
      <SectionTitle>Exportação (Excel/CSV e Power BI)</SectionTitle>
      <Card style={{ gap: 10 }}>
        <Txt v="small" muted>
          As bases seguem um esquema estável (uma linha por fato) e usam “;” e UTF-8 para abrir direto no Excel em pt-BR e ser lidas pelo Power BI. Respeitam a obra e o período escolhidos acima.
        </Txt>
        <Button title="RDOs consolidados (CSV)" icon="file-delimited-outline" onPress={() => exportar('rdos')} loading={exportando === 'rdos'} disabled={!!exportando} />
        <Button title="Atividades e quantidades (CSV)" icon="hammer-wrench" variant="secondary" onPress={() => exportar('atividades')} loading={exportando === 'atividades'} disabled={!!exportando} />
        <Button title="Mão de obra e homem-hora (CSV)" icon="account-group-outline" variant="secondary" onPress={() => exportar('mao')} loading={exportando === 'mao'} disabled={!!exportando} />
        <Button
          title="Pacote de fotos (ZIP)"
          icon="folder-zip-outline"
          variant="ghost"
          onPress={() => notice({ icon: 'folder-zip-outline', title: 'Pacote de fotos', message: 'A compactação das fotos originais será feita pelo back-end (com preservação do arquivo original). Nesta versão de protótipo, use a central de arquivos e o PDF de cada RDO.' })}
        />
        <Banner tone="neutral" icon="api" message="API para integrações (ERP, SEI, BIM, Power BI) prevista no back-end; a exportação já reflete o modelo de dados." />
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
