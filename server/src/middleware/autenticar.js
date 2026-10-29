import { auth, db } from '../supabase.js';
import { ApiError, erroDoBanco } from '../erros.js';

// Lê o token "Authorization: Bearer <token>", confere no Supabase Auth e carrega o perfil do usuário
// (tabela `usuarios`, ligada ao Auth pela coluna `auth_id`). Deixa o usuário em req.usuario.
export async function autenticar(req, _res, next) {
  try {
    if (!auth || !db) throw new ApiError(503, 'BANCO_NAO_CONFIGURADO', 'O servidor ainda não está ligado ao banco.');
    const token = req.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) throw new ApiError(401, 'SEM_SESSAO', 'Entre novamente para continuar.');

    const { data, error } = await auth.auth.getUser(token);
    if (error || !data?.user) throw new ApiError(401, 'SESSAO_EXPIRADA', 'Sua sessão expirou. Entre novamente.');

    const { data: usuario, error: erroPerfil } = await db
      .from('usuarios')
      .select('*')
      .eq('auth_id', data.user.id)
      .maybeSingle();
    if (erroPerfil) throw erroDoBanco(erroPerfil);
    if (!usuario) throw new ApiError(403, 'SEM_PERFIL', 'Usuário sem perfil cadastrado. Fale com o administrador.');
    if (usuario.ativo === false)
      throw new ApiError(403, 'BLOQUEADO', 'Este usuário está bloqueado. Fale com o administrador.');

    req.usuario = usuario;
    req.token = token;
    next();
  } catch (err) {
    next(err);
  }
}

// Uso: router.post('/obras', exigirPerfil('master'), handler)
export const exigirPerfil =
  (...perfis) =>
  (req, _res, next) =>
    perfis.includes(req.usuario?.perfil)
      ? next()
      : next(new ApiError(403, 'PROIBIDO', 'Seu perfil não pode fazer esta ação.'));
