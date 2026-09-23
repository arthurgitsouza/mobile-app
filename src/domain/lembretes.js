// Lembretes e escalonamento (seção 5): lembrete ao operacional no fim do dia; ao master após 24 h sem
// análise; ao cliente após 24 e 48 h; escalonamento configurável. Retorna notificações novas (deduplicadas).

import { criarNotificacao } from './notificacoes.js';
import { pad4 } from '../utils/format.js';
import { diaDaSemana, hojeObra, horaAgoraObra, timeToMinutes, combineDateTime } from '../utils/date.js';
import { STATUS } from '../constants/index.js';

export const chaveMaster = (rdoId, h) => `lem:master:${rdoId}:${h}`;
export const chaveCliente = (rdoId, h) => `lem:cliente:${rdoId}:${h}`;

export function calcularLembretes(state, agoraISO) {
  const agora = new Date(agoraISO).getTime();
  const cfg = state.settings.lembretes;
  const existentes = new Set(state.notifications.map((n) => n.chave).filter(Boolean));
  const novas = [];
  const masters = state.users.filter((u) => u.perfil === 'master' && u.ativo);
  const obraDe = (id) => state.obras.find((o) => o.id === id);
  const push = (chave, usuarios, dados) => {
    if (existentes.has(chave)) return;
    existentes.add(chave);
    usuarios.forEach((usuario) => novas.push(criarNotificacao({ usuario, chave, dataHora: agoraISO, ...dados })));
  };
  const rotulo = (r, o) => `RDO nº ${pad4(r.numero)} (${o.nome})`;

  for (const r of state.rdos) {
    const obra = obraDe(r.obraId);
    if (!obra) continue;

    // Master: análise pendente.
    if ([STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(r.status) && !r.sync?.pendente && r.submetidoEm) {
      const horas = (agora - new Date(r.submetidoEm).getTime()) / 3600000;
      for (let limite = cfg.masterHoras; limite <= horas; limite += cfg.masterHoras) {
        push(chaveMaster(r.id, limite), masters, {
          tipo: 'lembrete', titulo: `Lembrete: análise pendente há mais de ${limite} h`,
          mensagem: `${rotulo(r, obra)} aguarda análise há ${Math.floor(horas)} h.`, obraId: obra.id, rdoId: r.id, rdoStatus: r.status,
          prazo: new Date(new Date(r.submetidoEm).getTime() + cfg.masterHoras * 3600000).toISOString(),
        });
      }
    }

    // Cliente: ciência/aceite pendente (24 h e 48 h) + escalonamento ao master.
    if (r.status === STATUS.ENVIADO_CLIENTE && r.liberadoAoClienteEm) {
      const horas = (agora - new Date(r.liberadoAoClienteEm).getTime()) / 3600000;
      const clientes = state.users.filter((u) => u.perfil === 'cliente' && u.ativo && (obra.usuarioIds || []).includes(u.id));
      cfg.clienteHoras.filter((h) => horas >= h).forEach((h) => {
        push(chaveCliente(r.id, h), clientes, {
          tipo: 'lembrete', titulo: 'Lembrete: RDO aguardando ciência',
          mensagem: `${rotulo(r, obra)} aguarda sua ciência/aceite há ${Math.floor(horas)} h.`, obraId: obra.id, rdoId: r.id, rdoStatus: r.status,
          prazo: new Date(new Date(r.liberadoAoClienteEm).getTime() + h * 3600000).toISOString(),
        });
      });
      if (cfg.escalonamentoHoras && horas >= cfg.escalonamentoHoras) {
        push(`esc:master:${r.id}`, masters, {
          tipo: 'prazo_vencido', titulo: 'Escalonamento: cliente sem manifestação',
          mensagem: `${rotulo(r, obra)} está há ${Math.floor(horas)} h sem ciência/aceite do cliente.`, obraId: obra.id, rdoId: r.id, rdoStatus: r.status,
        });
      }
    }

    // Operacional: prazo de correção vencido.
    if (r.status === STATUS.DEVOLVIDO && r.devolucao?.prazo && agora > new Date(r.devolucao.prazo).getTime()) {
      const autor = state.users.find((u) => u.id === r.autorId);
      if (autor) {
        push(`lem:prazo:${r.id}`, [autor], {
          tipo: 'prazo_vencido', titulo: 'Prazo de correção vencido',
          mensagem: `${rotulo(r, obra)} devolvido segue sem reenvio após o prazo de correção.`, obraId: obra.id, rdoId: r.id, rdoStatus: r.status, prazo: r.devolucao.prazo,
        });
      }
    }
  }

  // Operacional: lembrete de fim de dia (obras com dia útil hoje e sem RDO enviado).
  const hoje = hojeObra(agoraISO);
  const limiteMin = timeToMinutes(cfg.operacionalFimDia);
  const agoraMin = timeToMinutes(horaAgoraObra(agoraISO));
  if (limiteMin !== null && agoraMin !== null && agoraMin >= limiteMin) {
    for (const obra of state.obras.filter((o) => o.status === 'ativa' && (o.diasUteis || []).includes(diaDaSemana(hoje)))) {
      const enviado = state.rdos.some((r) => r.obraId === obra.id && r.data === hoje && !['rascunho', 'devolvido', 'cancelado'].includes(r.status));
      if (enviado) continue;
      const operacionais = state.users.filter((u) => u.perfil === 'operacional' && u.ativo && (obra.usuarioIds || []).includes(u.id));
      push(`lem:fimdia:${obra.id}:${hoje}`, operacionais, {
        tipo: 'lembrete', titulo: 'Lembrete: envie o RDO de hoje',
        mensagem: `O RDO de hoje da obra ${obra.nome} ainda não foi enviado ao master.`, obraId: obra.id, rdoId: null,
        prazo: combineDateTime(hoje, '23:59'),
      });
    }
  }
  return novas;
}
