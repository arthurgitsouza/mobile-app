import { env } from '../../config/env.js';
import { criarActions } from '../../store/apiActions.js';
import * as auth from './auth.js';
import * as obras from './obras.js';
import * as rdos from './rdos.js';
import * as fotos from './fotos.js';
import * as comentarios from './comentarios.js';
import * as usuarios from './usuarios.js';
import * as notificacoes from './notificacoes.js';
import * as assinaturas from './assinaturas.js';
import * as cadastros from './cadastros.js';
import * as relatorios from './relatorios.js';
import * as academico from './academico.js';

export const modulosApi = {
  auth,
  obras,
  rdos,
  fotos,
  comentarios,
  usuarios,
  notificacoes,
  assinaturas,
  cadastros,
  relatorios,
  academico,
};
export const recursos = Object.assign({}, ...Object.values(modulosApi));

export function criarApi({ useMock = env.USE_MOCK, demo = env.DEMO, ...opcoes }) {
  return criarActions({ recursos, useMock, demo, ...opcoes });
}
