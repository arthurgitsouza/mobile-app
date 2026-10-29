// Relatórios, exportações e auditoria geral.
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.get('/auditoria', autenticar, pendente('GET /auditoria'));
router.get('/exportacoes', autenticar, pendente('GET /exportacoes'));
router.get('/relatorios', autenticar, pendente('GET /relatorios'));
router.get('/relatorios/atividades', autenticar, pendente('GET /relatorios/atividades'));
router.get('/relatorios/indicadores', autenticar, pendente('GET /relatorios/indicadores'));
router.get('/relatorios/mao-de-obra', autenticar, pendente('GET /relatorios/mao-de-obra'));
router.get('/relatorios/rdos', autenticar, pendente('GET /relatorios/rdos'));
router.post('/exportacoes', autenticar, pendente('POST /exportacoes'));
