import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { colors, radius } from '../../theme';
import {
  CONDICOES_EQUIPAMENTO, CONDICOES_TEMPO, FONTES_CLIMA, IMPACTOS_CLIMA, INSPECAO_MATERIAL, ORIGENS_PENDENCIA, PERIODOS_CLIMA,
  RESULTADOS_QUALIDADE, SITUACOES_ATIVIDADE, TIPOS_CIENCIA, TIPOS_INCIDENTE, TIPOS_QUALIDADE, TURNOS, rotuloDe,
} from '../../constants';
import { acumuladoAnterior, duracaoChuvaMin, numeroFormatado, resumoEquipamentos, totalHomemHora, totalTrabalhadores } from '../../domain/rdo';
import { combineDateTime, formatDate, formatDateTime, formatDuracao, nomeDiaSemana } from '../../utils/date';
import { formatHoras, formatNumber, formatQuantidade, isFilled, toNumber } from '../../utils/format';
import { Badge, CriticidadeBadge, Icon, KeyValue, SectionCard, Txt } from '../ui';
import PhotoTile from './PhotoTile';
import { SignatureView } from './Signature';

const conds = Object.fromEntries(CONDICOES_TEMPO.map((c) => [c.value, c]));

function Linha({ icon, children, color = colors.textMuted }) {
  return (
    <View style={styles.linha}>
      <Icon name={icon} size={16} color={color} style={{ marginTop: 2 }} />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

function ComentarSecao({ chave, contagem, onComentar }) {
  if (!onComentar && !contagem) return null;
  return (
    <Pressable
      onPress={onComentar ? () => onComentar(chave) : undefined}
      disabled={!onComentar}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`Comentários desta seção: ${contagem}. ${onComentar ? 'Toque para comentar.' : ''}`}
      style={styles.comentar}
    >
      <Icon name={contagem ? 'comment-text' : 'comment-plus-outline'} size={18} color={contagem ? colors.navy700 : colors.textMuted} />
      {contagem ? (
        <Txt v="caption" color={colors.navy700} style={{ fontWeight: '800' }}>
          {contagem}
        </Txt>
      ) : null}
    </Pressable>
  );
}

function Vazio({ texto = 'Nada registrado.' }) {
  return (
    <Txt v="small" subtle>
      {texto}
    </Txt>
  );
}

function Item({ children, style }) {
  return <View style={[styles.item, style]}>{children}</View>;
}

/**
 * Conteúdo completo do RDO em modo leitura (grupos A–M da seção 7).
 * onComentarSecao(chave) habilita o ícone de comentário por seção (comentários em contexto — RF-12).
 */
export default function RdoSections({ rdo, obra, rdos = [], nomeDe = () => '', comentarios = [], onComentarSecao, onAbrirFoto, onVerAssinatura }) {
  const { width } = useWindowDimensions();
  const contar = (k) => comentarios.filter((c) => c.contexto === k).length;
  const cs = (k) => <ComentarSecao chave={k} contagem={contar(k)} onComentar={onComentarSecao} />;
  const eq = resumoEquipamentos(rdo);
  const clima = rdo.clima;
  const duracao = duracaoChuvaMin(clima);
  const tile = Math.floor((Math.min(width, 560) - 32 - 28 - 16) / 3);
  const turno = rotuloDe(TURNOS, rdo.turno);
  const idx = (id) => rdo.ocorrencias.find((o) => o.id === id);
  const vinculo = (f) =>
    f.vinculo?.tipo === 'ocorrencia' ? idx(f.vinculo.id)?.codigo : f.vinculo?.tipo === 'atividade' ? rdo.atividades.find((a) => a.id === f.vinculo.id)?.servico : null;

  return (
    <View style={{ gap: 12 }}>
      {/* A */}
      <SectionCard letra="A" titulo="Identificação" right={cs('identificacao')}>
        <KeyValue inline label="Número / versão" value={`${numeroFormatado(rdo)} · v${rdo.versao}`} />
        <KeyValue inline label="Obra" value={obra?.nome} />
        <KeyValue inline label="Contrato / OS" value={[rdo.identificacao.contrato, rdo.identificacao.os].filter(Boolean).join(' · ')} />
        <KeyValue inline label="Cliente" value={rdo.identificacao.cliente} />
        <KeyValue inline label="Empresa executora" value={rdo.identificacao.empresa} />
        <KeyValue inline label="Endereço" value={rdo.identificacao.endereco} />
        <KeyValue inline label="Data" value={`${formatDate(rdo.data)} · ${nomeDiaSemana(rdo.data)}`} />
        <KeyValue inline label="Turno" value={turno} />
        <KeyValue inline label="Responsável pelo preenchimento" value={rdo.identificacao.responsavelPreenchimento} />
        <KeyValue inline label="Engenheiro / RT" value={rdo.identificacao.engenheiroRT} />
        <KeyValue inline label="Período contratual" value={rdo.identificacao.periodoContratual} />
      </SectionCard>

      {/* B */}
      <SectionCard letra="B" titulo="Condições climáticas" right={cs('clima')}>
        <View style={styles.periodos}>
          {PERIODOS_CLIMA.map((p) => {
            const c = clima.periodos[p.key];
            const cond = conds[c.condicao];
            return (
              <View key={p.key} style={styles.periodo} accessible accessibilityLabel={`${p.label}: ${cond?.label || 'não informado'}${c.temperatura ? `, ${c.temperatura} graus` : ''}`}>
                <Txt v="caption" muted>
                  {p.label}
                </Txt>
                <Icon name={cond?.icone || 'minus'} size={26} color={cond ? colors.navy600 : colors.borderStrong} />
                <Txt v="smallStrong" style={{ textAlign: 'center' }} numberOfLines={2}>
                  {cond?.label || '—'}
                </Txt>
                {c.temperatura ? (
                  <Txt v="caption" muted>
                    {c.temperatura} °C
                  </Txt>
                ) : null}
              </View>
            );
          })}
        </View>
        {clima.choveu ? (
          <View style={styles.chuva}>
            <Icon name="weather-pouring" size={20} color={colors.info} />
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="smallStrong" color={colors.info}>
                Chuva{clima.chuvaInicio ? ` das ${clima.chuvaInicio} às ${clima.chuvaFim}` : ''}
                {duracao !== null ? ` (${formatDuracao(duracao)})` : ''}
              </Txt>
              <Txt v="small" color={colors.info}>
                {isFilled(clima.precipitacaoMm) ? `Precipitação: ${clima.precipitacaoMm} mm · ` : ''}Impacto: {rotuloDe(IMPACTOS_CLIMA, clima.impacto).toLowerCase()}
                {clima.horasParalisadas ? ` · Paralisação: ${clima.horasParalisadas}` : ''}
              </Txt>
            </View>
          </View>
        ) : (
          <Txt v="small" muted>
            Sem chuva registrada no dia.
          </Txt>
        )}
        <KeyValue inline label="Fonte do dado" value={rotuloDe(FONTES_CLIMA, clima.fonte)} />
        {clima.observacao ? <KeyValue label="Observação" value={clima.observacao} /> : null}
      </SectionCard>

      {/* C */}
      <SectionCard letra="C" titulo="Mão de obra" right={cs('maoDeObra')} subtitulo={`Efetivo ${totalTrabalhadores(rdo)} · ${formatNumber(totalHomemHora(rdo), 0)} homem-hora`}>
        {rdo.maoDeObra.length ? (
          <View>
            <View style={[styles.tr, styles.th]}>
              <Txt v="caption" muted style={{ flex: 1 }}>
                Função / equipe
              </Txt>
              <Txt v="caption" muted style={styles.tdNum}>
                Qtd
              </Txt>
              <Txt v="caption" muted style={styles.tdNum}>
                Horas
              </Txt>
              <Txt v="caption" muted style={styles.tdNum}>
                HH
              </Txt>
            </View>
            {rdo.maoDeObra.map((m) => (
              <View key={m.id} style={styles.tr}>
                <View style={{ flex: 1 }}>
                  <Txt v="smallStrong">{m.funcao}</Txt>
                  <Txt v="caption" muted>
                    {m.empresa || '—'}
                    {m.horaInicio ? ` · ${m.horaInicio}–${m.horaFim}` : ''}
                  </Txt>
                </View>
                <Txt v="small" style={styles.tdNum}>
                  {m.quantidade}
                </Txt>
                <Txt v="small" style={styles.tdNum}>
                  {m.horas}
                </Txt>
                <Txt v="smallStrong" style={styles.tdNum}>
                  {formatNumber(toNumber(m.quantidade) * toNumber(m.horas), 0)}
                </Txt>
              </View>
            ))}
            <View style={[styles.tr, styles.total]}>
              <Txt v="smallStrong" style={{ flex: 1 }}>
                Total
              </Txt>
              <Txt v="smallStrong" style={styles.tdNum}>
                {totalTrabalhadores(rdo)}
              </Txt>
              <Txt v="small" style={styles.tdNum} />
              <Txt v="smallStrong" style={styles.tdNum}>
                {formatNumber(totalHomemHora(rdo), 0)}
              </Txt>
            </View>
          </View>
        ) : (
          <Vazio />
        )}
        {rdo.observacaoMaoDeObra ? <KeyValue label="Observações (mobilização, ausência, produtividade)" value={rdo.observacaoMaoDeObra} /> : null}
      </SectionCard>

      {/* D */}
      <SectionCard
        letra="D"
        titulo="Equipamentos"
        right={cs('equipamentos')}
        subtitulo={rdo.equipamentos.length ? `${eq.unidades} un · ${formatHoras(eq.horasProdutivas)} produtivas · ${formatHoras(eq.horasParadas)} paradas` : undefined}
      >
        {rdo.equipamentos.length ? (
          rdo.equipamentos.map((e) => (
            <Item key={e.id}>
              <View style={styles.rowBetween}>
                <Txt v="bodyStrong" style={{ flex: 1 }}>
                  {e.tipo} {e.quantidade > 1 ? `× ${e.quantidade}` : ''}
                </Txt>
                <Badge label={rotuloDe(CONDICOES_EQUIPAMENTO, e.condicao)} size="sm" color={['parado', 'manutencao'].includes(e.condicao) ? colors.danger : e.condicao === 'operante' ? colors.success : colors.warning} bg={['parado', 'manutencao'].includes(e.condicao) ? colors.dangerBg : e.condicao === 'operante' ? colors.successBg : colors.warningBg} />
              </View>
              <Txt v="small" muted>
                {e.identificacao ? `${e.identificacao} · ` : ''}Disp. {formatQuantidade(e.horasDisponiveis)} h · Prod. {formatQuantidade(e.horasProdutivas)} h · Paradas {formatQuantidade(e.horasParadas)} h
              </Txt>
              {e.motivoParada ? <Txt v="small" color={colors.warning}>Motivo da parada: {e.motivoParada}</Txt> : null}
              {e.operador ? <Txt v="caption" muted>Operador: {e.operador}</Txt> : null}
              {e.observacao ? <Txt v="caption" muted>{e.observacao}</Txt> : null}
            </Item>
          ))
        ) : (
          <Vazio />
        )}
      </SectionCard>

      {/* E */}
      <SectionCard letra="E" titulo="Atividades executadas e quantidades" right={cs('atividades')}>
        {rdo.semProducao?.ativo ? (
          <View style={[styles.chuva, { backgroundColor: colors.warningBg }]}>
            <Icon name="pause-circle-outline" size={20} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Txt v="smallStrong" color={colors.warning}>Dia sem produção</Txt>
              <Txt v="small" color={colors.warning}>{rdo.semProducao.justificativa}</Txt>
            </View>
          </View>
        ) : null}
        {rdo.atividades.map((a) => {
          const anterior = acumuladoAnterior(rdos, rdo.obraId, a.servico, rdo.data, rdo.id);
          const acumulado = anterior + toNumber(a.quantidadeDia);
          return (
            <Item key={a.id}>
              <View style={styles.rowBetween}>
                <Txt v="bodyStrong" style={{ flex: 1 }}>{a.servico}</Txt>
                <Badge label={rotuloDe(SITUACOES_ATIVIDADE, a.situacao)} size="sm" color={colors.navy700} bg={colors.blue100} />
              </View>
              {a.frente ? <Txt v="small" muted>{a.frente}</Txt> : null}
              {a.descricao ? <Txt v="small">{a.descricao}</Txt> : null}
              <View style={styles.qtd}>
                <Txt v="h3">{formatQuantidade(a.quantidadeDia)} {a.unidade}</Txt>
                <Txt v="small" muted>no dia</Txt>
                <Txt v="small" muted style={{ marginLeft: 'auto' }}>Acumulado: {formatQuantidade(acumulado)} {a.unidade}</Txt>
              </View>
              {a.referenciaEAP || a.percentual ? (
                <Txt v="caption" muted>
                  {a.referenciaEAP ? `EAP ${a.referenciaEAP}` : ''}{a.referenciaEAP && a.percentual ? ' · ' : ''}{a.percentual ? `${a.percentual}% do serviço` : ''}
                </Txt>
              ) : null}
              {a.observacao ? <Txt v="caption" muted>Obs.: {a.observacao}</Txt> : null}
            </Item>
          );
        })}
        {!rdo.atividades.length && !rdo.semProducao?.ativo ? <Vazio /> : null}
      </SectionCard>

      {/* F + G */}
      <SectionCard letra="F·G" titulo="Materiais e qualidade" right={cs('materiaisQualidade')}>
        {rdo.materiais.length ? (
          rdo.materiais.map((m) => (
            <Item key={m.id}>
              <View style={styles.rowBetween}>
                <Txt v="bodyStrong" style={{ flex: 1 }}>{m.material}</Txt>
                <Badge label={m.movimento === 'recebido' ? 'Recebido' : 'Utilizado'} size="sm" color={colors.info} bg={colors.infoBg} />
              </View>
              <Txt v="small">{formatQuantidade(m.quantidade)} {m.unidade}{m.localAplicacao ? ` · aplicado em ${m.localAplicacao}` : ''}</Txt>
              {m.fornecedor || m.notaRomaneio ? (
                <Txt v="caption" muted>{[m.fornecedor, m.notaRomaneio, m.lote && `lote ${m.lote}`].filter(Boolean).join(' · ')}</Txt>
              ) : null}
              <Txt v="caption" muted>Inspeção: {rotuloDe(INSPECAO_MATERIAL, m.inspecao)}{m.armazenamento ? ` · ${m.armazenamento}` : ''}</Txt>
            </Item>
          ))
        ) : (
          <Vazio texto={rdo.semRegistro?.materiais ? 'Sem materiais recebidos/utilizados neste dia.' : 'Nenhum material registrado.'} />
        )}
        {rdo.qualidade.length ? (
          rdo.qualidade.map((q) => (
            <Item key={q.id}>
              <View style={styles.rowBetween}>
                <Txt v="bodyStrong" style={{ flex: 1 }}>{rotuloDe(TIPOS_QUALIDADE, q.tipo)}</Txt>
                <Badge label={rotuloDe(RESULTADOS_QUALIDADE, q.resultado)} size="sm" color={q.resultado === 'conforme' ? colors.success : q.resultado === 'nao_conforme' ? colors.danger : colors.warning} bg={q.resultado === 'conforme' ? colors.successBg : q.resultado === 'nao_conforme' ? colors.dangerBg : colors.warningBg} />
              </View>
              <Txt v="small">{q.descricao}</Txt>
              {q.documento || q.responsavel ? <Txt v="caption" muted>{[q.documento, q.responsavel].filter(Boolean).join(' · ')}</Txt> : null}
            </Item>
          ))
        ) : (
          <Vazio texto={rdo.semRegistro?.qualidade ? 'Sem inspeções/ensaios neste dia.' : 'Nenhum registro de qualidade.'} />
        )}
      </SectionCard>

      {/* H */}
      <SectionCard letra="H" titulo="Segurança e meio ambiente" right={cs('seguranca')}>
        <View style={styles.chipsRow}>
          <Badge label={rdo.seguranca.dds.realizado ? 'DDS realizado' : 'DDS não realizado'} icon={rdo.seguranca.dds.realizado ? 'check' : 'close'} color={rdo.seguranca.dds.realizado ? colors.success : colors.warning} bg={rdo.seguranca.dds.realizado ? colors.successBg : colors.warningBg} />
          <Badge label={rdo.seguranca.epiEpc.conferidos ? 'EPI/EPC conferidos' : 'EPI/EPC não conferidos'} icon={rdo.seguranca.epiEpc.conferidos ? 'check' : 'close'} color={rdo.seguranca.epiEpc.conferidos ? colors.success : colors.warning} bg={rdo.seguranca.epiEpc.conferidos ? colors.successBg : colors.warningBg} />
          <Badge label={rdo.seguranca.semIncidentes ? 'Sem acidentes/incidentes' : `${rdo.seguranca.incidentes.length} incidente(s)`} icon={rdo.seguranca.semIncidentes ? 'shield-check-outline' : 'alert-outline'} color={rdo.seguranca.semIncidentes ? colors.success : colors.danger} bg={rdo.seguranca.semIncidentes ? colors.successBg : colors.dangerBg} />
        </View>
        {rdo.seguranca.dds.realizado && rdo.seguranca.dds.tema ? <KeyValue inline label="DDS" value={`${rdo.seguranca.dds.tema}${rdo.seguranca.dds.participantes ? ` · ${rdo.seguranca.dds.participantes} participantes` : ''}`} /> : null}
        {rdo.seguranca.incidentes.map((i) => (
          <Item key={i.id} style={{ borderColor: colors.danger }}>
            <Txt v="bodyStrong" color={colors.danger}>{rotuloDe(TIPOS_INCIDENTE, i.tipo)}</Txt>
            <Txt v="small">{i.descricao}</Txt>
            {i.providencia ? <Txt v="caption" muted>Providência: {i.providencia}</Txt> : null}
          </Item>
        ))}
        {rdo.seguranca.permissoes ? <KeyValue label="Permissões de trabalho" value={rdo.seguranca.permissoes} /> : null}
        {rdo.seguranca.inspecoes ? <KeyValue label="Inspeções" value={rdo.seguranca.inspecoes} /> : null}
        {rdo.seguranca.residuos ? <KeyValue label="Resíduos" value={rdo.seguranca.residuos} /> : null}
        {rdo.seguranca.condicionantes ? <KeyValue label="Condicionantes ambientais" value={rdo.seguranca.condicionantes} /> : null}
        {rdo.seguranca.providencias ? <KeyValue label="Providências" value={rdo.seguranca.providencias} /> : null}
      </SectionCard>

      {/* I + J */}
      <SectionCard letra="I·J" titulo="Ocorrências, visitas e orientações" right={cs('ocorrencias')}>
        {rdo.ocorrencias.length ? (
          rdo.ocorrencias.map((o) => (
            <Item key={o.id}>
              <View style={styles.rowBetween}>
                <Badge label={o.codigo} color={colors.white} bg={colors.navy700} size="sm" />
                <Txt v="caption" muted>{o.horario}{o.local ? ` · ${o.local}` : ''}</Txt>
              </View>
              <Txt v="small">{o.fato}</Txt>
              <View style={styles.chipsRow}>
                {o.impactoPrazo ? <Badge label="Impacto no prazo" size="sm" color={colors.warning} bg={colors.warningBg} /> : null}
                {o.impactoCusto ? <Badge label="Impacto no custo" size="sm" color={colors.warning} bg={colors.warningBg} /> : null}
                {o.impactoQualidade ? <Badge label="Impacto na qualidade" size="sm" color={colors.warning} bg={colors.warningBg} /> : null}
              </View>
              {o.acaoImediata ? <Txt v="caption" muted>Ação imediata: {o.acaoImediata}</Txt> : null}
              {o.responsavel ? <Txt v="caption" muted>Responsável: {o.responsavel}{o.prazo ? ` · prazo ${formatDate(o.prazo)}` : ''}</Txt> : null}
            </Item>
          ))
        ) : (
          <Vazio texto={rdo.semRegistro?.ocorrencias ? 'Sem ocorrências neste dia.' : 'Nenhuma ocorrência registrada.'} />
        )}
        {rdo.visitas.length ? (
          rdo.visitas.map((v) => (
            <Item key={v.id}>
              <Txt v="bodyStrong">{v.visitante}</Txt>
              <Txt v="small" muted>{v.empresaCargo}{v.entrada ? ` · ${v.entrada}–${v.saida || '…'}` : ''}</Txt>
              <Txt v="small">Motivo: {v.motivo}</Txt>
              {v.orientacao ? <Txt v="small">Orientação: {v.orientacao}</Txt> : null}
              {v.atendidoPor ? <Txt v="caption" muted>Atendido por: {v.atendidoPor}</Txt> : null}
            </Item>
          ))
        ) : (
          <Vazio texto={rdo.semRegistro?.visitas ? 'Sem visitas neste dia.' : 'Nenhuma visita registrada.'} />
        )}
      </SectionCard>

      {/* K */}
      <SectionCard letra="K" titulo="Registro fotográfico" right={cs('fotos')} subtitulo={`${rdo.fotos.length} ${rdo.fotos.length === 1 ? 'foto' : 'fotos'}`}>
        {rdo.fotos.length ? (
          <View style={styles.grid}>
            {rdo.fotos.map((f, i) => (
              <View key={f.id} style={{ width: tile, gap: 4 }}>
                <PhotoTile foto={f} width={tile} onPress={onAbrirFoto ? () => onAbrirFoto(i) : undefined} />
                <Txt v="caption" muted numberOfLines={2}>
                  {f.legenda || 'Sem legenda'}
                </Txt>
              </View>
            ))}
          </View>
        ) : (
          <Vazio texto="Nenhuma foto anexada." />
        )}
      </SectionCard>

      {/* L */}
      <SectionCard letra="L" titulo="Pendências e planejamento" right={cs('pendencias')}>
        {rdo.pendencias.length ? (
          rdo.pendencias.map((p) => {
            const vencida = p.status !== 'resolvida' && p.prazo && new Date(combineDateTime(p.prazo, p.prazoHora || '23:59')).getTime() < Date.now();
            return (
              <Item key={p.id} style={vencida ? { borderColor: colors.danger } : undefined}>
                <View style={styles.rowBetween}>
                  <CriticidadeBadge nivel={p.criticidade} size="sm" />
                  <Badge label={p.status === 'resolvida' ? 'Resolvida' : p.status === 'andamento' ? 'Em andamento' : 'Aberta'} size="sm" color={p.status === 'resolvida' ? colors.success : colors.navy700} bg={p.status === 'resolvida' ? colors.successBg : colors.blue100} />
                </View>
                <Txt v="small">{p.descricao}</Txt>
                <Txt v="caption" muted>Origem: {rotuloDe(ORIGENS_PENDENCIA, p.origem)} · Responsável: {p.responsavel}</Txt>
                <Txt v="caption" color={vencida ? colors.danger : colors.textMuted} style={vencida ? { fontWeight: '800' } : undefined}>
                  Prazo: {formatDate(p.prazo)}{p.prazoHora ? ` ${p.prazoHora}` : ''}{vencida ? ' · vencida' : ''}
                </Txt>
              </Item>
            );
          })
        ) : (
          <Vazio texto={rdo.semRegistro?.pendencias ? 'Sem pendências neste dia.' : 'Nenhuma pendência registrada.'} />
        )}
        {rdo.planejamento.proximoDia ? <KeyValue label="Atividade prevista para o próximo dia" value={rdo.planejamento.proximoDia} /> : null}
        {rdo.planejamento.restricoes ? <KeyValue label="Restrições" value={rdo.planejamento.restricoes} /> : null}
        {rdo.observacoesGerais ? <KeyValue label="Observações gerais" value={rdo.observacoesGerais} /> : null}
      </SectionCard>

      {/* M */}
      <SectionCard letra="M" titulo="Aprovações e assinaturas" tone="gold" right={cs('revisao')}>
        <Linha icon={rdo.declaracao?.aceita ? 'check-circle' : 'circle-outline'} color={rdo.declaracao?.aceita ? colors.success : colors.textMuted}>
          <Txt v="smallStrong">Declaração de responsabilidade</Txt>
          <Txt v="small" muted>
            {rdo.declaracao?.aceita ? `Aceita por ${nomeDe(rdo.autorId)}${rdo.declaracao.dataHora ? ` em ${formatDateTime(rdo.declaracao.dataHora)}` : ''}` : 'Ainda não aceita'}
          </Txt>
        </Linha>
        {rdo.assinaturaOperacional ? (
          <View style={styles.assin}>
            <Txt v="smallStrong">Responsável pelo preenchimento</Txt>
            <SignatureView dados={rdo.assinaturaOperacional} height={64} />
            <Txt v="caption" muted>{rdo.assinaturaOperacional.nome} · {formatDateTime(rdo.assinaturaOperacional.dataHora)}</Txt>
          </View>
        ) : null}
        <AssinaturaLinha titulo="Validação e assinatura do master" dados={rdo.assinaturas?.master} pendente="Aguardando validação do master" onPress={onVerAssinatura ? () => onVerAssinatura('master') : undefined} />
        <AssinaturaLinha titulo="Ciência/aceite do cliente" dados={rdo.assinaturas?.cliente} pendente={rdo.status === 'enviado_cliente' ? 'Aguardando ciência/aceite do cliente' : 'Ainda não enviado ao cliente'} onPress={onVerAssinatura ? () => onVerAssinatura('cliente') : undefined} cliente />
      </SectionCard>
    </View>
  );
}

function AssinaturaLinha({ titulo, dados, pendente, onPress, cliente }) {
  if (!dados) {
    return (
      <Linha icon="clock-outline">
        <Txt v="smallStrong">{titulo}</Txt>
        <Txt v="small" muted>{pendente}</Txt>
      </Linha>
    );
  }
  const tipo = cliente ? TIPOS_CIENCIA[dados.tipo] : null;
  return (
    <Pressable onPress={onPress} disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={`${titulo}, assinado por ${dados.nome}. ${onPress ? 'Ver comprovante.' : ''}`} style={styles.assin}>
      <View style={styles.rowBetween}>
        <Txt v="smallStrong" style={{ flex: 1 }}>{titulo}</Txt>
        {tipo ? <Badge label={tipo.curto} size="sm" color={dados.tipo === 'ressalva' ? colors.warning : colors.success} bg={dados.tipo === 'ressalva' ? colors.warningBg : colors.successBg} icon={tipo.icone} /> : <Badge label="Assinado" size="sm" color={colors.success} bg={colors.successBg} icon="check-decagram-outline" />}
      </View>
      <SignatureView dados={dados} height={64} />
      <Txt v="caption" muted>{dados.nome} · {formatDateTime(dados.dataHora)} · v{dados.versao}</Txt>
      {dados.texto ? <Txt v="small" color={colors.goldText}>Ressalva: “{dados.texto}”</Txt> : null}
      {onPress ? <Txt v="caption" color={colors.blue500} style={{ fontWeight: '800' }}>Ver comprovante e evidências ›</Txt> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  linha: { flexDirection: 'row', gap: 10 },
  comentar: { flexDirection: 'row', alignItems: 'center', gap: 3, minWidth: 36, minHeight: 36, justifyContent: 'center' },
  item: { borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.blue50, borderRadius: radius.md, padding: 10, gap: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  periodos: { flexDirection: 'row', gap: 8 },
  periodo: { flex: 1, alignItems: 'center', gap: 3, padding: 10, borderRadius: radius.md, backgroundColor: colors.blue50, minHeight: 104 },
  chuva: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderRadius: radius.md, backgroundColor: colors.infoBg },
  tr: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
  th: { paddingVertical: 4 },
  total: { backgroundColor: colors.blue50, borderBottomWidth: 0, paddingHorizontal: 4 },
  tdNum: { width: 44, textAlign: 'right' },
  qtd: { flexDirection: 'row', alignItems: 'baseline', gap: 6, flexWrap: 'wrap' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  assin: { backgroundColor: colors.white, borderRadius: radius.md, padding: 10, gap: 6, borderWidth: 1, borderColor: colors.gold200 },
});
