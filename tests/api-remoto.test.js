import test from 'node:test';
import assert from 'node:assert/strict';
import { executarRemoto, rotasRemotas } from '../src/services/api/remoto.js';
import { conteudoParaApi } from '../src/services/api/payloads.js';
import { montarUploadFoto } from '../src/services/api/upload.js';
import { gerarSeed } from '../src/data/seed.js';

test('Criação envia só os campos do contrato e conserva o número oficial da resposta', async () => {
  const state = gerarSeed();
  let chamada;
  const rdo = { ...state.rdos[0], id: 'oficial', numero: 123 };
  const resposta = await executarRemoto(
    'criarRdo',
    {
      obraId: 'obra/alfa',
      data: '2026-10-24',
      turno: 'diurno',
      id: 'nao-enviar',
      numero: 999,
    },
    {
      itemId: 'q1',
      getState: () => ({ session: { deviceId: 'dev1', deviceLabel: 'Android (API 35)' } }),
      request: async (path, options) => {
        chamada = { path, ...options };
        return rdo;
      },
    },
  );
  assert.equal(chamada.path, '/api/v1/obras/obra%2Falfa/rdos');
  assert.deepEqual(chamada.body, { data: '2026-10-24', turno: 'diurno' });
  assert.equal(chamada.headers['Idempotency-Key'], 'q1');
  assert.equal(chamada.headers['X-Device-Id'], 'dev1');
  assert.equal(chamada.headers['X-Device-Label'], 'Android (API 35)');
  assert.equal(resposta.alteracoes.rdos[0].numero, 123);
});

test('Conteúdo não envia fotos, número, hashes, IP nem carimbos oficiais', () => {
  const conteudo = conteudoParaApi({
    id: 'r1',
    numero: 4,
    status: 'submetido',
    hashTecnico: 'hash',
    fotos: [{ uri: 'file:///foto.jpg' }],
    dataHora: 'hora-local',
    clima: { precipitacaoMm: '42,5' },
    identificacao: { responsavelPreenchimento: 'João', obraNome: 'não enviar' },
    maoDeObra: [{ quantidade: '12', telefone: '09812345678' }],
    declaracao: { aceita: true, dataHora: 'hora-local' },
    assinaturaOperacional: { tracos: [], largura: 300, altura: 100, ip: 'IP falso', dataHora: 'hora-local' },
  });
  assert.equal(conteudo.numero, undefined);
  assert.equal(conteudo.hashTecnico, undefined);
  assert.equal(conteudo.fotos, undefined);
  assert.equal(conteudo.clima.precipitacaoMm, 42.5);
  assert.equal(conteudo.maoDeObra[0].quantidade, 12);
  assert.equal(conteudo.maoDeObra[0].telefone, '09812345678');
  assert.deepEqual(conteudo.identificacao, { responsavelPreenchimento: 'João' });
  assert.deepEqual(conteudo.declaracao, { aceita: true });
  assert.equal(conteudo.assinaturaOperacional.ip, undefined);
  assert.equal(conteudo.assinaturaOperacional.dataHora, undefined);
});

test('Cadastros escolhem POST para novo e PUT para existente sem transmitir senha', () => {
  const state = { users: [{ id: 'u1' }], obras: [], clientes: [] };
  const nova = rotasRemotas.salvarUsuario(
    { usuario: { id: 'local', nome: 'Nova', senha: 'secreta' }, obraIds: ['o1'] },
    state,
  );
  assert.equal(nova.method, 'POST');
  assert.equal(nova.body.id, undefined);
  assert.equal(nova.body.senha, undefined);
  assert.deepEqual(nova.body.obraIds, ['o1']);
  const existente = rotasRemotas.salvarUsuario({ usuario: { id: 'u1', nome: 'Nome novo' } }, state);
  assert.equal(existente.method, 'PUT');
  assert.equal(existente.path, '/usuarios/u1');
});

test('Notificações 204 recarregam a lista em vez de usar uma confirmação local simulada', async () => {
  const chamadas = [];
  const resposta = await executarRemoto(
    'marcarTodasLidas',
    {},
    {
      request: async (path, options) => {
        chamadas.push({ path, options });
        return options?.method === 'POST' ? null : { itens: [{ id: 'n1', lida: true }], total: 1 };
      },
    },
  );
  assert.equal(chamadas[0].path, '/api/v1/notificacoes/marcar-todas-lidas');
  assert.equal(chamadas[0].options.body, undefined);
  assert.deepEqual(resposta.alteracoes.notifications, [{ id: 'n1', lida: true }]);
});

test('Verificação intermediária real não inventa endpoint nem afirma que o código já foi validado', async () => {
  const dados = await executarRemoto(
    'verificarCodigo',
    { email: 'a@b.com', codigo: '123456' },
    {
      request: async () => assert.fail('O contrato não oferece uma rota separada para verificar o código'),
    },
  );
  assert.equal(dados.confirmacaoPendente, true);
  let enviada;
  await executarRemoto(
    'redefinirSenha',
    { ...dados, senha: 'NovaSenha123' },
    {
      request: async (path, options) => {
        enviada = { path, ...options };
        return null;
      },
    },
  );
  assert.equal(enviada.path, '/api/v1/auth/recuperacao/confirmar');
  assert.equal(enviada.autenticado, false);
  assert.deepEqual(enviada.body, { email: 'a@b.com', codigo: '123456', novaSenha: 'NovaSenha123' });
});

test('Foto e entrega usam multipart com os metadados previstos no contrato', async () => {
  const foto = await montarUploadFoto(
    {
      uri: 'data:image/png;base64,aGk=',
      nome: 'obra.png',
      legenda: 'Obra',
      local: 'Piso 1',
      vinculo: { tipo: 'atividade', id: 'a1' },
      dataHora: 'captura',
      localizacao: { latitude: 0, longitude: -44.3 },
      largura: 1200,
    },
    { web: true },
  );
  assert.equal(foto.get('legenda'), 'Obra');
  assert.equal(foto.get('local'), 'Piso 1');
  assert.equal(foto.get('vinculoId'), 'a1');
  assert.equal(foto.get('capturadaEm'), 'captura');
  assert.equal(foto.get('latitude'), '0');
  assert.equal(foto.get('largura'), '1200');
  assert.equal(foto.get('arquivo').name, 'obra.png');
  const arquivo = await montarUploadFoto(
    { uri: 'data:application/pdf;base64,aGk=', nome: 'projeto.pdf' },
    { web: true, metadados: false },
  );
  assert.equal(arquivo.get('legenda'), null);
  assert.ok(arquivo.get('arquivo'));
});

test('Retificação recarrega a versão antiga e preserva a nova para a navegação', async () => {
  const seed = gerarSeed();
  const resposta = await executarRemoto(
    'retificarRdo',
    { rdoId: 'antigo', motivo: 'Corrigir data' },
    {
      request: async (_, options) => ({ ...seed.rdos[0], id: options?.method === 'POST' ? 'novo' : 'antigo' }),
    },
  );
  assert.deepEqual(
    resposta.alteracoes.rdos.map((r) => r.id),
    ['novo', 'antigo'],
  );
});
