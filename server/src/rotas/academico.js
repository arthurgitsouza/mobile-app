// Módulo acadêmico (RF-20).
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/academico', autenticar, pendente('GET /academico'));
router.post(
  '/academico/grupos/:grupoId/entregas/:faseId/versoes',
  autenticar,
  pendente('POST /academico/grupos/{grupoId}/entregas/{faseId}/versoes'),
);
router.put(
  '/academico/grupos/:grupoId/entregas/:faseId/avaliacao',
  autenticar,
  pendente('PUT /academico/grupos/{grupoId}/entregas/{faseId}/avaliacao'),
);
