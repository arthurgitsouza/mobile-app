import { uid, toNumber, isFilled } from '../utils/format.js';
import { nowISO, formatDate, timeToMinutes, minutesToTime } from '../utils/date.js';
import { sum } from '../utils/object.js';

// ---------- Fábricas ----------

export function novaSeguranca() {
  return {
    dds: { realizado: false, tema: '', participantes: '' },
    epiEpc: { conferidos: false, observacao: '' },
    permissoes: '',
    inspecoes: '',
    semIncidentes: false,
    incidentes: [],
    residuos: '',
    condicionantes: '',
    providencias: '',
  };
}

export function novoClima() {
  return {
    periodos: {
      manha: { condicao: '', temperatura: '' },
      tarde: { condicao: '', temperatura: '' },
      noite: { condicao: '', temperatura: '' },
    },
    choveu: false,
    chuvaInicio: '',
    chuvaFim: '',
    precipitacaoMm: '',
    impacto: 'nenhum',
    horasParalisadas: '',
    fonte: 'manual',
    observacao: '',
  };
}

// RF-04: numeração sequencial por obra (versões de retificação mantêm o número).
export function proximoNumero(rdos, obraId) {
  const numeros = rdos.filter((r) => r.obraId === obraId).map((r) => r.numero);
  return (numeros.length ? Math.max(...numeros) : 0) + 1;
}

export function criarRdoVazio({ obra, autor, data, turno = 'diurno', numero, versao = 1 }) {
  const agora = nowISO();
  return {
    id: uid('rdo'),
    obraId: obra.id,
    numero,
    versao,
    data,
    turno,
    status: 'rascunho',
    autorId: autor.id,
    criadoEm: agora,
    atualizadoEm: agora,
    retificaDe: null,
    retificadoPor: null,
    motivoRetificacao: null,
    identificacao: {
      contrato: obra.contrato,
      os: obra.os,
      cliente: obra.clienteNome,
      empresa: obra.empresaExecutora,
      endereco: obra.endereco,
      engenheiroRT: obra.engenheiroRT,
      periodoContratual: `${formatDate(obra.inicio)} a ${formatDate(obra.fim)}`,
      responsavelPreenchimento: autor.nome,
    },
    clima: novoClima(),
    maoDeObra: [],
    observacaoMaoDeObra: '',
    equipamentos: [],
    semProducao: { ativo: false, justificativa: '' },
    atividades: [],
    materiais: [],
    qualidade: [],
    seguranca: novaSeguranca(),
    ocorrencias: [],
    visitas: [],
    fotos: [],
    pendencias: [],
    planejamento: { proximoDia: '', restricoes: '' },
    semRegistro: { materiais: false, qualidade: false, ocorrencias: false, visitas: false, pendencias: false },
    observacoesGerais: '',
    declaracao: { aceita: false, dataHora: null },
    assinaturaOperacional: null,
    submetidoEm: null,
    devolucao: null,
    sync: { pendente: false, ultimoEm: null },
    esclarecimentoPendente: false,
    assinaturas: { master: null, cliente: null },
    hashTecnico: null,
    hashFinal: null,
    liberadoAoClienteEm: null,
    finalizadoEm: null,
    cancelamento: null,
    comentarios: [],
    auditoria: [],
  };
}

// RNF-04: preenchimento reaproveitável do dia anterior.
export function reaproveitarDoAnterior(rdo, anterior) {
  const novoId = (item) => ({ ...item, id: uid('it') });
  return {
    ...rdo,
    maoDeObra: anterior.maoDeObra.map(novoId),
    observacaoMaoDeObra: '',
    equipamentos: anterior.equipamentos.map((e) => ({ ...novoId(e), horasParadas: '0', motivoParada: '', condicao: e.condicao === 'parado' ? 'operante' : e.condicao })),
    atividades: anterior.atividades.map((a) => ({
      ...novoId(a),
      descricao: '',
      quantidadeDia: '',
      observacao: '',
      situacao: a.situacao === 'concluida' ? 'concluida' : 'em_andamento',
    })),
    pendencias: anterior.pendencias.filter((p) => p.status !== 'resolvida').map(novoId),
    planejamento: { proximoDia: '', restricoes: anterior.planejamento?.restricoes || '' },
    reaproveitadoDe: anterior.id,
  };
}

// ---------- Cálculos ----------

const toInt = (v) => Math.max(0, Math.floor(toNumber(v)));

// Efetivo total calculado a partir das funções (regra: evita dupla contagem).
export function totalTrabalhadores(rdo) {
  return sum(rdo.maoDeObra || [], (i) => toInt(i.quantidade));
}

export function totalHomemHora(rdo) {
  return sum(rdo.maoDeObra || [], (i) => toInt(i.quantidade) * toNumber(i.horas));
}

export function resumoEquipamentos(rdo) {
  const lista = rdo.equipamentos || [];
  return {
    unidades: sum(lista, (e) => toInt(e.quantidade)),
    horasDisponiveis: sum(lista, (e) => toNumber(e.horasDisponiveis) * Math.max(1, toInt(e.quantidade))),
    horasProdutivas: sum(lista, (e) => toNumber(e.horasProdutivas) * Math.max(1, toInt(e.quantidade))),
    horasParadas: sum(lista, (e) => toNumber(e.horasParadas) * Math.max(1, toInt(e.quantidade))),
  };
}

export function minutosParalisados(rdo) {
  return timeToMinutes(rdo.clima?.horasParalisadas) || 0;
}

export function duracaoChuvaMin(clima) {
  const ini = timeToMinutes(clima?.chuvaInicio);
  const fim = timeToMinutes(clima?.chuvaFim);
  if (ini === null || fim === null || fim < ini) return null;
  return fim - ini;
}

// Horas trabalhadas a partir de início/fim; desconta 1 h de intervalo em jornadas > 6 h.
export function calcularHoras(inicio, fim) {
  const a = timeToMinutes(inicio);
  const b = timeToMinutes(fim);
  if (a === null || b === null || b <= a) return '';
  let span = b - a;
  if (span > 360) span -= 60;
  const h = span / 60;
  return String(Math.round(h * 100) / 100).replace('.', ',');
}

export function horasDisponiveisSugeridas(rdo) {
  return rdo.maoDeObra?.[0]?.horas || '8';
}

export function acumuladoAnterior(rdos, obraId, servico, data, ignorarId) {
  const alvo = (servico || '').trim().toLowerCase();
  if (!alvo) return 0;
  return sum(
    rdos.filter(
      (r) =>
        r.obraId === obraId &&
        r.id !== ignorarId &&
        r.data < data &&
        !['rascunho', 'cancelado', 'retificado'].includes(r.status),
    ),
    (r) => sum(r.atividades.filter((a) => (a.servico || '').trim().toLowerCase() === alvo), (a) => toNumber(a.quantidadeDia)),
  );
}

export function numeroFormatado(rdo) {
  return String(rdo.numero).padStart(4, '0');
}

export function tituloRdo(rdo) {
  return `RDO nº ${numeroFormatado(rdo)}${rdo.versao > 1 ? ` · v${rdo.versao}` : ''}`;
}

export function chaveUnicidade(rdo) {
  return `${rdo.obraId}|${rdo.data}|${rdo.turno}`;
}

export function rdosAtivos(rdos) {
  return rdos.filter((r) => !['cancelado', 'retificado'].includes(r.status));
}

export function temConteudo(valor) {
  return isFilled(valor);
}

export function minutosParaHoraTexto(min) {
  return minutesToTime(min);
}

// Conteúdo técnico usado no hash de integridade: tudo o que o RDO registra, exceto
// comentários, auditoria, assinaturas e controles de fluxo (que mudam depois de assinado,
// como o vínculo `retificadoPor`, sem alterar o conteúdo técnico).
export function conteudoTecnico(rdo) {
  const {
    comentarios, auditoria, assinaturas, hashTecnico, hashFinal, status, sync, devolucao, submetidoEm,
    liberadoAoClienteEm, finalizadoEm, cancelamento, esclarecimentoPendente, atualizadoEm, retificadoPor, ...conteudo
  } = rdo;
  return conteudo;
}
