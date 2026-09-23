// Testes das regras de negócio e do fluxo principal (seção 21 do documento-base).
// Executar com: npm test  (Node >= 22, sem dependências extras).
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';

import { sha256 } from '../src/utils/sha256.js';
import { hashOf } from '../src/utils/object.js';
import { addDays, hojeObra, nowISO } from '../src/utils/date.js';
import { gerarSeed } from '../src/data/seed.js';
import { criarRdoVazio, proximoNumero, conteudoTecnico, totalTrabalhadores } from '../src/domain/rdo.js';
import { validarRdo } from '../src/domain/validation.js';
import { podeVerRdo, acoesDisponiveis, estaBloqueado } from '../src/domain/workflow.js';
import { calcularLembretes } from '../src/domain/lembretes.js';
import * as A from '../src/store/actions.js';

const assinatura = { ip: '187.0.0.x (simulado)', dispositivo: 'Teste', metodo2fa: 'otp', tracos: [[{ x: 1, y: 1 }, { x: 5, y: 5 }]], largura: 300, altura: 120 };

function preencher(rdo) {
  const c = { ...rdo };
  c.clima = { ...c.clima, periodos: { ...c.clima.periodos, manha: { condicao: 'ensolarado', temperatura: '28' } } };
  c.maoDeObra = [
    { id: 'm1', empresa: 'Equipe própria', funcao: 'Pedreiro', quantidade: '4', horaInicio: '07:00', horaFim: '16:00', horas: '8', observacao: '' },
    { id: 'm2', empresa: 'Equipe própria', funcao: 'Servente', quantidade: '6', horaInicio: '07:00', horaFim: '16:00', horas: '8', observacao: '' },
  ];
  c.atividades = [{ id: 'a1', frente: 'Térreo', servico: 'Alvenaria de vedação', descricao: '', unidade: 'm²', quantidadeDia: '42', referenciaEAP: '', percentual: '40', situacao: 'em_andamento', observacao: '' }];
  c.fotos = [
    { id: 'f1', numero: 1, uri: null, legenda: 'Alvenaria eixo B–D', local: 'Térreo', vinculo: { tipo: 'atividade', id: 'a1' }, autorId: rdo.autorId, dataHora: nowISO(), envio: 'local' },
    { id: 'f2', numero: 2, uri: null, legenda: 'Sapatas', local: 'Obra', vinculo: null, autorId: rdo.autorId, dataHora: nowISO(), envio: 'local' },
  ];
  c.seguranca = { ...c.seguranca, semIncidentes: true };
  c.declaracao = { aceita: true, dataHora: nowISO() };
  c.assinaturaOperacional = { usuarioId: rdo.autorId, nome: 'x', dataHora: nowISO(), tracos: [], largura: 300, altura: 120 };
  return c;
}

test('SHA-256 idêntico ao do Node (incl. acentos e emoji)', () => {
  for (const s of ['', 'abc', 'RDO nº 0007 — Obra Alfa ✓ 😀', 'x'.repeat(64), 'x'.repeat(1000)]) {
    assert.equal(sha256(s), createHash('sha256').update(s, 'utf8').digest('hex'));
  }
});

test('Seed: todo RDO não-rascunho é válido e o hash técnico confere', () => {
  const s = gerarSeed();
  for (const r of s.rdos.filter((x) => x.status !== 'rascunho')) {
    const obra = s.obras.find((o) => o.id === r.obraId);
    assert.equal(validarRdo(r, { obra, rdos: s.rdos }).erros.length, 0, `RDO ${r.id} com erros`);
    if (r.hashTecnico) assert.equal(hashOf(conteudoTecnico(r)), r.hashTecnico, `hash divergente em ${r.id}`);
  }
});

test('Exemplo do documento: 12 trabalhadores calculados pelas funções', () => {
  const s = gerarSeed();
  const r = s.rdos.find((x) => x.obraId === 'obra_alfa' && x.numero === 7);
  assert.equal(totalTrabalhadores(r), 12);
});

test('Regras de submissão (seção 9)', () => {
  const s = gerarSeed();
  const obra = s.obras[0];
  const joao = s.users.find((u) => u.id === 'u_joao');
  const base = criarRdoVazio({ obra, autor: joao, data: hojeObra(), numero: proximoNumero(s.rdos, obra.id) });
  const v0 = validarRdo(base, { obra, rdos: s.rdos });
  assert.equal(v0.valido, false);
  assert.ok(v0.erros.some((e) => e.passo === 'clima'), 'exige condição climática');
  assert.ok(v0.erros.some((e) => e.passo === 'atividades'), 'exige atividade ou justificativa');
  assert.ok(v0.erros.some((e) => e.passo === 'revisao'), 'exige declaração final');

  const ok = preencher(base);
  assert.equal(validarRdo(ok, { obra, rdos: s.rdos }).valido, true);

  // dia sem produção exige justificativa
  const semProd = { ...ok, atividades: [], semProducao: { ativo: true, justificativa: '' } };
  assert.ok(validarRdo(semProd, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'justificativa'));
  assert.equal(validarRdo({ ...semProd, semProducao: { ativo: true, justificativa: 'Chuva forte o dia todo' } }, { obra, rdos: s.rdos }).valido, true);

  // chuva exige duração/precipitação e impacto
  const chuva = { ...ok, clima: { ...ok.clima, choveu: true } };
  assert.ok(validarRdo(chuva, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'chuva'));
  const chuvaImpacto = { ...ok, clima: { ...ok.clima, choveu: true, precipitacaoMm: '4', impacto: 'parcial' } };
  assert.ok(validarRdo(chuvaImpacto, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'horasParalisadas'));

  // equipamento parado exige motivo e duração
  const eq = { ...ok, equipamentos: [{ id: 'e1', tipo: 'Betoneira', quantidade: '1', horasDisponiveis: '8', horasProdutivas: '6', horasParadas: '2', motivoParada: '', condicao: 'operante' }] };
  assert.ok(validarRdo(eq, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'motivoParada'));

  // foto exige legenda
  const foto = { ...ok, fotos: [{ ...ok.fotos[0], legenda: '' }] };
  assert.ok(validarRdo(foto, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'legenda'));

  // data futura não permitida
  const futuro = { ...ok, data: addDays(hojeObra(), 2) };
  assert.ok(validarRdo(futuro, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'data'));

  // RDO duplicado (mesma obra/data/turno) gera alerta
  const existente = s.rdos.find((r) => r.obraId === obra.id && r.status === 'finalizado');
  const dup = { ...ok, data: existente.data, turno: existente.turno };
  assert.ok(validarRdo(dup, { obra, rdos: s.rdos }).avisos.some((a) => /Já existe/.test(a.mensagem)));

  // obra que exige assinatura do operacional
  assert.ok(validarRdo({ ...ok, assinaturaOperacional: null }, { obra, rdos: s.rdos }).erros.some((e) => e.campo === 'assinatura'));
});

test('Cenário principal: operacional → master (devolve) → corrige → valida/assina → cliente com ressalva → PDF/hash', () => {
  let s = gerarSeed();
  const obra = s.obras[0];
  const joao = s.users.find((u) => u.id === 'u_joao');
  const master = s.users.find((u) => u.id === 'u_master');
  const fernanda = s.users.find((u) => u.id === 'u_fernanda');

  // 1–2. operacional abre o RDO do dia e preenche
  const novo = preencher(criarRdoVazio({ obra, autor: joao, data: hojeObra(), numero: proximoNumero(s.rdos, obra.id) }));
  s = A.criarRdo(s, { rdo: novo });
  assert.equal(s.rdos.find((r) => r.id === novo.id).status, 'rascunho');

  // 3–4. offline: fica pendente e o master NÃO é notificado ainda; ao reconectar sincroniza
  const antes = s.notifications.filter((n) => n.usuarioId === master.id).length;
  s = A.submeterRdo(s, { rdoId: novo.id, userId: joao.id, online: false });
  assert.equal(s.rdos.find((r) => r.id === novo.id).sync.pendente, true);
  assert.equal(s.notifications.filter((n) => n.usuarioId === master.id).length, antes);
  s = A.sincronizarPendentes(s, {});
  assert.equal(s.rdos.find((r) => r.id === novo.id).sync.pendente, false);
  assert.equal(s.notifications.filter((n) => n.usuarioId === master.id).length, antes + 1);
  assert.match(s.notifications[0].mensagem, /pronto para análise/);

  // 5. master analisa, comenta e devolve
  s = A.iniciarAnalise(s, { rdoId: novo.id, userId: master.id });
  assert.equal(s.rdos.find((r) => r.id === novo.id).status, 'em_analise');
  s = A.comentarRdo(s, { rdoId: novo.id, userId: master.id, texto: 'Foto 02 sem local preciso.', contexto: 'fotos' });
  s = A.devolverRdo(s, { rdoId: novo.id, userId: master.id, motivo: 'Foto 02 sem local preciso.', prazo: nowISO() });
  let r = s.rdos.find((x) => x.id === novo.id);
  assert.equal(r.status, 'devolvido');
  assert.ok(s.notifications.some((n) => n.usuarioId === joao.id && n.tipo === 'rdo_devolvido' && n.rdoId === novo.id));

  // 6. operacional corrige e reenvia; master valida, chancela e assina
  s = A.salvarRdo(s, { rdo: { ...r, fotos: r.fotos.map((f) => (f.numero === 2 ? { ...f, local: 'Sapata S4, eixo D/3' } : f)) } });
  s = A.submeterRdo(s, { rdoId: novo.id, userId: joao.id, online: true });
  assert.equal(s.rdos.find((x) => x.id === novo.id).status, 'submetido');
  s = A.validarEAssinar(s, { rdoId: novo.id, userId: master.id, assinatura, enviarAgora: true, canais: ['app', 'email'] });
  r = s.rdos.find((x) => x.id === novo.id);
  assert.equal(r.status, 'enviado_cliente');
  assert.ok(r.hashTecnico && r.assinaturas.master.hash === r.hashTecnico);
  assert.ok(estaBloqueado(r));

  // conteúdo bloqueado: edição posterior é ignorada
  const tentativa = A.salvarRdo(s, { rdo: { ...r, observacoesGerais: 'alteração silenciosa' } });
  assert.equal(tentativa.rdos.find((x) => x.id === novo.id).observacoesGerais, '');

  // 7. cliente recebe (push + e-mail simulado) e assina com ressalva
  assert.ok(s.notifications.some((n) => n.usuarioId === fernanda.id && n.rdoId === novo.id));
  s = A.assinarComoCliente(s, { rdoId: novo.id, userId: fernanda.id, tipo: 'ressalva', texto: 'Solicito confirmação do local da Foto 02.', assinatura });
  r = s.rdos.find((x) => x.id === novo.id);
  assert.equal(r.status, 'finalizado');
  assert.equal(r.assinaturas.cliente.tipo, 'ressalva');
  assert.ok(r.hashFinal);

  // 8. integridade e trilha de auditoria
  assert.equal(hashOf(conteudoTecnico(r)), r.hashTecnico);
  const eventos = r.auditoria.map((a) => a.evento);
  for (const e of ['criacao', 'submissao', 'sincronizacao', 'analise_iniciada', 'devolucao', 'correcao_reenvio', 'validacao', 'envio_cliente', 'ressalva_cliente', 'finalizacao']) {
    assert.ok(eventos.includes(e), `auditoria sem ${e}`);
  }

  // retificação: preserva a versão original e o hash dela
  s = A.retificarRdo(s, { rdoId: novo.id, userId: master.id, motivo: 'Local da Foto 02 corrigido.' });
  const orig = s.rdos.find((x) => x.id === novo.id);
  const v2 = s.rdos.find((x) => x.retificaDe === novo.id);
  assert.equal(orig.status, 'retificado');
  assert.equal(orig.retificadoPor, v2.id);
  assert.equal(hashOf(conteudoTecnico(orig)), orig.hashTecnico, 'original permanece íntegro');
  assert.equal(v2.versao, 2);
  assert.equal(v2.numero, orig.numero);
  assert.equal(v2.status, 'rascunho');
});

test('Cliente: esclarecimento mantém o RDO em aberto até o master responder', () => {
  let s = gerarSeed();
  const master = s.users.find((u) => u.id === 'u_master');
  const roberto = s.users.find((u) => u.id === 'u_roberto');
  const b8 = s.rdos.find((r) => r.obraId === 'obra_beta' && r.numero === 8);
  assert.equal(b8.esclarecimentoPendente, true);
  s = A.comentarRdo(s, { rdoId: b8.id, userId: master.id, texto: 'Traço 1:2:3, fck 30 MPa.' });
  const r = s.rdos.find((x) => x.id === b8.id);
  assert.equal(r.esclarecimentoPendente, false);
  assert.equal(r.comentarios.at(-1).visibilidade, 'cliente');
  assert.ok(s.notifications.some((n) => n.usuarioId === roberto.id && /respondido/i.test(n.titulo)));
});

test('Acesso por perfil e por obra', () => {
  const s = gerarSeed();
  const alfa = s.obras[0];
  const beta = s.obras[1];
  const joao = s.users.find((u) => u.id === 'u_joao');
  const fernanda = s.users.find((u) => u.id === 'u_fernanda');
  const master = s.users.find((u) => u.id === 'u_master');
  const a7 = s.rdos.find((r) => r.obraId === alfa.id && r.numero === 7); // submetido
  const a6 = s.rdos.find((r) => r.obraId === alfa.id && r.numero === 6); // enviado ao cliente
  const b1 = s.rdos.find((r) => r.obraId === beta.id && r.numero === 1);
  assert.equal(podeVerRdo(a7, master, alfa), true);
  assert.equal(podeVerRdo(a7, joao, alfa), true);
  assert.equal(podeVerRdo(b1, joao, beta), false, 'operacional só vê obras atribuídas');
  assert.equal(podeVerRdo(a7, fernanda, alfa), false, 'cliente não vê RDO não liberado');
  assert.equal(podeVerRdo(a6, fernanda, alfa), true);
  assert.equal(podeVerRdo(b1, fernanda, beta), false, 'cliente não vê obra de terceiros');
  assert.ok(!acoesDisponiveis(a6, fernanda, alfa).some((a) => ['editar', 'excluir', 'cancelar'].includes(a.key)), 'cliente não edita nem exclui');
});

test('Exclusão física só para não assinados; assinados usam cancelamento lógico', () => {
  let s = gerarSeed();
  const master = s.users.find((u) => u.id === 'u_master');
  const finalizado = s.rdos.find((r) => r.status === 'finalizado');
  const rascunho = s.rdos.find((r) => r.status === 'rascunho');
  const semMotivo = A.excluirRdo(s, { rdoId: rascunho.id, userId: master.id, motivo: '' });
  assert.equal(semMotivo.rdos.length, s.rdos.length);
  assert.equal(A.excluirRdo(s, { rdoId: finalizado.id, userId: master.id, motivo: 'x' }).rdos.length, s.rdos.length);
  s = A.excluirRdo(s, { rdoId: rascunho.id, userId: master.id, motivo: 'Criado por engano' });
  assert.equal(s.rdos.some((r) => r.id === rascunho.id), false);
  assert.match(s.auditoriaGlobal[0].detalhe, /Criado por engano/);
  s = A.cancelarRdo(s, { rdoId: finalizado.id, userId: master.id, motivo: 'Obra paralisada' });
  const c = s.rdos.find((r) => r.id === finalizado.id);
  assert.equal(c.status, 'cancelado');
  assert.equal(c.cancelamento.motivo, 'Obra paralisada');
});

test('Edição pelo master exige justificativa e registra antes/depois', () => {
  let s = gerarSeed();
  const master = s.users.find((u) => u.id === 'u_master');
  const a7 = s.rdos.find((r) => r.obraId === 'obra_alfa' && r.numero === 7);
  const novo = { ...a7, clima: { ...a7.clima, precipitacaoMm: '6' } };
  const sem = A.editarComoMaster(s, { rdoId: a7.id, userId: master.id, novo, justificativa: '', alteracoes: [{ caminho: 'x', antes: '4', depois: '6' }] });
  assert.equal(sem.rdos.find((r) => r.id === a7.id).clima.precipitacaoMm, '4');
  s = A.editarComoMaster(s, { rdoId: a7.id, userId: master.id, novo, justificativa: 'Pluviômetro indicou 6 mm.', alteracoes: [{ caminho: 'Clima › precipitação', antes: '4', depois: '6' }] });
  const r = s.rdos.find((x) => x.id === a7.id);
  assert.equal(r.clima.precipitacaoMm, '6');
  assert.equal(r.auditoria.at(-1).evento, 'edicao_master');
  assert.equal(r.auditoria.at(-1).meta.alteracoes[0].antes, '4');
});

test('Lembretes: não duplicam e respeitam prazos (master 24 h, cliente 24/48 h)', () => {
  let s = gerarSeed();
  const antes = s.notifications.length;
  s = A.processarLembretes(s, {});
  const depois1 = s.notifications.length;
  s = A.processarLembretes(s, {});
  assert.equal(s.notifications.length, depois1, 'segunda execução não gera duplicatas');
  assert.ok(depois1 >= antes);
  const futuro = new Date(Date.now() + 60 * 3600 * 1000).toISOString();
  const novas = calcularLembretes(s, futuro);
  assert.ok(novas.length > 0, 'gera novos lembretes/escalonamento adiante no tempo');
});

test('Falha de entrega simulada gera aviso ao master e permite reenvio', () => {
  let s = gerarSeed();
  const master = s.users.find((u) => u.id === 'u_master');
  const b7 = s.rdos.find((r) => r.obraId === 'obra_beta' && r.numero === 7); // validado, não enviado
  s = A.atualizarConfiguracoes(s, { patch: { simularFalhaEmail: true } });
  s = A.enviarAoCliente(s, { rdoId: b7.id, userId: master.id, canais: ['app', 'email'] });
  const falha = s.notifications.find((n) => n.tipo === 'falha_entrega' && n.rdoId === b7.id);
  assert.ok(falha, 'notificação de falha');
  assert.equal(s.settings.simularFalhaEmail, false, 'simulação é de uso único');
  s = A.reenviarEntrega(s, { notificacaoId: falha.id, userId: master.id });
  assert.ok(s.notifications.find((n) => n.id === falha.id).entregas.every((e) => e.status !== 'falha'));
});
