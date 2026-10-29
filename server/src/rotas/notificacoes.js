// Central de notificações e registro do aparelho para push.
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/notificacoes', autenticar, pendente('GET /notificacoes'));
router.patch('/notificacoes/:id', autenticar, pendente('PATCH /notificacoes/{id}'));
router.post('/notificacoes/marcar-todas-lidas', autenticar, pendente('POST /notificacoes/marcar-todas-lidas'));
router.post('/notificacoes/:id/reenvio', autenticar, pendente('POST /notificacoes/{id}/reenvio'));
router.put('/dispositivos/:deviceId/push', autenticar, pendente('PUT /dispositivos/{deviceId}/push'));
