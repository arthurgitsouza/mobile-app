// Gerador do PDF padronizado do RDO (RF-15): HTML A4 autocontido com dados, fotos, comentários,
// assinaturas, QR code/hash de verificação e trilha de aprovação. JS puro (testável em Node).

import {
  CONDICOES_EQUIPAMENTO, CONDICOES_TEMPO, EVENTOS_AUDITORIA, FONTES_CLIMA, IMPACTOS_CLIMA, INSPECAO_MATERIAL, ORIGENS_PENDENCIA,
  PERIODOS_CLIMA, PERFIS, RESULTADOS_QUALIDADE, SITUACOES_ATIVIDADE, TIPOS_CIENCIA, TIPOS_INCIDENTE, TIPOS_QUALIDADE, TURNOS, rotuloDe,
} from '../constants/index.js';
import { acumuladoAnterior, duracaoChuvaMin, numeroFormatado, resumoEquipamentos, totalHomemHora, totalTrabalhadores } from '../domain/rdo.js';
import { payloadVerificacao } from '../domain/integridade.js';
import { formatDate, formatDateTime, formatDuracao, nomeDiaSemana, FUSO_OBRA_LABEL } from './date.js';
import { formatNumber, formatQuantidade, toNumber } from './format.js';
import { assinaturaSvg, qrSvg } from './svg.js';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const val = (v) => (v === undefined || v === null || v === '' ? '—' : esc(v));
const conds = Object.fromEntries(CONDICOES_TEMPO.map((c) => [c.value, c.label]));

const PH = {
  blue: ['#DDEAF6', '#8DA6C2', '#17375E'],
  green: ['#E2EDD9', '#9DB58A', '#2F5A1F'],
  peach: ['#FBE4D6', '#D9A688', '#7A3B14'],
};

const CSS = `
@page { size: A4; margin: 12mm; }
* { box-sizing: border-box; }
body { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; color: #14253B; font-size: 11px; line-height: 1.4; margin: 0; }
.top { background: #17375E; color: #fff; padding: 14px 16px; border-bottom: 4px solid #D9A441; display: flex; justify-content: space-between; align-items: center; border-radius: 8px 8px 0 0; }
.top h1 { font-size: 19px; margin: 0 0 2px; letter-spacing: -.2px; }
.top .sub { opacity: .88; font-size: 11px; }
.badge { background: #D9A441; color: #0C2038; padding: 4px 10px; border-radius: 99px; font-weight: 800; font-size: 10px; text-transform: uppercase; letter-spacing: .4px; white-space: nowrap; }
.sec { border: 1px solid #D7E0EB; border-radius: 8px; margin: 10px 0; page-break-inside: avoid; }
.sec > h2 { margin: 0; padding: 7px 10px; background: #F1F6FC; color: #1F4E79; font-size: 10.5px; letter-spacing: .6px; text-transform: uppercase; border-bottom: 1px solid #D7E0EB; border-radius: 8px 8px 0 0; }
.sec > h2 span { display: inline-block; background: #17375E; color: #fff; border-radius: 5px; padding: 1px 6px; margin-right: 6px; }
.sec > .b { padding: 8px 10px; }
.kv { display: flex; gap: 8px; padding: 2px 0; } .kv .k { width: 34%; color: #4E617A; } .kv .v { flex: 1; }
table { width: 100%; border-collapse: collapse; }
th, td { text-align: left; padding: 4px 6px; border-bottom: 1px solid #E6ECF3; vertical-align: top; }
th { font-size: 9px; text-transform: uppercase; color: #4E617A; letter-spacing: .4px; }
td.n, th.n { text-align: right; white-space: nowrap; }
tr.total td { background: #F1F6FC; font-weight: 700; }
.item { border: 1px solid #E6ECF3; background: #F8FAFD; border-radius: 6px; padding: 6px 8px; margin: 5px 0; page-break-inside: avoid; }
.chip { display: inline-block; padding: 1px 7px; border-radius: 99px; font-size: 9.5px; font-weight: 700; background: #E3EEFB; color: #17375E; margin-right: 4px; }
.chip.w { background: #FDEBD3; color: #9A4F00; } .chip.ok { background: #DDF3E6; color: #1B6E45; } .chip.d { background: #FDE4E1; color: #B0281C; }
.muted { color: #4E617A; } .small { font-size: 9.5px; }
.periodos { display: flex; gap: 6px; } .periodos div { flex: 1; text-align: center; background: #F1F6FC; border-radius: 6px; padding: 6px; }
.photos { display: flex; flex-wrap: wrap; gap: 8px; } .ph { width: 31.5%; page-break-inside: avoid; }
.ph .img { height: 92px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-weight: 800; letter-spacing: 1px; overflow: hidden; border: 1px solid; }
.ph .img img { width: 100%; height: 100%; object-fit: cover; }
.ph .cap { font-size: 9.5px; margin-top: 3px; }
.gold { background: #FFF8E6; border-color: #D9A441; } .gold > h2 { background: #FFF1CF; color: #6B4700; }
.assin { display: inline-block; vertical-align: top; width: 48.5%; background: #fff; border: 1px solid #F3DDA6; border-radius: 6px; padding: 6px 8px; margin: 3px 0; }
.mono { font-family: Menlo, Consolas, monospace; font-size: 8.5px; word-break: break-all; }
.verify { display: flex; gap: 12px; align-items: center; }
.wm { position: fixed; top: 38%; left: 8%; font-size: 96px; font-weight: 900; color: rgba(185,131,34,.13); transform: rotate(-28deg); z-index: 0; letter-spacing: 6px; }
.foot { font-size: 9px; color: #71849C; text-align: center; margin-top: 10px; }
`;

const kv = (k, v) => `<div class="kv"><div class="k">${esc(k)}</div><div class="v">${val(v)}</div></div>`;
const sec = (letra, titulo, corpo, extra = '') => `<div class="sec ${extra}"><h2><span>${esc(letra)}</span>${esc(titulo)}</h2><div class="b">${corpo}</div></div>`;
const chip = (t, k = '') => `<span class="chip ${k}">${esc(t)}</span>`;

export function montarHtmlRdo({ rdo, obra, nomeDe = () => '', rdos = [], fotosBase64 = {}, geradoEm, minuta }) {
  const num = numeroFormatado(rdo);
  const finalizado = rdo.status === 'finalizado';
  const turno = rotuloDe(TURNOS, rdo.turno);
  const c = rdo.clima;
  const dur = duracaoChuvaMin(c);
  const eq = resumoEquipamentos(rdo);
  const situacao = { rascunho: 'Rascunho', submetido: 'Submetido', em_analise: 'Em análise', devolvido: 'Devolvido', validado: 'Validado', enviado_cliente: 'Enviado ao cliente', finalizado: 'Finalizado', retificado: 'Retificado', cancelado: 'Cancelado' }[rdo.status];

  const A = sec('A', 'Identificação', [
    kv('Número / versão', `${num} · v${rdo.versao}`), kv('Obra', obra?.nome), kv('Contrato / OS', [rdo.identificacao.contrato, rdo.identificacao.os].filter(Boolean).join(' · ')),
    kv('Cliente', rdo.identificacao.cliente), kv('Empresa executora', rdo.identificacao.empresa), kv('Endereço', rdo.identificacao.endereco),
    kv('Data', `${formatDate(rdo.data)} · ${nomeDiaSemana(rdo.data)}`), kv('Turno', turno), kv('Responsável pelo preenchimento', rdo.identificacao.responsavelPreenchimento),
    kv('Engenheiro / RT', rdo.identificacao.engenheiroRT), kv('Período contratual', rdo.identificacao.periodoContratual), kv('Fuso horário', FUSO_OBRA_LABEL),
  ].join(''));

  const B = sec('B', 'Condições climáticas', `
    <div class="periodos">${PERIODOS_CLIMA.map((p) => `<div><div class="muted small">${p.label}</div><b>${esc(conds[c.periodos[p.key].condicao] || '—')}</b>${c.periodos[p.key].temperatura ? `<div class="small">${esc(c.periodos[p.key].temperatura)} °C</div>` : ''}</div>`).join('')}</div>
    ${c.choveu ? `<div class="item">${chip('Chuva', 'w')}${c.chuvaInicio ? `${esc(c.chuvaInicio)}–${esc(c.chuvaFim)}${dur !== null ? ` (${formatDuracao(dur)})` : ''}` : ''}${c.precipitacaoMm ? ` · precipitação ${esc(c.precipitacaoMm)} mm` : ''} · impacto: ${esc(rotuloDe(IMPACTOS_CLIMA, c.impacto).toLowerCase())}${c.horasParalisadas ? ` · paralisação ${esc(c.horasParalisadas)}` : ''}</div>` : '<div class="muted">Sem chuva registrada.</div>'}
    ${kv('Fonte do dado', rotuloDe(FONTES_CLIMA, c.fonte))}${c.observacao ? kv('Observação', c.observacao) : ''}`);

  const C = sec('C', 'Mão de obra', `
    <table><tr><th>Função / equipe</th><th class="n">Qtd</th><th class="n">Horas</th><th class="n">HH</th></tr>
    ${rdo.maoDeObra.map((m) => `<tr><td><b>${esc(m.funcao)}</b><div class="muted small">${esc(m.empresa)}${m.horaInicio ? ` · ${esc(m.horaInicio)}–${esc(m.horaFim)}` : ''}</div></td><td class="n">${esc(m.quantidade)}</td><td class="n">${esc(m.horas)}</td><td class="n">${formatNumber(toNumber(m.quantidade) * toNumber(m.horas), 0)}</td></tr>`).join('') || '<tr><td colspan="4" class="muted">Nada registrado.</td></tr>'}
    <tr class="total"><td>Total</td><td class="n">${totalTrabalhadores(rdo)}</td><td class="n"></td><td class="n">${formatNumber(totalHomemHora(rdo), 0)}</td></tr></table>
    ${rdo.observacaoMaoDeObra ? kv('Observações', rdo.observacaoMaoDeObra) : ''}`);

  const D = sec('D', 'Equipamentos', rdo.equipamentos.length
    ? `<table><tr><th>Equipamento</th><th class="n">Disp.</th><th class="n">Prod.</th><th class="n">Paradas</th><th>Condição</th></tr>${rdo.equipamentos.map((e) => `<tr><td><b>${esc(e.tipo)}${toNumber(e.quantidade) > 1 ? ` × ${esc(e.quantidade)}` : ''}</b><div class="muted small">${esc(e.identificacao)}${e.operador ? ` · operador: ${esc(e.operador)}` : ''}${e.motivoParada ? ` · parada: ${esc(e.motivoParada)}` : ''}${e.observacao ? ` · ${esc(e.observacao)}` : ''}</div></td><td class="n">${esc(e.horasDisponiveis)} h</td><td class="n">${esc(e.horasProdutivas)} h</td><td class="n">${esc(e.horasParadas)} h</td><td>${esc(rotuloDe(CONDICOES_EQUIPAMENTO, e.condicao))}</td></tr>`).join('')}<tr class="total"><td>${eq.unidades} unidade(s)</td><td class="n">${formatQuantidade(eq.horasDisponiveis)} h</td><td class="n">${formatQuantidade(eq.horasProdutivas)} h</td><td class="n">${formatQuantidade(eq.horasParadas)} h</td><td></td></tr></table>`
    : '<div class="muted">Nada registrado.</div>');

  const E = sec('E', 'Atividades executadas e quantidades', `${rdo.semProducao?.ativo ? `<div class="item">${chip('Dia sem produção', 'w')} ${esc(rdo.semProducao.justificativa)}</div>` : ''}${rdo.atividades.map((a) => {
    const acum = acumuladoAnterior(rdos, rdo.obraId, a.servico, rdo.data, rdo.id) + toNumber(a.quantidadeDia);
    return `<div class="item"><b>${esc(a.servico)}</b> ${chip(rotuloDe(SITUACOES_ATIVIDADE, a.situacao))}<div class="muted small">${esc(a.frente)}</div>${a.descricao ? `<div>${esc(a.descricao)}</div>` : ''}<div><b>${formatQuantidade(a.quantidadeDia)} ${esc(a.unidade)}</b> no dia · acumulado ${formatQuantidade(acum)} ${esc(a.unidade)}${a.referenciaEAP ? ` · EAP ${esc(a.referenciaEAP)}` : ''}${a.percentual ? ` · ${esc(a.percentual)}%` : ''}</div>${a.observacao ? `<div class="muted small">Obs.: ${esc(a.observacao)}</div>` : ''}</div>`;
  }).join('') || (rdo.semProducao?.ativo ? '' : '<div class="muted">Nada registrado.</div>')}`);

  const FG = sec('F·G', 'Materiais e qualidade', `${rdo.materiais.map((m) => `<div class="item"><b>${esc(m.material)}</b> ${chip(m.movimento === 'recebido' ? 'Recebido' : 'Utilizado')} — ${formatQuantidade(m.quantidade)} ${esc(m.unidade)}<div class="muted small">${[m.fornecedor, m.notaRomaneio, m.lote && `lote ${m.lote}`, m.localAplicacao && `aplicado em ${m.localAplicacao}`, `inspeção: ${rotuloDe(INSPECAO_MATERIAL, m.inspecao)}`].filter(Boolean).map(esc).join(' · ')}</div></div>`).join('') || '<div class="muted">Sem materiais registrados.</div>'}
    ${rdo.qualidade.map((q) => `<div class="item"><b>${esc(rotuloDe(TIPOS_QUALIDADE, q.tipo))}</b> ${chip(rotuloDe(RESULTADOS_QUALIDADE, q.resultado), q.resultado === 'conforme' ? 'ok' : q.resultado === 'nao_conforme' ? 'd' : 'w')}<div>${esc(q.descricao)}</div><div class="muted small">${[q.documento, q.responsavel].filter(Boolean).map(esc).join(' · ')}</div></div>`).join('') || '<div class="muted">Sem registros de qualidade.</div>'}`);

  const s = rdo.seguranca;
  const H = sec('H', 'Segurança e meio ambiente', `${chip(s.dds.realizado ? 'DDS realizado' : 'DDS não realizado', s.dds.realizado ? 'ok' : 'w')}${chip(s.epiEpc.conferidos ? 'EPI/EPC conferidos' : 'EPI/EPC não conferidos', s.epiEpc.conferidos ? 'ok' : 'w')}${chip(s.semIncidentes ? 'Sem acidentes/incidentes' : `${s.incidentes.length} incidente(s)`, s.semIncidentes ? 'ok' : 'd')}
    ${s.dds.tema ? kv('DDS', `${s.dds.tema}${s.dds.participantes ? ` · ${s.dds.participantes} participantes` : ''}`) : ''}${s.incidentes.map((i) => `<div class="item"><b>${esc(rotuloDe(TIPOS_INCIDENTE, i.tipo))}</b><div>${esc(i.descricao)}</div><div class="muted small">${esc(i.providencia)}</div></div>`).join('')}
    ${['permissoes', 'inspecoes', 'residuos', 'condicionantes', 'providencias'].filter((k) => s[k]).map((k) => kv({ permissoes: 'Permissões de trabalho', inspecoes: 'Inspeções', residuos: 'Resíduos', condicionantes: 'Condicionantes ambientais', providencias: 'Providências' }[k], s[k])).join('')}`);

  const IJ = sec('I·J', 'Ocorrências, visitas e orientações', `${rdo.ocorrencias.map((o) => `<div class="item"><b>${esc(o.codigo)}</b> · ${esc(o.horario)}${o.local ? ` · ${esc(o.local)}` : ''}<div>${esc(o.fato)}</div><div>${o.impactoPrazo ? chip('Prazo', 'w') : ''}${o.impactoCusto ? chip('Custo', 'w') : ''}${o.impactoQualidade ? chip('Qualidade', 'w') : ''}</div><div class="muted small">${[o.acaoImediata && `Ação: ${o.acaoImediata}`, o.responsavel && `Responsável: ${o.responsavel}`, o.prazo && `Prazo: ${formatDate(o.prazo)}`].filter(Boolean).map(esc).join(' · ')}</div></div>`).join('') || '<div class="muted">Sem ocorrências.</div>'}
    ${rdo.visitas.map((v) => `<div class="item"><b>${esc(v.visitante)}</b> <span class="muted">${esc(v.empresaCargo)}</span> · ${esc(v.entrada)}–${esc(v.saida)}<div>Motivo: ${esc(v.motivo)}</div>${v.orientacao ? `<div>Orientação: ${esc(v.orientacao)}</div>` : ''}</div>`).join('') || '<div class="muted">Sem visitas.</div>'}`);

  const vinculo = (f) => (f.vinculo?.tipo === 'ocorrencia' ? rdo.ocorrencias.find((o) => o.id === f.vinculo.id)?.codigo : f.vinculo?.tipo === 'atividade' ? rdo.atividades.find((a) => a.id === f.vinculo.id)?.servico : '');
  const K = sec('K', 'Registro fotográfico', rdo.fotos.length
    ? `<div class="photos">${rdo.fotos.map((f) => {
      const p = PH[f.cor] || PH.blue;
      const n = String(f.numero).padStart(2, '0');
      return `<div class="ph"><div class="img" style="background:${p[0]};border-color:${p[1]};color:${p[2]}">${fotosBase64[f.id] ? `<img src="${fotosBase64[f.id]}"/>` : `FOTO ${n}`}</div><div class="cap"><b>Foto ${n}</b> — ${esc(f.legenda)}<div class="muted">${[f.local, vinculo(f) && `vínculo: ${vinculo(f)}`, formatDateTime(f.dataHora), nomeDe(f.autorId), f.coordenada && `GPS ${f.coordenada.lat.toFixed(5)}, ${f.coordenada.lng.toFixed(5)}`].filter(Boolean).map(esc).join(' · ')}</div></div></div>`;
    }).join('')}</div>`
    : '<div class="muted">Nenhuma foto anexada.</div>');

  const L = sec('L', 'Pendências e planejamento', `${rdo.pendencias.map((p) => `<div class="item"><b>${esc(p.descricao)}</b><div>${chip(rotuloDe([{ value: 'baixa', label: 'Baixa' }, { value: 'media', label: 'Média' }, { value: 'alta', label: 'Alta' }, { value: 'critica', label: 'Crítica' }], p.criticidade), p.criticidade === 'alta' || p.criticidade === 'critica' ? 'd' : '')}<span class="muted small"> ${esc(rotuloDe(ORIGENS_PENDENCIA, p.origem))} · ${esc(p.responsavel)} · prazo ${formatDate(p.prazo)} ${esc(p.prazoHora || '')} · ${esc(p.status)}</span></div></div>`).join('') || '<div class="muted">Sem pendências.</div>'}
    ${rdo.planejamento.proximoDia ? kv('Próximo dia', rdo.planejamento.proximoDia) : ''}${rdo.planejamento.restricoes ? kv('Restrições', rdo.planejamento.restricoes) : ''}${rdo.observacoesGerais ? kv('Observações gerais', rdo.observacoesGerais) : ''}`);

  const assinBloco = (titulo, a, cliente) => (a
    ? `<div class="assin"><b>${esc(titulo)}</b>${assinaturaSvg(a, 170, 62)}<div class="small">${esc(a.nome)} · ${esc(PERFIS[a.papel]?.label || '')}</div><div class="small muted">${formatDateTime(a.dataHora)} · v${a.versao} · 2º fator: ${a.metodo2fa === 'biometria' ? 'biometria' : 'código único'}</div><div class="small muted">${esc(a.ip)} · ${esc(a.dispositivo)}</div>${cliente ? `<div>${chip(TIPOS_CIENCIA[a.tipo]?.curto || '', a.tipo === 'ressalva' ? 'w' : 'ok')}</div>${a.texto ? `<div class="small"><b>Ressalva:</b> “${esc(a.texto)}”</div>` : ''}` : ''}</div>`
    : `<div class="assin muted"><b>${esc(titulo)}</b><div class="small">Pendente</div></div>`);
  const M = sec('M', 'Aprovações e assinaturas', `
    <div>${rdo.declaracao?.aceita ? chip('Declaração de responsabilidade aceita', 'ok') : chip('Declaração pendente', 'w')} <span class="small muted">${nomeDe(rdo.autorId)}${rdo.declaracao?.dataHora ? ` · ${formatDateTime(rdo.declaracao.dataHora)}` : ''}</span></div>
    ${rdo.assinaturaOperacional ? `<div class="assin"><b>Responsável pelo preenchimento</b>${assinaturaSvg(rdo.assinaturaOperacional, 170, 62)}<div class="small">${esc(rdo.assinaturaOperacional.nome)} · ${formatDateTime(rdo.assinaturaOperacional.dataHora)}</div></div>` : ''}
    ${assinBloco('Validação e assinatura do master', rdo.assinaturas?.master, false)}${assinBloco('Ciência/aceite do cliente', rdo.assinaturas?.cliente, true)}
    <div class="small muted" style="margin-top:6px">O desenho é apenas a representação visual da assinatura. A validade decorre da sessão autenticada, do segundo fator e das evidências acima (identidade, data/hora, versão, IP, dispositivo e hash do conteúdo).</div>`, 'gold');

  // O PDF reproduz apenas comentários visíveis ao cliente (as notas internas do master/operacional não saem no documento).
  const publicos = rdo.comentarios.filter((cm) => cm.visibilidade === 'cliente');
  const CM = publicos.length
    ? sec('C', 'Comentários e esclarecimentos', publicos.map((cm) => `<div class="item"><b>${esc(nomeDe(cm.autorId))}</b> <span class="muted small">${formatDateTime(cm.dataHora)}</span><div>${esc(cm.texto)}</div></div>`).join(''))
    : '';

  const trilha = sec('§', 'Trilha de aprovação e auditoria', `<table><tr><th>Data/hora</th><th>Evento</th><th>Usuário</th><th class="n">Ver.</th></tr>${[...rdo.auditoria].filter((a) => a.evento !== 'visualizacao').sort((a, b) => (a.dataHora > b.dataHora ? 1 : -1)).map((a) => `<tr><td class="small">${formatDateTime(a.dataHora)}</td><td>${esc(EVENTOS_AUDITORIA[a.evento]?.label || a.evento)}${a.detalhe ? `<div class="muted small">${esc(String(a.detalhe).slice(0, 140))}</div>` : ''}</td><td>${esc(nomeDe(a.usuarioId) || 'Sistema')}</td><td class="n">v${a.versao ?? 1}</td></tr>`).join('')}</table>`);

  const hash = rdo.hashFinal || rdo.hashTecnico;
  const verificacao = sec('#', 'Verificação de autenticidade', `<div class="verify">${hash ? qrSvg(payloadVerificacao(rdo), 118) : ''}<div>
    ${hash ? `<div class="small muted">Hash ${rdo.hashFinal ? 'final (conteúdo + assinaturas)' : 'do conteúdo técnico'} — SHA-256</div><div class="mono">${esc(hash)}</div>${rdo.hashFinal && rdo.hashTecnico ? `<div class="small muted" style="margin-top:4px">Hash do conteúdo técnico</div><div class="mono">${esc(rdo.hashTecnico)}</div>` : ''}<div class="small muted" style="margin-top:4px">Verificação: ${esc(payloadVerificacao(rdo))}</div>` : '<div class="muted">Documento ainda não assinado — sem hash de verificação.</div>'}</div></div>`);

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RDO ${num} — ${esc(obra?.nome)}</title><style>${CSS}</style></head><body>
  ${minuta || !finalizado ? '<div class="wm">MINUTA</div>' : ''}
  <div class="top"><div><h1>RDO ${num} · ${esc(obra?.nome)}</h1><div class="sub">Registro Diário de Obra · versão ${rdo.versao} · ${formatDate(rdo.data)} (${nomeDiaSemana(rdo.data)}) · ${esc(turno)}</div></div><div class="badge">${minuta || !finalizado ? 'Minuta · ' : ''}${esc(situacao)}</div></div>
  ${A}${B}${C}${D}${E}${FG}${H}${IJ}${K}${L}${M}${CM}${trilha}${verificacao}
  <div class="foot">Gerado pelo RDO Mobile em ${formatDateTime(geradoEm || new Date().toISOString())} (${FUSO_OBRA_LABEL}) · ${esc(rdo.identificacao.empresa)}${minuta || !finalizado ? ' · MINUTA sem valor de assinatura completa' : ''}</div>
  </body></html>`;
}

export function nomeArquivoPdf(rdo, obra) {
  const limpa = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9]+/g, '');
  return `RDO-${numeroFormatado(rdo)}_${limpa(obra?.nome)}_${rdo.data}_v${rdo.versao}${rdo.status === 'finalizado' ? '' : '_minuta'}.pdf`;
}
