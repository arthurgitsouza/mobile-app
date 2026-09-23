// Indicadores gerenciais (seção 14): funções puras sobre os RDOs e obras.

import { STATUS } from '../constants/index.js';
import { addDays, dateFromISO, diaDaSemana, eachDay, hoursBetween, timeToMinutes } from '../utils/date.js';
import { toNumber } from '../utils/format.js';
import { groupBy, sum } from '../utils/object.js';
import { resumoEquipamentos, totalHomemHora, totalTrabalhadores } from './rdo.js';

const VIGENTES = (r) => ![STATUS.CANCELADO, STATUS.RETIFICADO].includes(r.status);
const ENVIADOS = (r) => ![STATUS.RASCUNHO, STATUS.DEVOLVIDO].includes(r.status);
const media = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export function intervaloPeriodo(periodo, hoje) {
  if (periodo === 'todos') return { de: '0000-01-01', ate: hoje };
  return { de: addDays(hoje, -(Number(periodo) - 1)), ate: hoje };
}

// Dias úteis esperados (RDO previsto) no intervalo, respeitando início da obra e dias úteis configurados.
export function diasPrevistosNoIntervalo(obra, de, ate) {
  const base = obra.inicioRegistro || obra.inicio;
  const inicio = de < base ? base : de;
  const fim = ate > obra.fim ? obra.fim : ate;
  if (fim < inicio) return [];
  return eachDay(inicio, fim).filter((d) => (obra.diasUteis || [1, 2, 3, 4, 5, 6]).includes(diaDaSemana(d)));
}

export function calcularIndicadores(state, { obraIds, de, ate }) {
  const obras = state.obras.filter((o) => !obraIds?.length || obraIds.includes(o.id));
  const ids = new Set(obras.map((o) => o.id));
  const noPeriodo = state.rdos.filter((r) => ids.has(r.obraId) && r.data >= de && r.data <= ate);
  const rdos = noPeriodo.filter(VIGENTES);
  const enviados = rdos.filter(ENVIADOS);

  // --- contagem por situação ---
  const previstos = sum(obras, (o) => diasPrevistosNoIntervalo(o, de, ate).length);
  const contagem = {
    previstos,
    preenchidos: enviados.length,
    pendentes: rdos.filter((r) => [STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(r.status)).length,
    devolvidos: rdos.filter((r) => r.status === STATUS.DEVOLVIDO).length,
    validados: rdos.filter((r) => [STATUS.VALIDADO, STATUS.ENVIADO_CLIENTE, STATUS.FINALIZADO].includes(r.status)).length,
    assinados: rdos.filter((r) => r.status === STATUS.FINALIZADO).length,
    rascunhos: rdos.filter((r) => r.status === STATUS.RASCUNHO).length,
  };
  const distribuicao = Object.entries(groupBy(noPeriodo, (r) => r.status)).map(([status, l]) => ({ status, n: l.length }));

  // --- tempos médios (h) ---
  const t1 = rdos.filter((r) => r.submetidoEm && r.assinaturas?.master).map((r) => hoursBetween(r.submetidoEm, r.assinaturas.master.dataHora));
  const t2 = rdos.filter((r) => r.assinaturas?.master && r.assinaturas?.cliente).map((r) => hoursBetween(r.assinaturas.master.dataHora, r.assinaturas.cliente.dataHora));
  const tempos = { envioAteValidacaoH: media(t1), validacaoAteAceiteH: media(t2), n1: t1.length, n2: t2.length };

  // --- efetivo e homem-hora ---
  const porData = groupBy(enviados.concat(rdos.filter((r) => r.status === STATUS.RASCUNHO)), (r) => r.data);
  const dias = Object.keys(porData).sort();
  const hhPorDia = dias.map((data) => ({
    data,
    hh: sum(porData[data], totalHomemHora),
    efetivo: sum(porData[data], totalTrabalhadores),
    porObra: Object.fromEntries(Object.entries(groupBy(porData[data], (r) => r.obraId)).map(([id, l]) => [id, sum(l, totalHomemHora)])),
  }));
  const linhasMO = rdos.flatMap((r) => r.maoDeObra.map((m) => ({ ...m, hh: toNumber(m.quantidade) * toNumber(m.horas), obraId: r.obraId })));
  const agrupar = (lista, chave) =>
    Object.entries(groupBy(lista, (x) => x[chave] || 'Não informado'))
      .map(([nome, l]) => ({ nome, hh: sum(l, (x) => x.hh) }))
      .sort((a, b) => b.hh - a.hh);
  const hhPorFuncao = agrupar(linhasMO, 'funcao');
  const hhPorEmpresa = agrupar(linhasMO, 'empresa');

  // --- equipamentos ---
  const linhasEq = rdos.flatMap((r) => r.equipamentos.map((e) => ({ tipo: e.tipo, mult: Math.max(1, toNumber(e.quantidade)), disp: toNumber(e.horasDisponiveis), prod: toNumber(e.horasProdutivas), par: toNumber(e.horasParadas) })));
  const equipamentos = Object.entries(groupBy(linhasEq, (x) => x.tipo))
    .map(([tipo, l]) => ({
      tipo,
      produtivas: sum(l, (x) => x.prod * x.mult),
      paradas: sum(l, (x) => x.par * x.mult),
      disponiveis: sum(l, (x) => x.disp * x.mult),
    }))
    .sort((a, b) => b.produtivas + b.paradas - (a.produtivas + a.paradas));

  // --- quantidades por serviço ---
  const linhasAt = rdos.flatMap((r) => r.atividades.map((a) => ({ servico: a.servico, unidade: a.unidade, qtd: toNumber(a.quantidadeDia), data: r.data, obraId: r.obraId })));
  const servicos = Object.entries(groupBy(linhasAt, (x) => `${x.servico}|${x.unidade}`))
    .map(([k, l]) => {
      const [servico, unidade] = k.split('|');
      const porDia = Object.entries(groupBy(l, (x) => x.data)).map(([data, ll]) => [data, sum(ll, (x) => x.qtd)]).sort((a, b) => (a[0] > b[0] ? 1 : -1));
      let acc = 0;
      return { servico, unidade, total: sum(l, (x) => x.qtd), evolucao: porDia.map(([data, q]) => ({ data, acumulado: (acc += q) })) };
    })
    .sort((a, b) => b.total - a.total);

  // --- clima e impactos ---
  const comChuva = rdos.filter((r) => r.clima?.choveu);
  const clima = {
    diasComChuva: comChuva.length,
    mmTotal: sum(comChuva, (r) => toNumber(r.clima.precipitacaoMm)),
    minutosParalisados: sum(rdos, (r) => timeToMinutes(r.clima?.horasParalisadas) || 0),
    diasImpactados: rdos.filter((r) => r.clima?.choveu && r.clima.impacto && r.clima.impacto !== 'nenhum').length,
  };

  // --- ocorrências, NC, incidentes e pendências ---
  const ocorrencias = rdos.flatMap((r) => r.ocorrencias);
  const ultimoPorObra = obras.map((o) => rdos.filter((r) => r.obraId === o.id && ENVIADOS(r)).sort((a, b) => (a.data < b.data ? 1 : -1))[0]).filter(Boolean);
  const pendenciasAbertas = ultimoPorObra.flatMap((r) => r.pendencias.filter((p) => p.status !== 'resolvida'));
  const ocorrenciasInd = {
    total: ocorrencias.length,
    impactoPrazo: ocorrencias.filter((o) => o.impactoPrazo).length,
    impactoCusto: ocorrencias.filter((o) => o.impactoCusto).length,
    impactoQualidade: ocorrencias.filter((o) => o.impactoQualidade).length,
    naoConformidades: sum(rdos, (r) => r.qualidade.filter((q) => q.tipo === 'nao_conformidade' || q.resultado === 'nao_conforme').length),
    incidentes: sum(rdos, (r) => r.seguranca.incidentes.length),
    pendenciasPorCriticidade: ['baixa', 'media', 'alta', 'critica'].map((k) => ({ nivel: k, n: pendenciasAbertas.filter((p) => p.criticidade === k).length })),
    pendenciasAbertas: pendenciasAbertas.length,
  };

  // --- cobertura fotográfica e registros incompletos ---
  const comFotos = rdos.filter((r) => ENVIADOS(r) && r.fotos.length >= 3 && r.fotos.every((f) => (f.legenda || '').trim()));
  const incompletos = rdos
    .filter((r) => r.status !== STATUS.FINALIZADO || r.fotos.length < 3)
    .map((r) => {
      const faltas = [];
      if (r.status === STATUS.RASCUNHO) faltas.push('rascunho não enviado');
      if (r.status === STATUS.DEVOLVIDO) faltas.push('devolvido, aguardando correção');
      if (r.fotos.length < 3) faltas.push(`apenas ${r.fotos.length} foto(s)`);
      if (r.fotos.some((f) => !(f.legenda || '').trim())) faltas.push('foto sem legenda');
      if (!r.atividades.length && !r.semProducao?.ativo) faltas.push('sem atividades');
      return { rdo: r, faltas };
    })
    .filter((x) => x.faltas.length);
  const baseCobertura = rdos.filter(ENVIADOS).length;
  const cobertura = { comFotos: comFotos.length, total: baseCobertura, pct: baseCobertura ? Math.round((comFotos.length / baseCobertura) * 100) : 0, incompletos };

  return {
    obras, de, ate, contagem, distribuicao, tempos, hhPorDia, hhPorFuncao, hhPorEmpresa, equipamentos, servicos, clima,
    ocorrencias: ocorrenciasInd, cobertura, equipUnidades: sum(rdos, (r) => resumoEquipamentos(r).unidades), totalRdos: rdos.length,
  };
}

export function formatarHorasMin(min) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return `${h}:${String(m).padStart(2, '0')} h`;
}

export function diaDe(iso) {
  return dateFromISO(iso);
}
