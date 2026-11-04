// Login, sessão, recuperação de senha e segundo fator (Supabase Auth).
// Contrato de cada rota: docs/api.md. Regras: docs/regras-de-negocio.md.
// Troque pendente(...) pela implementação usando db (src/supabase.js) e req.usuario.
import { Router } from 'express';
import { autenticar } from '../middleware/autenticar.js';
import { pendente } from './pendente.js';
import { auth, db } from '../supabase.js';
import { ApiError, erroDoBanco, validacao } from '../erros.js';
import { usuarioParaApi } from '../mapear.js';

export const router = Router();

// POST /auth/login — { email, senha, manter } → { token, expiraEm, usuario, termosAceitos }
router.post('/auth/login', async (req, res, next) => {
  try {
    if (!auth || !db) throw new ApiError(503, 'BANCO_NAO_CONFIGURADO', 'O servidor ainda não está ligado ao banco.');
    const email = String(req.body?.email || '')
      .trim()
      .toLowerCase();
    const senha = String(req.body?.senha || '');
    if (!email || !senha)
      throw validacao({ ...(!email && { email: 'Informe o e-mail.' }), ...(!senha && { senha: 'Informe a senha.' }) });

    const { data, error } = await auth.auth.signInWithPassword({ email, password: senha });
    if (error || !data?.session) throw new ApiError(401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos.');

    const { data: linha, error: erroPerfil } = await db
      .from('usuarios')
      .select('*')
      .eq('auth_id', data.user.id)
      .maybeSingle();
    if (erroPerfil) throw erroDoBanco(erroPerfil);
    if (!linha) throw new ApiError(403, 'SEM_PERFIL', 'Usuário sem perfil cadastrado. Fale com o administrador.');
    if (linha.ativo === false)
      throw new ApiError(403, 'USUARIO_BLOQUEADO', 'Este usuário está bloqueado. Fale com o administrador.');

    res.json({
      token: data.session.access_token,
      expiraEm: new Date(data.session.expires_at * 1000).toISOString(),
      usuario: usuarioParaApi(linha),
      termosAceitos: linha.termos_aceitos || null,
    });
  } catch (err) {
    next(err);
  }
});

// GET /auth/sessao — restaura a sessão ao abrir o app.
router.get('/auth/sessao', autenticar, (req, res) => {
  res.json({ usuario: usuarioParaApi(req.usuario), termosAceitos: req.usuario.termos_aceitos || null });
});

// POST /auth/logout — invalida o token no Supabase Auth.
router.post('/auth/logout', autenticar, async (req, res, next) => {
  try {
    await db.auth.admin.signOut(req.token);
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

router.post('/auth/recuperacao', pendente('POST /auth/recuperacao'));
router.post('/auth/recuperacao/confirmar', pendente('POST /auth/recuperacao/confirmar'));
router.post('/auth/segundo-fator', autenticar, pendente('POST /auth/segundo-fator'));
router.post('/auth/senha', autenticar, pendente('POST /auth/senha'));
