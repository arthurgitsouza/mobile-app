// Junta as rotas de todas as áreas sob /api/v1.
import { Router } from 'express';
import { router as auth } from './auth.js';
import { router as obras } from './obras.js';
import { router as rdos } from './rdos.js';
import { router as notificacoes } from './notificacoes.js';
import { router as usuarios } from './usuarios.js';
import { router as cadastros } from './cadastros.js';
import { router as relatorios } from './relatorios.js';
import { router as academico } from './academico.js';
import { router as sincronizacao } from './sincronizacao.js';

export const api = Router();
for (const r of [auth, obras, rdos, notificacoes, usuarios, cadastros, relatorios, academico, sincronizacao])
  api.use(r);
