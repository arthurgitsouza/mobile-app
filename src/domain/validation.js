// Regras de negócio e validações do RDO (seção 9 do documento-base).
// `erros` bloqueiam a submissão; `avisos` alertam sem bloquear.

import { isFilled, isValidNumber, toNumber, numeroRdo } from '../utils/format.js';
import { isFuture, timeToMinutes } from '../utils/date.js';
import { PASSOS_RDO } from '../constants/index.js';
import { chaveUnicidade, duracaoChuvaMin, rdosAtivos } from './rdo.js';

const CONDICOES_CHUVA = ['chuva_fraca', 'chuva_moderada', 'chuva_forte'];

export function validarRdo(rdo, { obra, rdos = [], agora } = {}) {
  const erros = [];
  const avisos = [];
  const erro = (passo, campo, mensagem, ref) => erros.push({ passo, campo, mensagem, ref });
  const aviso = (passo, campo, mensagem, ref) => avisos.push({ passo, campo, mensagem, ref });

  // ---- A. Identificação ----
  if (!rdo.obraId) erro('identificacao', 'obraId', 'Selecione a obra.');
  if (!rdo.data) erro('identificacao', 'data', 'Informe a data do RDO.');
  else if (isFuture(rdo.data, agora)) erro('identificacao', 'data', 'A data do RDO não pode ser futura.');
  if (!rdo.turno) erro('identificacao', 'turno', 'Informe o turno.');
  if (!isFilled(rdo.identificacao?.responsavelPreenchimento)) erro('identificacao', 'responsavel', 'Informe o responsável pelo preenchimento.');

  const duplicado = rdosAtivos(rdos).find((r) => r.id !== rdo.id && r.numero !== rdo.numero && chaveUnicidade(r) === chaveUnicidade(rdo));
  if (duplicado) aviso('identificacao', 'data', `Já existe o RDO ${numeroRdo(duplicado.numero)} para esta obra, data e turno.`);

  // ---- B. Clima ----
  const clima = rdo.clima || {};
  const periodos = Object.values(clima.periodos || {});
  if (!periodos.some((p) => isFilled(p.condicao))) erro('clima', 'periodos', 'Informe a condição do tempo em pelo menos um período.');
  periodos.forEach((p) => {
    if (isFilled(p.temperatura) && !isValidNumber(p.temperatura)) erro('clima', 'temperatura', 'Temperatura inválida.');
  });
  const marcouChuvaNoPeriodo = periodos.some((p) => CONDICOES_CHUVA.includes(p.condicao));
  if (clima.choveu) {
    const temDuracao = isFilled(clima.chuvaInicio) && isFilled(clima.chuvaFim);
    const temMm = isValidNumber(clima.precipitacaoMm);
    if (!temDuracao && !temMm) erro('clima', 'chuva', 'Houve chuva: informe a duração (início e fim) e/ou a precipitação em mm.');
    if (temDuracao) {
      if (timeToMinutes(clima.chuvaInicio) === null || timeToMinutes(clima.chuvaFim) === null) erro('clima', 'chuvaHorario', 'Horário da chuva inválido (use HH:MM).');
      else if (duracaoChuvaMin(clima) === null) erro('clima', 'chuvaHorario', 'O fim da chuva deve ser posterior ao início.');
    }
    if (!clima.impacto) erro('clima', 'impacto', 'Informe o impacto da chuva no serviço.');
    if (clima.impacto && clima.impacto !== 'nenhum' && timeToMinutes(clima.horasParalisadas) === null) {
      erro('clima', 'horasParalisadas', 'Informe as horas paralisadas (HH:MM) pelo impacto da chuva.');
    }
  } else if (marcouChuvaNoPeriodo) {
    aviso('clima', 'choveu', 'Você registrou chuva em um período: marque "Houve chuva" para informar duração e impacto.');
  }

  // ---- C. Mão de obra ----
  const chaves = new Set();
  (rdo.maoDeObra || []).forEach((m, i) => {
    const nome = m.funcao || `Item ${i + 1}`;
    if (!isFilled(m.funcao)) erro('maoDeObra', 'funcao', `Mão de obra ${i + 1}: informe a função.`, m.id);
    if (toNumber(m.quantidade) < 1) erro('maoDeObra', 'quantidade', `${nome}: quantidade deve ser ao menos 1.`, m.id);
    const horas = toNumber(m.horas);
    if (!(horas > 0 && horas <= 24)) erro('maoDeObra', 'horas', `${nome}: informe as horas trabalhadas (0–24).`, m.id);
    const chave = `${(m.empresa || '').toLowerCase()}|${(m.funcao || '').toLowerCase()}`;
    if (chaves.has(chave)) aviso('maoDeObra', 'funcao', `${nome} aparece mais de uma vez para a mesma equipe: some as quantidades em uma linha (evita dupla contagem).`, m.id);
    chaves.add(chave);
  });
  if (!(rdo.maoDeObra || []).length && !rdo.semProducao?.ativo) aviso('maoDeObra', 'lista', 'Nenhuma mão de obra registrada.');

  // ---- D. Equipamentos ----
  (rdo.equipamentos || []).forEach((e, i) => {
    const nome = e.tipo || `Equipamento ${i + 1}`;
    if (!isFilled(e.tipo)) erro('equipamentos', 'tipo', `Equipamento ${i + 1}: informe o tipo.`, e.id);
    if (toNumber(e.quantidade) < 1) erro('equipamentos', 'quantidade', `${nome}: quantidade deve ser ao menos 1.`, e.id);
    const disp = toNumber(e.horasDisponiveis);
    const prod = toNumber(e.horasProdutivas);
    const par = toNumber(e.horasParadas);
    if (prod + par > disp + 0.001) erro('equipamentos', 'horas', `${nome}: horas produtivas + paradas excedem as horas disponíveis.`, e.id);
    const parado = ['parado', 'manutencao'].includes(e.condicao) || par > 0;
    if (parado) {
      if (!isFilled(e.motivoParada)) erro('equipamentos', 'motivoParada', `${nome}: equipamento parado exige o motivo.`, e.id);
      if (!(par > 0)) erro('equipamentos', 'horasParadas', `${nome}: equipamento parado exige a duração (horas paradas).`, e.id);
    }
  });

  // ---- E. Atividades ----
  const sp = rdo.semProducao || {};
  if (!(rdo.atividades || []).length && !sp.ativo) {
    erro('atividades', 'lista', 'Registre ao menos uma atividade ou marque "Dia sem produção" com justificativa.');
  }
  if (sp.ativo && !isFilled(sp.justificativa)) erro('atividades', 'justificativa', 'Dia sem produção: informe a justificativa.');
  (rdo.atividades || []).forEach((a, i) => {
    const nome = a.servico || `Atividade ${i + 1}`;
    if (!isFilled(a.servico)) erro('atividades', 'servico', `Atividade ${i + 1}: informe o serviço.`, a.id);
    if (!isFilled(a.unidade)) erro('atividades', 'unidade', `${nome}: informe a unidade.`, a.id);
    if (!isValidNumber(a.quantidadeDia)) erro('atividades', 'quantidadeDia', `${nome}: informe a quantidade executada no dia.`, a.id);
    if (isFilled(a.percentual) && !(toNumber(a.percentual) >= 0 && toNumber(a.percentual) <= 100)) erro('atividades', 'percentual', `${nome}: percentual deve estar entre 0 e 100.`, a.id);
  });

  // ---- F. Materiais / G. Qualidade ----
  (rdo.materiais || []).forEach((m, i) => {
    const nome = m.material || `Material ${i + 1}`;
    if (!isFilled(m.material)) erro('materiaisQualidade', 'material', `Material ${i + 1}: informe o material.`, m.id);
    if (!isFilled(m.unidade)) erro('materiaisQualidade', 'unidade', `${nome}: informe a unidade.`, m.id);
    if (!isValidNumber(m.quantidade)) erro('materiaisQualidade', 'quantidade', `${nome}: informe a quantidade.`, m.id);
    if (m.movimento === 'recebido' && !isFilled(m.notaRomaneio)) aviso('materiaisQualidade', 'notaRomaneio', `${nome}: recebimento sem nota/romaneio informado.`, m.id);
  });
  (rdo.qualidade || []).forEach((q, i) => {
    if (!isFilled(q.descricao)) erro('materiaisQualidade', 'descricao', `Qualidade ${i + 1}: descreva a inspeção/ensaio.`, q.id);
    if (q.tipo === 'nao_conformidade' && !isFilled(q.responsavel)) aviso('materiaisQualidade', 'responsavel', 'Não conformidade sem responsável pela tratativa.', q.id);
  });

  // ---- H. Segurança ----
  const seg = rdo.seguranca || {};
  if (!seg.semIncidentes && !(seg.incidentes || []).length) {
    aviso('seguranca', 'incidentes', 'Informe se houve acidentes/quase acidentes no dia (ou marque "Sem incidentes").');
  }
  (seg.incidentes || []).forEach((inc, i) => {
    if (!isFilled(inc.tipo) || !isFilled(inc.descricao)) erro('seguranca', 'incidentes', `Incidente ${i + 1}: informe tipo e descrição.`, inc.id);
  });

  // ---- I. Ocorrências / J. Visitas ----
  (rdo.ocorrencias || []).forEach((o, i) => {
    const nome = o.codigo || `Ocorrência ${i + 1}`;
    if (!isFilled(o.fato)) erro('ocorrencias', 'fato', `${nome}: descreva o fato.`, o.id);
    if (timeToMinutes(o.horario) === null) erro('ocorrencias', 'horario', `${nome}: informe o horário (HH:MM).`, o.id);
    if (!isFilled(o.local)) aviso('ocorrencias', 'local', `${nome}: local não informado.`, o.id);
    if (!isFilled(o.responsavel)) aviso('ocorrencias', 'responsavel', `${nome}: sem responsável pela providência.`, o.id);
  });
  (rdo.visitas || []).forEach((v, i) => {
    const nome = v.visitante || `Visita ${i + 1}`;
    if (!isFilled(v.visitante)) erro('ocorrencias', 'visitante', `Visita ${i + 1}: informe o visitante.`, v.id);
    if (!isFilled(v.motivo)) erro('ocorrencias', 'motivo', `${nome}: informe o motivo da visita.`, v.id);
    const e = timeToMinutes(v.entrada);
    const s = timeToMinutes(v.saida);
    if (e !== null && s !== null && s < e) aviso('ocorrencias', 'saida', `${nome}: saída anterior à entrada.`, v.id);
  });

  // ---- K. Fotos ----
  (rdo.fotos || []).forEach((f) => {
    if (!isFilled(f.legenda)) erro('fotos', 'legenda', `Foto ${String(f.numero).padStart(2, '0')}: a legenda é obrigatória.`, f.id);
    else if (!isFilled(f.local)) aviso('fotos', 'local', `Foto ${String(f.numero).padStart(2, '0')}: local não informado.`, f.id);
  });
  if (!(rdo.fotos || []).length) aviso('fotos', 'lista', 'Nenhuma foto anexada (recomendado: ao menos 3 fotos com legenda).');

  // ---- L. Pendências ----
  (rdo.pendencias || []).forEach((p, i) => {
    const nome = `Pendência ${i + 1}`;
    if (!isFilled(p.descricao)) erro('pendencias', 'descricao', `${nome}: descreva a pendência.`, p.id);
    if (!isFilled(p.responsavel)) erro('pendencias', 'responsavel', `${nome}: informe o responsável.`, p.id);
    if (!isFilled(p.prazo)) erro('pendencias', 'prazo', `${nome}: informe o prazo.`, p.id);
    if (!isFilled(p.criticidade)) erro('pendencias', 'criticidade', `${nome}: informe a criticidade.`, p.id);
  });

  // ---- M. Aprovações ----
  if (!rdo.declaracao?.aceita) erro('revisao', 'declaracao', 'Aceite a declaração de responsabilidade para enviar.');
  if (obra?.exigeAssinaturaOperacional && !rdo.assinaturaOperacional) erro('revisao', 'assinatura', 'Esta obra exige a assinatura do responsável pelo preenchimento.');

  // ---- Resumo por passo ----
  const temConteudo = {
    identificacao: true,
    clima: periodos.some((p) => isFilled(p.condicao)) || !!clima.choveu,
    maoDeObra: (rdo.maoDeObra || []).length > 0,
    equipamentos: (rdo.equipamentos || []).length > 0,
    atividades: (rdo.atividades || []).length > 0 || !!sp.ativo,
    materiaisQualidade: (rdo.materiais || []).length + (rdo.qualidade || []).length > 0 || rdo.semRegistro?.materiais || rdo.semRegistro?.qualidade,
    seguranca: !!seg.semIncidentes || (seg.incidentes || []).length > 0 || !!seg.dds?.realizado || !!seg.epiEpc?.conferidos,
    ocorrencias: (rdo.ocorrencias || []).length + (rdo.visitas || []).length > 0 || rdo.semRegistro?.ocorrencias || rdo.semRegistro?.visitas,
    fotos: (rdo.fotos || []).length > 0,
    pendencias: (rdo.pendencias || []).length > 0 || rdo.semRegistro?.pendencias || isFilled(rdo.planejamento?.proximoDia),
    revisao: !!rdo.declaracao?.aceita,
  };

  const porPasso = {};
  for (const p of PASSOS_RDO) {
    const e = erros.filter((x) => x.passo === p.key).length;
    const a = avisos.filter((x) => x.passo === p.key).length;
    porPasso[p.key] = {
      erros: e,
      avisos: a,
      estado: e > 0 ? 'erro' : temConteudo[p.key] ? (a > 0 ? 'atencao' : 'completo') : 'vazio',
    };
  }
  const passosContaveis = PASSOS_RDO.filter((p) => p.key !== 'revisao');
  const completos = passosContaveis.filter((p) => ['completo', 'atencao'].includes(porPasso[p.key].estado)).length;

  return { erros, avisos, porPasso, valido: erros.length === 0, progresso: { completos, total: passosContaveis.length } };
}

// Resumo textual curto de pendências para telas de lista (ex.: cartão do RDO).
export function resumoValidacao(rdo, ctx) {
  const v = validarRdo(rdo, ctx);
  return { erros: v.erros.length, avisos: v.avisos.length, progresso: v.progresso };
}
