/* Mock de integração (não é back-end de produção). Node >=22, sem dependências. */
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { randomUUID, createHash } = require('node:crypto');
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
// Dados mutáveis apenas em memória: reiniciar o processo restaura os exemplos JSON.
const now = () => new Date().toISOString();
const digest = (value) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function audit(r, user, tipo, detalhe = {}) {
  r.auditoria ||= [];
  r.auditoria.push({
    id: randomUUID(),
    tipo,
    usuarioId: user.id,
    dataHora: now(),
    visibilidade: 'interno',
    ...detalhe,
  });
  r.atualizadoEm = now();
}
function validate(r) {
  const campos = [];
  if (!(r.atividades || []).length && !r.semProducao)
    campos.push({
      passo: 'atividades',
      campo: 'lista',
      mensagem: 'Registre uma atividade ou marque dia sem produção.',
    });
  if (!r.declaracao?.aceita)
    campos.push({ passo: 'revisao', campo: 'declaracao', mensagem: 'Aceite a declaração de responsabilidade.' });
  return campos;
}
function notify(r, recipients, tipo) {
  for (const u of recipients)
    db.notificacoes.push({ id: randomUUID(), usuarioId: u.id, rdoId: r.id, tipo, lida: false, criadoEm: now() });
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
    // Criação de RDO: somente operacional vinculado à obra.
    let write = p.match(/^\/obras\/([^/]+)\/rdos$/);
    if (write && req.method === 'POST') {
      const obra = visibleObras(user).find((o) => o.id === decodeURIComponent(write[1]));
      if (!obra) return error(res, 404, 'NAO_ENCONTRADO', 'Obra não encontrada.');
      if (user.perfil !== 'operacional' || !obra.usuarioIds.includes(user.id))
        return error(res, 403, 'SEM_PERMISSAO', 'Somente operacional da obra.');
      const b = await body(req);
      if (!b.data || !b.turno) return error(res, 422, 'VALIDACAO', 'Informe data e turno.');
      if (b.idLocal) {
        const previous = db.rdos.find((r) => r.idLocal === b.idLocal && r.autorId === user.id);
        if (previous) return send(res, 200, previous);
      }
      if (
        !b.confirmarDuplicado &&
        db.rdos.some(
          (r) =>
            r.obraId === obra.id &&
            r.data === b.data &&
            r.turno === b.turno &&
            !['cancelado', 'retificado'].includes(r.status),
        )
      )
        return error(res, 409, 'RDO_DUPLICADO', 'Já existe RDO nesta obra, data e turno.');
      const previous = b.reaproveitarDe && db.rdos.find((r) => r.id === b.reaproveitarDe && r.obraId === obra.id);
      if (b.reaproveitarDe && !previous) return error(res, 422, 'VALIDACAO', 'RDO anterior inválido.');
      const numero = Math.max(0, ...db.rdos.filter((r) => r.obraId === obra.id).map((r) => Number(r.numero) || 0)) + 1;
      const r = {
        id: randomUUID(),
        idLocal: b.idLocal || null,
        obraId: obra.id,
        numero,
        versao: 1,
        data: b.data,
        turno: b.turno,
        status: 'rascunho',
        autorId: user.id,
        criadoEm: now(),
        atualizadoEm: now(),
        identificacao: { ...(previous?.identificacao || {}) },
        clima: {},
        maoDeObra: structuredClone(previous?.maoDeObra || []),
        equipamentos: structuredClone(previous?.equipamentos || []),
        atividades: (previous?.atividades || []).map((a) => ({ ...structuredClone(a), quantidade: 0 })),
        pendencias: structuredClone(previous?.pendencias || []),
        fotos: [],
        comentarios: [],
        auditoria: [],
        assinaturas: {},
        declaracao: { aceita: false },
        esclarecimentoPendente: false,
      };
      audit(r, user, 'rdo_criado');
      db.rdos.push(r);
      res.setHeader('Location', `/api/v1/rdos/${r.id}`);
      return send(res, 201, r);
    }
    write = p.match(/^\/rdos\/([^/]+)\/(conteudo|submeter|devolucao|validacao|manifestacao|comentarios)$/);
    if (
      write &&
      ((write[2] === 'conteudo' && req.method === 'PUT') || (write[2] !== 'conteudo' && req.method === 'POST'))
    ) {
      const r = db.rdos.find(
        (x) =>
          x.id === decodeURIComponent(write[1]) || (x.idLocal && `loc_${x.idLocal}` === decodeURIComponent(write[1])),
      );
      if (!r || !canSeeRdo(user, r)) return error(res, 404, 'NAO_ENCONTRADO', 'RDO não encontrado.');
      const action = write[2],
        b = await body(req);
      const master = user.perfil === 'master',
        author = user.perfil === 'operacional' && r.autorId === user.id;
      const client = user.perfil === 'cliente' && visibleObras(user).some((o) => o.id === r.obraId);
      const allowed =
        action === 'conteudo' || action === 'submeter'
          ? author
          : action === 'manifestacao'
            ? client
            : action === 'comentarios'
              ? master || author || client
              : master;
      if (!allowed) return error(res, 403, 'SEM_PERMISSAO', 'Perfil sem permissão.');
      const states = {
        conteudo: ['rascunho', 'devolvido'],
        submeter: ['rascunho', 'devolvido'],
        devolucao: ['submetido', 'em_analise'],
        validacao: ['submetido', 'em_analise'],
        manifestacao: ['enviado_cliente'],
      };
      if (states[action] && !states[action].includes(r.status))
        return error(res, 409, 'TRANSICAO_INVALIDA', 'Estado atual não permite esta operação.');
      if (action === 'conteudo') {
        if (b.atualizadoEm && b.atualizadoEm !== r.atualizadoEm)
          return error(res, 409, 'CONFLITO', 'RDO atualizado em outro dispositivo.');
        if (!b.conteudo || typeof b.conteudo !== 'object' || Array.isArray(b.conteudo))
          return error(res, 422, 'VALIDACAO', 'Informe conteudo.');
        const keys = [
          'data',
          'turno',
          'clima',
          'maoDeObra',
          'observacaoMaoDeObra',
          'equipamentos',
          'semProducao',
          'atividades',
          'materiais',
          'qualidade',
          'seguranca',
          'ocorrencias',
          'visitas',
          'pendencias',
          'planejamento',
          'semRegistro',
          'observacoesGerais',
          'declaracao',
          'assinaturaOperacional',
        ];
        for (const key of keys) if (Object.hasOwn(b.conteudo, key)) r[key] = structuredClone(b.conteudo[key]);
        if (Object.hasOwn(b.conteudo.identificacao || {}, 'responsavelPreenchimento')) {
          r.identificacao ||= {};
          r.identificacao.responsavelPreenchimento = b.conteudo.identificacao.responsavelPreenchimento;
        }
        audit(r, user, b.manual ? 'rascunho_salvo' : 'rascunho_atualizado');
      } else if (action === 'submeter') {
        const campos = validate(r);
        if (campos.length) return error(res, 422, 'VALIDACAO', 'Há erros que impedem o envio.', campos);
        r.status = 'submetido';
        r.submetidoEm = now();
        audit(r, user, 'rdo_submetido');
        notify(
          r,
          db.usuarios.filter((u) => u.perfil === 'master' && u.ativo),
          'rdo_submetido',
        );
      } else if (action === 'devolucao') {
        if (!String(b.motivo || '').trim()) return error(res, 422, 'VALIDACAO', 'Informe o motivo.');
        r.status = 'devolvido';
        r.devolucao = {
          motivo: b.motivo,
          prazo: b.prazo || null,
          contexto: b.contexto || null,
          dataHora: now(),
          usuarioId: user.id,
        };
        audit(r, user, 'rdo_devolvido');
        notify(
          r,
          db.usuarios.filter((u) => u.id === r.autorId),
          'rdo_devolvido',
        );
      } else if (action === 'validacao') {
        if (!b.assinatura || typeof b.assinatura !== 'object')
          return error(res, 422, 'VALIDACAO', 'Informe a assinatura.');
        r.assinaturas ||= {};
        r.assinaturas.master = { ...b.assinatura, usuarioId: user.id, dataHora: now(), versao: r.versao };
        r.hashTecnico = digest({ id: r.id, versao: r.versao, assinatura: r.assinaturas.master });
        r.status = b.enviarAgora ? 'enviado_cliente' : 'validado';
        if (b.enviarAgora) r.liberadoAoClienteEm = now();
        audit(r, user, 'rdo_validado');
        if (b.enviarAgora)
          notify(
            r,
            db.usuarios.filter((u) => u.perfil === 'cliente' && visibleObras(u).some((o) => o.id === r.obraId)),
            'rdo_enviado_cliente',
          );
      } else if (action === 'manifestacao') {
        if (!['ciencia', 'ressalva', 'esclarecimento'].includes(b.tipo))
          return error(res, 422, 'VALIDACAO', 'Tipo inválido.');
        if (b.tipo !== 'ciencia' && !String(b.texto || '').trim())
          return error(res, 422, 'VALIDACAO', 'Informe o texto.');
        if (b.tipo !== 'esclarecimento' && (!b.assinatura || typeof b.assinatura !== 'object'))
          return error(res, 422, 'VALIDACAO', 'Informe a assinatura.');
        if (b.tipo === 'esclarecimento') {
          r.esclarecimentoPendente = true;
        } else {
          r.assinaturas ||= {};
          r.assinaturas.cliente = {
            ...b.assinatura,
            tipo: b.tipo,
            texto: b.texto || '',
            usuarioId: user.id,
            dataHora: now(),
            versao: r.versao,
          };
          r.hashFinal = digest({ hashTecnico: r.hashTecnico, assinatura: r.assinaturas.cliente });
          r.status = 'finalizado';
          r.finalizadoEm = now();
        }
        audit(r, user, `manifestacao_${b.tipo}`, { visibilidade: 'cliente' });
        notify(
          r,
          db.usuarios.filter((u) => u.perfil === 'master' && u.ativo),
          'manifestacao_cliente',
        );
      } else if (action === 'comentarios') {
        if (r.status === 'cancelado' || (client && !['enviado_cliente', 'finalizado'].includes(r.status)))
          return error(res, 409, 'TRANSICAO_INVALIDA', 'Comentários indisponíveis neste estado.');
        if (!String(b.texto || '').trim()) return error(res, 422, 'VALIDACAO', 'Informe o comentário.');
        const visibilidade = client || (r.esclarecimentoPendente && master) ? 'cliente' : b.visibilidade || 'interno';
        if (!['cliente', 'interno'].includes(visibilidade) || (visibilidade === 'cliente' && !r.liberadoAoClienteEm))
          return error(res, 422, 'VALIDACAO', 'Visibilidade inválida.');
        const comment = {
          id: randomUUID(),
          usuarioId: user.id,
          texto: b.texto,
          contexto: b.contexto || null,
          contextoRef: b.contextoRef || null,
          visibilidade,
          tipo: master && r.esclarecimentoPendente ? 'resposta' : 'comentario',
          dataHora: now(),
        };
        r.comentarios ||= [];
        r.comentarios.push(comment);
        if (master && r.esclarecimentoPendente) r.esclarecimentoPendente = false;
        audit(r, user, 'comentario_adicionado', { visibilidade });
        return send(res, 201, { ...comment, rdo: r });
      }
      return send(res, 200, r);
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
