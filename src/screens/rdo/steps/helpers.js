import { toNumber } from '../../../utils/format';

// Mensagem de erro de um campo (só depois que a etapa foi visitada).
export function msgErro(erros, campo, mostrar = true, ref) {
  if (!mostrar) return undefined;
  return erros.find((e) => e.campo === campo && (ref === undefined || e.ref === ref))?.mensagem;
}

// Alerta em nível de item (linha da lista): erro obrigatório (após visitar a etapa) ou aviso.
export function alertaDoItem(ctx, id) {
  const erro = ctx.mostrarErros ? ctx.validacao.erros.find((e) => e.ref === id)?.mensagem : null;
  const aviso = ctx.validacao.avisos.find((a) => a.ref === id)?.mensagem;
  return erro || aviso || undefined;
}

export function contextoDoItem(base, extra) {
  return { ...base, ...extra };
}

export const numeroOuZero = toNumber;

export function proximoCodigoOcorrencia(ocorrencias) {
  const max = Math.max(0, ...ocorrencias.map((o) => Number((o.codigo || '').replace(/\D/g, '')) || 0));
  return `OC-${String(max + 1).padStart(3, '0')}`;
}
