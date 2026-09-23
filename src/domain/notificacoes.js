// Notificações (seção 10): push no aplicativo + e-mail; WhatsApp/SMS é integração opcional com consentimento.
// Toda notificação indica obra, RDO, status, prazo e acesso direto ao registro.

import { uid } from '../utils/format.js';
import { nowISO } from '../utils/date.js';

export const TIPOS_NOTIFICACAO = {
  rdo_submetido: { icone: 'send-outline', cor: 'info', rotulo: 'Para análise' },
  rdo_devolvido: { icone: 'undo-variant', cor: 'warning', rotulo: 'Devolvido' },
  rdo_validado: { icone: 'check-decagram-outline', cor: 'teal', rotulo: 'Validado' },
  cliente_manifestou: { icone: 'account-check-outline', cor: 'success', rotulo: 'Manifestação do cliente' },
  esclarecimento: { icone: 'help-circle-outline', cor: 'info', rotulo: 'Esclarecimento' },
  prazo_vencido: { icone: 'clock-alert-outline', cor: 'danger', rotulo: 'Prazo vencido' },
  lembrete: { icone: 'bell-ring-outline', cor: 'gold', rotulo: 'Lembrete' },
  falha_entrega: { icone: 'email-alert-outline', cor: 'danger', rotulo: 'Falha de entrega' },
  sistema: { icone: 'information-outline', cor: 'gray', rotulo: 'Sistema' },
};

// Entrega simulada por canal, respeitando as preferências do destinatário.
export function entregasPara(usuario, { simularFalhaEmail = false, agora = nowISO() } = {}) {
  const prefs = usuario?.canais || { push: true, email: true, whatsapp: false };
  const entregas = [];
  entregas.push({ canal: 'push', status: prefs.push === false ? 'desativado' : 'entregue', em: agora });
  entregas.push({ canal: 'email', status: prefs.email === false ? 'desativado' : simularFalhaEmail ? 'falha' : 'entregue', em: agora });
  entregas.push({ canal: 'whatsapp', status: prefs.whatsapp ? 'entregue' : 'nao_configurado', em: agora });
  return entregas;
}

export function criarNotificacao({
  usuario, tipo, titulo, mensagem, obraId = null, rdoId = null, rdoStatus = null, prazo = null,
  dataHora = nowISO(), lida = false, simularFalhaEmail = false, entregas, chave = null, alvoId = null,
}) {
  return {
    id: uid('nt'),
    usuarioId: usuario.id,
    tipo,
    titulo,
    mensagem,
    obraId,
    rdoId,
    rdoStatus,
    prazo,
    dataHora,
    lida,
    chave, // deduplicação de lembretes
    alvoId, // falha_entrega: usuário cuja entrega falhou (permite reenvio)
    entregas: entregas || entregasPara(usuario, { simularFalhaEmail, agora: dataHora }),
  };
}

export const CANAIS = {
  push: { label: 'Push no app', icone: 'cellphone-message' },
  email: { label: 'E-mail', icone: 'email-outline' },
  whatsapp: { label: 'WhatsApp', icone: 'whatsapp' },
};

export const STATUS_ENTREGA = {
  entregue: { label: 'Entregue', cor: 'success' },
  falha: { label: 'Falha', cor: 'danger' },
  pendente: { label: 'Pendente', cor: 'warning' },
  desativado: { label: 'Desativado pelo usuário', cor: 'gray' },
  nao_configurado: { label: 'Não configurado / sem consentimento', cor: 'gray' },
};

export function temFalhaDeEntrega(notificacao) {
  return notificacao.entregas?.some((e) => e.status === 'falha');
}
