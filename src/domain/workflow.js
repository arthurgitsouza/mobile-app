// Fluxo de estados do RDO (seção 5) e permissões por perfil (seção 4).
// Funções puras: recebem o RDO, o usuário e a obra e dizem o que é permitido.

import { PERFIL, STATUS, ETAPAS_FLUXO } from '../constants/index.js';

const EDITAVEIS = [STATUS.RASCUNHO, STATUS.DEVOLVIDO];
const EM_ANALISE = [STATUS.SUBMETIDO, STATUS.EM_ANALISE];
const NAO_ASSINADOS = [STATUS.RASCUNHO, STATUS.SUBMETIDO, STATUS.EM_ANALISE, STATUS.DEVOLVIDO];
const LIBERADOS_AO_CLIENTE = [STATUS.ENVIADO_CLIENTE, STATUS.FINALIZADO];

// Conteúdo bloqueado após a validação/assinatura do master.
export function estaBloqueado(rdo) {
  return [STATUS.VALIDADO, STATUS.ENVIADO_CLIENTE, STATUS.FINALIZADO, STATUS.RETIFICADO, STATUS.CANCELADO].includes(rdo.status);
}

export function estaAssinado(rdo) {
  return !!rdo.assinaturas?.master;
}

export function usuarioNaObra(usuario, obra) {
  if (!usuario || !obra) return false;
  if (usuario.perfil === PERFIL.MASTER) return true;
  return (obra.usuarioIds || []).includes(usuario.id);
}

// Cliente só enxerga RDOs liberados (ou que já foram liberados antes de retificação/cancelamento).
export function liberadoAoCliente(rdo) {
  if (LIBERADOS_AO_CLIENTE.includes(rdo.status)) return true;
  return [STATUS.RETIFICADO, STATUS.CANCELADO].includes(rdo.status) && !!rdo.liberadoAoClienteEm;
}

export function podeVerRdo(rdo, usuario, obra) {
  if (!usuarioNaObra(usuario, obra)) return false;
  if (usuario.perfil === PERFIL.CLIENTE) return liberadoAoCliente(rdo);
  return true;
}

export function podeEditarOperacional(rdo, usuario) {
  return usuario.perfil === PERFIL.OPERACIONAL && EDITAVEIS.includes(rdo.status) && rdo.autorId === usuario.id;
}

// Ações disponíveis na tela de detalhe, conforme perfil e estado.
// Cada ação: { key, label, icone, tipo: 'primary' | 'accent' | 'secondary' | 'danger' | 'ghost' }
export function acoesDisponiveis(rdo, usuario, obra) {
  const acoes = [];
  const add = (key, label, icone, tipo = 'secondary') => acoes.push({ key, label, icone, tipo });
  const s = rdo.status;
  const perfil = usuario.perfil;

  if (perfil === PERFIL.OPERACIONAL) {
    if (podeEditarOperacional(rdo, usuario)) {
      add('revisar_enviar', s === STATUS.DEVOLVIDO ? 'Corrigir e reenviar' : 'Revisar e enviar', 'send-check-outline', 'accent');
      add('editar', s === STATUS.DEVOLVIDO ? 'Corrigir' : 'Continuar preenchimento', 'pencil-outline', 'secondary');
    }
    if (usuarioNaObra(usuario, obra) && !['cancelado'].includes(s)) add('comentar', 'Comentar', 'comment-text-outline', 'ghost');
  }

  if (perfil === PERFIL.MASTER) {
    if (EM_ANALISE.includes(s)) {
      add('validar', 'Validar e assinar', 'check-decagram-outline', 'accent');
      add('devolver', 'Devolver', 'undo-variant', 'secondary');
      add('comentar', 'Comentar', 'comment-text-outline', 'ghost');
      add('editar_master', 'Editar com justificativa', 'pencil-lock-outline', 'ghost');
    }
    if (s === STATUS.VALIDADO) add('enviar_cliente', 'Enviar ao cliente', 'account-arrow-right-outline', 'accent');
    if (s === STATUS.ENVIADO_CLIENTE) {
      add('reenviar', 'Reenviar notificação', 'bell-ring-outline', 'secondary');
      add('comentar', rdo.esclarecimentoPendente ? 'Responder esclarecimento' : 'Comentar', 'comment-text-outline', rdo.esclarecimentoPendente ? 'accent' : 'ghost');
    }
    if ([STATUS.RASCUNHO, STATUS.DEVOLVIDO].includes(s)) add('comentar', 'Comentar', 'comment-text-outline', 'ghost');
    if ([STATUS.VALIDADO, STATUS.ENVIADO_CLIENTE, STATUS.FINALIZADO].includes(s)) add('retificar', 'Retificar', 'file-restore-outline', 'ghost');
    if (![STATUS.CANCELADO, STATUS.RETIFICADO].includes(s)) add('cancelar', 'Cancelar RDO', 'file-cancel-outline', 'danger');
    if (NAO_ASSINADOS.includes(s)) add('excluir', 'Excluir (exceção)', 'delete-forever-outline', 'danger');
  }

  if (perfil === PERFIL.CLIENTE && usuarioNaObra(usuario, obra)) {
    if (s === STATUS.ENVIADO_CLIENTE) {
      add('assinar_cliente', 'Dar ciência / registrar ressalva', 'draw-pen', 'accent');
      add('comentar', 'Comentar', 'comment-text-outline', 'ghost');
    } else if (s === STATUS.FINALIZADO) {
      add('comentar', 'Comentar', 'comment-text-outline', 'ghost');
    }
  }

  if (![STATUS.CANCELADO].includes(s)) add('pdf', s === STATUS.FINALIZADO ? 'PDF final' : 'Pré-visualizar PDF', 'file-pdf-box', 'ghost');
  return acoes;
}

// Índice da etapa atual na linha do tempo (para o componente de fluxo).
export function etapaAtual(rdo) {
  const idx = (key) => ETAPAS_FLUXO.findIndex((e) => e.key === key);
  switch (rdo.status) {
    case STATUS.RASCUNHO:
    case STATUS.DEVOLVIDO:
      return idx('rascunho');
    case STATUS.SUBMETIDO:
      return idx('submetido');
    case STATUS.EM_ANALISE:
      return idx('em_analise');
    case STATUS.VALIDADO:
      return idx('validado');
    case STATUS.ENVIADO_CLIENTE:
      return idx('enviado_cliente');
    case STATUS.FINALIZADO:
      return idx('finalizado');
    default: {
      // retificado/cancelado: mostra até onde o RDO chegou
      if (rdo.finalizadoEm) return idx('finalizado');
      if (rdo.assinaturas?.master) return idx('validado');
      return idx('submetido');
    }
  }
}

export function ehTerminal(rdo) {
  return [STATUS.FINALIZADO, STATUS.RETIFICADO, STATUS.CANCELADO].includes(rdo.status);
}

// Alerta de prazo (seção 5): lembrete ao master após 24 h sem análise; ao cliente após 24 e 48 h.
export function atrasoDeAcao(rdo, agoraMs, horas = { master: 24, cliente: 24 }) {
  const limiteMs = (h) => h * 3600 * 1000;
  if (EM_ANALISE.includes(rdo.status) && rdo.submetidoEm) {
    const dt = agoraMs - new Date(rdo.submetidoEm).getTime();
    if (dt >= limiteMs(horas.master)) return { responsavel: 'master', horas: Math.floor(dt / 3600000) };
  }
  if (rdo.status === STATUS.ENVIADO_CLIENTE && rdo.liberadoAoClienteEm) {
    const dt = agoraMs - new Date(rdo.liberadoAoClienteEm).getTime();
    if (dt >= limiteMs(horas.cliente)) return { responsavel: 'cliente', horas: Math.floor(dt / 3600000) };
  }
  if (rdo.status === STATUS.DEVOLVIDO && rdo.devolucao?.prazo) {
    if (agoraMs > new Date(rdo.devolucao.prazo).getTime()) return { responsavel: 'operacional', horas: Math.floor((agoraMs - new Date(rdo.devolucao.prazo).getTime()) / 3600000) };
  }
  return null;
}
