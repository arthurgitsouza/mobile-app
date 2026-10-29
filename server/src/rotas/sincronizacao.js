// Fila offline do app e verificação pública de hash.
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/verificacao/:hash', pendente('GET /verificacao/{hash}'));
router.post('/sincronizacao', autenticar, pendente('POST /sincronizacao'));
