// Empresa, clientes, catálogos e configurações.
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/catalogos', autenticar, pendente('GET /catalogos'));
router.get('/clientes', autenticar, pendente('GET /clientes'));
router.get('/configuracoes', autenticar, pendente('GET /configuracoes'));
router.get('/empresa', autenticar, pendente('GET /empresa'));
router.patch('/configuracoes', autenticar, pendente('PATCH /configuracoes'));
router.post('/clientes', autenticar, pendente('POST /clientes'));
router.put('/catalogos/:chave', autenticar, pendente('PUT /catalogos/{chave}'));
router.put('/clientes/:id', autenticar, pendente('PUT /clientes/{id}'));
router.put('/empresa', autenticar, pendente('PUT /empresa'));
