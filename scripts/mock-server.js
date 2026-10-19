/* Mock de integração (não é back-end de produção). Node >=22, sem dependências. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const PORT = Number(process.env.MOCK_PORT || 3001);
const ROOT = path.resolve(__dirname, '../docs/exemplos');
const load = (name) => JSON.parse(fs.readFileSync(path.join(ROOT, `${name}.json`), 'utf8'));
const db = Object.fromEntries(
  [
    'empresa',
    'clientes',
    'usuarios',
    'obras',
    'rdos',
    'notificacoes',
    'catalogos',
    'configuracoes',
    'academico',
    'auditoria-global',
  ].map((n) => [n, load(n)]),
);
const sessions = new Map();
const error = (res, status, codigo, mensagem, campos) =>
  send(res, status, { codigo, mensagem, ...(campos ? { campos } : {}) });
function send(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Device-Id, X-Device-Label, Idempotency-Key',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  });
  res.end(status === 204 ? undefined : JSON.stringify(obj));
}
function page(items, q, extra = {}) {
  const pagina = Math.max(1, Number(q.get('pagina')) || 1),
    porPagina = Math.min(100, Math.max(1, Number(q.get('porPagina')) || 20));
  return {
    itens: items.slice((pagina - 1) * porPagina, pagina * porPagina),
    total: items.length,
    pagina,
    porPagina,
    ...extra,
  };
}
function visibleObras(user) {
  return user.perfil === 'master'
    ? db.obras
    : db.obras.filter(
        (o) =>
          o.usuarioIds.includes(user.id) ||
          (user.perfil === 'cliente' &&
            db.clientes.some((c) => c.id === o.clienteId && (user.clienteId === c.id || user.email === c.email))),
      );
}
function canSeeRdo(user, r) {
  return (
    visibleObras(user).some((o) => o.id === r.obraId) &&
    (user.perfil !== 'cliente' ||
      (['enviado_cliente', 'finalizado', 'retificado', 'cancelado'].includes(r.status) && !!r.liberadoAoClienteEm))
  );
}
function summary(r) {
  return Object.fromEntries(
    [
      'id',
      'obraId',
      'numero',
      'versao',
      'data',
      'turno',
      'status',
      'autorId',
      'atualizadoEm',
      'submetidoEm',
      'esclarecimentoPendente',
    ]
      .map((k) => [k, r[k]])
      .concat([
        ['devolucao', r.devolucao?.prazo ? { prazo: r.devolucao.prazo } : null],
        ['totalTrabalhadores', (r.maoDeObra || []).reduce((n, x) => n + (Number(x.quantidade) || 0), 0)],
        ['totalFotos', r.fotos?.length || 0],
        ['totalOcorrencias', r.ocorrencias?.length || 0],
      ]),
  );
}
async function body(req) {
  let raw = '';
  for await (const c of req) {
    raw += c;
    if (raw.length > 1e6) throw Error('Corpo muito grande');
  }
  return raw ? JSON.parse(raw) : {};
}
const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204);
  let url;
  try {
    url = new URL(req.url, `http://localhost:${PORT}`);
  } catch {
    return error(res, 400, 'REQUISICAO_INVALIDA', 'URL inválida.');
  }
  const p = url.pathname.replace(/^\/api\/v1(?=\/|$)/, '');
  const q = url.searchParams;
  try {
    if (p === '/health' && req.method === 'GET') return send(res, 200, { ok: true, modo: 'mock' });
    if (p === '/auth/login' && req.method === 'POST') {
      const b = await body(req);
      const u = db.usuarios.find((x) => x.email?.toLowerCase() === String(b.email || '').toLowerCase());
      if (!u || b.senha !== '123456')
        return error(res, 401, 'CREDENCIAIS_INVALIDAS', 'E-mail ou senha incorretos (senha fictícia: 123456).');
      if (!u.ativo) return error(res, 403, 'USUARIO_BLOQUEADO', 'Usuário bloqueado.');
      const token = `mock-${u.id}-${require('node:crypto').randomUUID()}`;
      sessions.set(token, u.id);
      const { senha, ...usuario } = u;
      return send(res, 200, {
        token,
        expiraEm: new Date(Date.now() + 86400000).toISOString(),
        usuario,
        termosAceitos: null,
      });
    }
    const token = /^Bearer (.+)$/.exec(req.headers.authorization || '')?.[1];
    const uid = sessions.get(token);
    const user = db.usuarios.find((u) => u.id === uid);
    if (!user) return error(res, 401, 'NAO_AUTENTICADO', 'Informe um token mock válido.');
    if (!user.ativo) return error(res, 403, 'USUARIO_BLOQUEADO', 'Usuário bloqueado.');
    if (p === '/auth/sessao' && req.method === 'GET') return send(res, 200, { usuario: user, termosAceitos: null });
    if (p === '/auth/logout' && req.method === 'POST') {
      sessions.delete(token);
      return send(res, 204);
    }
    if (p === '/obras' && req.method === 'GET') {
      let a = visibleObras(user);
      if (q.has('status')) a = a.filter((o) => o.status === q.get('status'));
      if (q.has('clienteId')) a = a.filter((o) => o.clienteId === q.get('clienteId'));
      return send(res, 200, page(a, q));
    }
    let m = p.match(/^\/obras\/([^/]+)$/);
    if (m && req.method === 'GET') {
      const o = visibleObras(user).find((o) => o.id === decodeURIComponent(m[1]));
      return o ? send(res, 200, o) : error(res, 404, 'NAO_ENCONTRADO', 'Obra não encontrada.');
    }
    if (p === '/rdos' && req.method === 'GET') {
      let a = db.rdos.filter((r) => canSeeRdo(user, r));
      for (const [key, field] of [
        ['obraId', 'obraId'],
        ['numero', 'numero'],
        ['autorId', 'autorId'],
      ])
        if (q.has(key)) a = a.filter((r) => String(r[field]) === q.get(key));
      if (q.has('status')) {
        const statuses = q.get('status').split(',');
        a = a.filter((r) => statuses.includes(r.status));
      }
      if (q.has('de')) a = a.filter((r) => r.data >= q.get('de'));
      if (q.has('ate')) a = a.filter((r) => r.data <= q.get('ate'));
      if (q.has('atividade'))
        a = a.filter((r) =>
          (r.atividades || []).some((x) =>
            String(x.servico || '')
              .toLowerCase()
              .includes(q.get('atividade').toLowerCase()),
          ),
        );
      if (q.has('ocorrencia'))
        a = a.filter((r) =>
          q.get('ocorrencia') === 'true'
            ? (r.ocorrencias || []).length > 0
            : (r.ocorrencias || []).some((x) =>
                String(x.fato || '')
                  .toLowerCase()
                  .includes(q.get('ocorrencia').toLowerCase()),
              ),
        );
      if (q.get('pendente') === 'true') a = a.filter((r) => r.esclarecimentoPendente || r.sync?.pendente);
      const order = q.get('ordem') || '-data';
      a.sort((x, y) =>
        order === 'numero'
          ? x.numero - y.numero
          : order === 'data'
            ? x.data.localeCompare(y.data)
            : y.data.localeCompare(x.data),
      );
      return send(res, 200, page(a.map(summary), q));
    }
    m = p.match(/^\/rdos\/([^/]+)(?:\/(auditoria|validacao|comentarios|assinaturas))?$/);
    if (m && req.method === 'GET') {
      const r = db.rdos.find((r) => r.id === decodeURIComponent(m[1]));
      if (!r || !canSeeRdo(user, r)) return error(res, 404, 'NAO_ENCONTRADO', 'RDO não encontrado.');
      if (m[2] === 'auditoria')
        return send(
          res,
          200,
          user.perfil === 'cliente'
            ? (r.auditoria || []).filter((x) => x.visibilidade === 'cliente')
            : r.auditoria || [],
        );
      if (m[2] === 'comentarios')
        return send(
          res,
          200,
          user.perfil === 'cliente'
            ? (r.comentarios || []).filter((x) => x.visibilidade === 'cliente')
            : r.comentarios || [],
        );
      if (m[2] === 'assinaturas')
        return send(res, 200, { ...(r.assinaturas || {}), hashTecnico: r.hashTecnico, hashFinal: r.hashFinal });
      if (m[2] === 'validacao') return error(res, 501, 'NAO_IMPLEMENTADO', 'Validação de negócio ainda não simulada.');
      return send(
        res,
        200,
        user.perfil === 'cliente'
          ? {
              ...r,
              comentarios: (r.comentarios || []).filter((x) => x.visibilidade === 'cliente'),
              auditoria: (r.auditoria || []).filter((x) => x.visibilidade === 'cliente'),
            }
          : r,
      );
    }
    if (p === '/notificacoes' && req.method === 'GET') {
      let a = db.notificacoes.filter((n) => n.usuarioId === user.id);
      const naoLidas = a.filter((n) => !n.lida).length;
      if (q.has('lida')) a = a.filter((n) => String(n.lida) === q.get('lida'));
      if (q.has('tipo')) a = a.filter((n) => n.tipo === q.get('tipo'));
      if (q.has('rdoId')) a = a.filter((n) => n.rdoId === q.get('rdoId'));
      return send(res, 200, page(a, q, { naoLidas }));
    }
    m = p.match(/^\/notificacoes\/([^/]+)$/);
    if (m && req.method === 'PATCH') {
      const n = db.notificacoes.find((n) => n.id === m[1] && n.usuarioId === user.id);
      if (!n) return error(res, 404, 'NAO_ENCONTRADO', 'Notificação não encontrada.');
      const b = await body(req);
      if (b.lida !== true)
        return error(res, 422, 'VALIDACAO', 'Informe lida: true.', [
          { campo: 'lida', mensagem: 'Valor deve ser true.' },
        ]);
      n.lida = true;
      return send(res, 200, n);
    }
    if (p === '/notificacoes/marcar-todas-lidas' && req.method === 'POST') {
      db.notificacoes.filter((n) => n.usuarioId === user.id).forEach((n) => (n.lida = true));
      return send(res, 204);
    }
    if (['/usuarios', '/auditoria', '/academico'].includes(p) && user.perfil !== 'master')
      return error(res, 403, 'SEM_PERMISSAO', 'Apenas master.');
    const reads = {
      '/usuarios': db.usuarios,
      '/clientes': db.clientes,
      '/empresa': db.empresa,
      '/catalogos': db.catalogos,
      '/configuracoes': Object.fromEntries(
        Object.entries(db.configuracoes).filter(([k]) => !['forceOffline', 'simularFalhaEmail'].includes(k)),
      ),
      '/auditoria': db['auditoria-global'],
      '/academico': db.academico,
    };
    if (req.method === 'GET' && Object.hasOwn(reads, p))
      return send(res, 200, Array.isArray(reads[p]) ? page(reads[p], q) : reads[p]);
    return error(
      res,
      501,
      'NAO_IMPLEMENTADO',
      'Esta rota ainda não é simulada neste mock. Consulte docs/mock-server.md.',
    );
  } catch (e) {
    return error(
      res,
      e instanceof SyntaxError ? 400 : 500,
      e instanceof SyntaxError ? 'REQUISICAO_INVALIDA' : 'ERRO_INTERNO',
      e instanceof SyntaxError ? 'JSON inválido.' : 'Falha interna no mock.',
    );
  }
});
if (require.main === module)
  server.listen(PORT, '0.0.0.0', () => console.log(`Mock em http://localhost:${PORT}/api/v1 (GET /health)`));
module.exports = { server };
