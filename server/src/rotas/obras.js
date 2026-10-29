// Obras e criação de RDO na obra (numeração sequencial por obra — RF-04).
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/obras', autenticar, pendente('GET /obras'));
router.get('/obras/:id', autenticar, pendente('GET /obras/{id}'));
router.get('/obras/:id/rdos/acumulado', autenticar, pendente('GET /obras/{id}/rdos/acumulado'));
router.post('/obras', autenticar, pendente('POST /obras'));
router.post('/obras/:id/rdos', autenticar, pendente('POST /obras/{id}/rdos'));
router.put('/obras/:id', autenticar, pendente('PUT /obras/{id}'));
