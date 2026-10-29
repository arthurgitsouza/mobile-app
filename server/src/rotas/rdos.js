// Fluxo do RDO: conteúdo, fotos, submissão, análise, devolução, validação/assinatura, cliente, retificação, cancelamento e PDF.
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';

export const router = Router();

router.delete('/rdos/:id/fotos/:fotoId', autenticar, pendente('DELETE /rdos/{id}/fotos/{fotoId}'));
router.get('/rdos', autenticar, pendente('GET /rdos'));
router.get('/rdos/:id', autenticar, pendente('GET /rdos/{id}'));
router.get('/rdos/:id/assinaturas', autenticar, pendente('GET /rdos/{id}/assinaturas'));
router.get('/rdos/:id/auditoria', autenticar, pendente('GET /rdos/{id}/auditoria'));
router.get('/rdos/:id/comentarios', autenticar, pendente('GET /rdos/{id}/comentarios'));
router.get('/rdos/:id/comprovante', autenticar, pendente('GET /rdos/{id}/comprovante'));
router.get('/rdos/:id/fotos/:fotoId/arquivo', autenticar, pendente('GET /rdos/{id}/fotos/{fotoId}/arquivo'));
router.get('/rdos/:id/validacao', autenticar, pendente('GET /rdos/{id}/validacao'));
router.post('/rdos/:id/analise', autenticar, pendente('POST /rdos/{id}/analise'));
router.post('/rdos/:id/cancelamento', autenticar, pendente('POST /rdos/{id}/cancelamento'));
router.post('/rdos/:id/comentarios', autenticar, pendente('POST /rdos/{id}/comentarios'));
router.post('/rdos/:id/devolucao', autenticar, pendente('POST /rdos/{id}/devolucao'));
router.post('/rdos/:id/envio-cliente', autenticar, pendente('POST /rdos/{id}/envio-cliente'));
router.post('/rdos/:id/envio-cliente/reenvio', autenticar, pendente('POST /rdos/{id}/envio-cliente/reenvio'));
router.post('/rdos/:id/exclusao', autenticar, pendente('POST /rdos/{id}/exclusao'));
router.post('/rdos/:id/fotos', autenticar, pendente('POST /rdos/{id}/fotos'));
router.post('/rdos/:id/manifestacao', autenticar, pendente('POST /rdos/{id}/manifestacao'));
router.post('/rdos/:id/pdf', autenticar, pendente('POST /rdos/{id}/pdf'));
router.post('/rdos/:id/retificacao', autenticar, pendente('POST /rdos/{id}/retificacao'));
router.post('/rdos/:id/submeter', autenticar, pendente('POST /rdos/{id}/submeter'));
router.post('/rdos/:id/validacao', autenticar, pendente('POST /rdos/{id}/validacao'));
router.post('/rdos/:id/visualizacoes', autenticar, pendente('POST /rdos/{id}/visualizacoes'));
router.put('/rdos/:id/conteudo', autenticar, pendente('PUT /rdos/{id}/conteudo'));
router.put('/rdos/:id/edicao-master', autenticar, pendente('PUT /rdos/{id}/edicao-master'));
router.put('/rdos/:id/fotos/:fotoId', autenticar, pendente('PUT /rdos/{id}/fotos/{fotoId}'));
