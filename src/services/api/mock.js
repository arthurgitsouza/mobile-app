import { ACTIONS } from '../../store/actions.js';
import { criarRdoVazio, proximoNumero, reaproveitarDoAnterior } from '../../domain/rdo.js';
import { uid } from '../../utils/format.js';
import { ApiError } from './client.js';

// Senhas e códigos de demonstração existem somente neste adaptador.
export function criarMock({ agora = () => Date.now(), demo = true } = {}) {
  const recuperacoes = new Map();
  return function executarMock(nome, s, args = {}) {
    if (nome === 'entrar') {
      const user = args.email
        ? s.users.find((u) => u.email.toLowerCase() === args.email.trim().toLowerCase() && u.senha === args.senha)
        : s.users.find((u) => u.id === args.userId);
      if (!user) throw new ApiError({ status: 401, codigo: 'CREDENCIAIS', mensagem: 'E-mail ou senha incorretos.' });
      if (!user.ativo)
        throw new ApiError({
          status: 403,
          codigo: 'BLOQUEADO',
          mensagem: 'Este usuário está bloqueado. Fale com o administrador.',
        });
      return { state: ACTIONS.entrar(s, { ...args, userId: user.id }), token: uid('mock'), usuario: user };
    }
    if (nome === 'solicitarRecuperacao') {
      const user = s.users.find((u) => u.email.toLowerCase() === args.email.trim().toLowerCase() && u.ativo);
      const solicitacaoId = uid('rec');
      const codigoDemo = user ? String(Math.floor(100000 + Math.random() * 900000)) : null;
      recuperacoes.set(solicitacaoId, {
        userId: user?.id,
        codigo: codigoDemo,
        expira: agora() + 600000,
        tentativas: 0,
      });
      return { state: s, resultado: { solicitacaoId, ...(demo ? { codigoDemo } : {}) } };
    }
    if (nome === 'verificarCodigo' || nome === 'redefinirSenha') {
      const rec = recuperacoes.get(args.solicitacaoId);
      if (!rec || !rec.userId || rec.expira <= agora() || (nome === 'verificarCodigo' && rec.tentativas >= 5))
        throw new ApiError({
          status: 422,
          codigo: 'CODIGO_EXPIRADO',
          mensagem: 'Código inválido ou expirado. Solicite um novo código.',
        });
      if (nome === 'verificarCodigo') {
        rec.tentativas++;
        if (rec.codigo !== args.codigo)
          throw new ApiError({ status: 422, codigo: 'CODIGO_INVALIDO', mensagem: 'Código incorreto.' });
        rec.resetToken = uid('reset');
        return { state: s, resultado: { resetToken: rec.resetToken } };
      }
      if (!rec.resetToken || args.resetToken !== rec.resetToken)
        throw new ApiError({ status: 401, mensagem: 'Confirme o código antes de alterar a senha.' });
      if (
        typeof args.senha !== 'string' ||
        args.senha.length < 8 ||
        !/[A-Za-z]/.test(args.senha) ||
        !/\d/.test(args.senha)
      )
        throw new ApiError({ status: 422, mensagem: 'Use 8 ou mais caracteres, com letras e números.' });
      recuperacoes.delete(args.solicitacaoId);
      return { state: ACTIONS.sair(ACTIONS.alterarSenha(s, { userId: rec.userId, senha: args.senha })) };
    }
    if (nome === 'criarRdo' && !args.rdo) {
      const obra = s.obras.find((o) => o.id === args.obraId);
      const autor = s.users.find((u) => u.id === s.session.userId);
      if (!obra || !autor) throw new ApiError({ status: 422, mensagem: 'Obra ou autor inválido.' });
      let rdo = criarRdoVazio({
        obra,
        autor,
        data: args.data,
        turno: args.turno,
        numero: proximoNumero(s.rdos, obra.id),
      });
      const anterior = s.rdos.find((r) => r.id === args.reaproveitarDe);
      if (anterior) rdo = reaproveitarDoAnterior(rdo, anterior);
      return { state: ACTIONS.criarRdo(s, { rdo }), resultado: rdo };
    }
    if (nome === 'enviarFoto') {
      const state = {
        ...s,
        rdos: s.rdos.map((r) =>
          r.id !== args.rdoId
            ? r
            : { ...r, fotos: r.fotos.map((f) => (f.id === args.foto.id ? { ...f, envio: 'enviada' } : f)) },
        ),
      };
      return { state };
    }
    if (nome === 'restaurarSessao') return { state: s };
    if (nome === 'alterarSenha' && args.senhaAtual !== undefined) {
      const user = s.users.find((u) => u.id === args.userId);
      if (!user || user.senha !== args.senhaAtual)
        throw new ApiError({ status: 422, mensagem: 'Senha atual incorreta.' });
    }
    if (!ACTIONS[nome]) throw new ApiError({ codigo: 'ACAO_INVALIDA', mensagem: 'Essa ação não foi encontrada.' });
    return { state: ACTIONS[nome](s, args) };
  };
}
