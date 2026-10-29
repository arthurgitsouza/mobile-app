// Usuários, vínculo por obra, canais e aceite de termos.
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/usuarios', autenticar, pendente('GET /usuarios'));
router.get('/usuarios/:id', autenticar, pendente('GET /usuarios/{id}'));
router.patch('/usuarios/me/canais', autenticar, pendente('PATCH /usuarios/me/canais'));
router.patch('/usuarios/:id/ativo', autenticar, pendente('PATCH /usuarios/{id}/ativo'));
router.post('/usuarios', autenticar, pendente('POST /usuarios'));
router.post('/usuarios/me/termos', autenticar, pendente('POST /usuarios/me/termos'));
router.put('/usuarios/:id', autenticar, pendente('PUT /usuarios/{id}'));
