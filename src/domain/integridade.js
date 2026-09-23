// Verificação de integridade (seção 11): recalcula o hash do conteúdo técnico e compara com o hash fechado na assinatura.
import { hashOf } from '../utils/object.js';
import { conteudoTecnico } from './rdo.js';

export function verificarIntegridade(rdo) {
  if (!rdo.hashTecnico) return { assinado: false };
  const calculado = hashOf(conteudoTecnico(rdo));
  return { assinado: true, ok: calculado === rdo.hashTecnico, calculado, esperado: rdo.hashTecnico };
}

// Payload do QR code: identifica o documento e o hash de verificação (a página de verificação virá com o back-end).
export function payloadVerificacao(rdo) {
  const hash = rdo.hashFinal || rdo.hashTecnico || '';
  return `rdomobile://verificar/${hash}`;
}

export function hashCurto(hash, n = 16) {
  return hash ? `${hash.slice(0, n)}…${hash.slice(-6)}` : '—';
}
