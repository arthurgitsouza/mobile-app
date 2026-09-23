// Dados de demonstração do protótipo (sem back-end). Todas as datas são relativas a "agora"
// para que o calendário e os prazos façam sentido em qualquer dia de teste.

import { CATALOGOS_PADRAO } from '../constants/index.js';
import { addDays, diaDaSemana, hojeObra, combineDateTime, addHours } from '../utils/date.js';
import { pad4 } from '../utils/format.js';
import { criarNotificacao } from '../domain/notificacoes.js';
import { chaveMaster, chaveCliente } from '../domain/lembretes.js';
import { construirRdo, aplicarExemploDocumento, aplicarFluxo } from './seedRdos.js';
import { gerarAcademico } from './seedAcademico.js';

export const SCHEMA_VERSION = 5;

function diasUteisAnteriores(hoje, n) {
  const out = [];
  let d = addDays(hoje, -1);
  while (out.length < n) {
    if (diaDaSemana(d) !== 0) out.unshift(d);
    d = addDays(d, -1);
  }
  return out;
}

export function configuracoesPadrao() {
  return {
    forceOffline: false,
    simularFalhaEmail: false,
    inatividadeMin: 0,
    lembretes: { operacionalFimDia: '18:00', masterHoras: 24, clienteHoras: [24, 48], escalonamentoHoras: 72 },
  };
}

export function gerarSeed(agoraISO = new Date().toISOString()) {
  const agora = new Date(agoraISO).getTime();
  const hoje = hojeObra(agoraISO);
  const criado = addHours(agoraISO, -24 * 40);
  const canais = { push: true, email: true, whatsapp: false };

  const empresa = {
    id: 'emp_planengen',
    nome: 'PLANENGEN Consultoria e Construção LTDA',
    cnpj: '00.000.000/0001-00',
    cidade: 'São Luís/MA',
    email: 'contato@planengen.com.br',
    telefone: '(98) 3200-0000',
    responsavel: 'Eng. Carlos Lima',
  };

  const clientes = [
    { id: 'cli_horizonte', nome: 'Grupo Horizonte Empreendimentos', contato: 'Fernanda Albuquerque', email: 'cliente@horizonte.com.br', telefone: '(98) 98800-1001' },
    { id: 'cli_pontadaareia', nome: 'Logística Ponta da Areia S.A.', contato: 'Roberto Campos', email: 'roberto@pontadaareia.com.br', telefone: '(98) 98800-1002' },
    { id: 'cli_saudeviva', nome: 'Consórcio Saúde Viva', contato: 'Paula Nogueira', email: 'paula@saudeviva.org.br', telefone: '(98) 98800-1003' },
  ];

  const users = [
    { id: 'u_master', nome: 'Eng. Carlos Lima', email: 'master@planengen.com.br', senha: '123456', perfil: 'master', cargo: 'Engenheiro Civil — RT', telefone: '(98) 98800-0001', ativo: true, canais: { ...canais, whatsapp: true }, criadoEm: criado },
    { id: 'u_joao', nome: 'João Ribeiro', email: 'operacional@planengen.com.br', senha: '123456', perfil: 'operacional', cargo: 'Mestre de obras', telefone: '(98) 98800-0002', ativo: true, canais, criadoEm: criado },
    { id: 'u_marcos', nome: 'Marcos Vinícius', email: 'marcos@planengen.com.br', senha: '123456', perfil: 'operacional', cargo: 'Técnico em edificações', telefone: '(98) 98800-0003', ativo: true, canais, criadoEm: criado },
    { id: 'u_ana', nome: 'Ana Beatriz Costa', email: 'ana@planengen.com.br', senha: '123456', perfil: 'operacional', cargo: 'Estagiária de Engenharia', telefone: '(98) 98800-0004', ativo: true, canais, criadoEm: criado },
    { id: 'u_fernanda', nome: 'Fernanda Albuquerque', email: 'cliente@horizonte.com.br', senha: '123456', perfil: 'cliente', cargo: 'Gerente de Projetos', telefone: '(98) 98800-1001', clienteId: 'cli_horizonte', ativo: true, canais, criadoEm: criado },
    { id: 'u_roberto', nome: 'Roberto Campos', email: 'roberto@pontadaareia.com.br', senha: '123456', perfil: 'cliente', cargo: 'Diretor de Operações', telefone: '(98) 98800-1002', clienteId: 'cli_pontadaareia', ativo: true, canais, criadoEm: criado },
    { id: 'u_paula', nome: 'Paula Nogueira', email: 'paula@saudeviva.org.br', senha: '123456', perfil: 'cliente', cargo: 'Coordenadora de Obras', telefone: '(98) 98800-1003', clienteId: 'cli_saudeviva', ativo: true, canais, criadoEm: criado },
  ];
  const U = Object.fromEntries(users.map((u) => [u.id, u]));
  const RT = 'Eng. Carlos Lima — CREA 123456789-0 MA';
  // Datas de RDO por obra: o registro digital começa no primeiro RDO (`inicioRegistro`), que é diferente do início do contrato.
  const dA = diasUteisAnteriores(hoje, 9);
  const dB = diasUteisAnteriores(hoje, 7);
  const dG = diasUteisAnteriores(hoje, 3);

  const obras = [
    {
      id: 'obra_alfa', nome: 'Obra Alfa', descricao: 'Residencial Alfa — Bloco A', contrato: 'CT-014', os: 'OS 021/2026',
      clienteId: 'cli_horizonte', clienteNome: clientes[0].nome, empresaExecutora: empresa.nome,
      endereco: 'Av. dos Holandeses, s/n — Calhau, São Luís/MA', inicio: addDays(hoje, -75), inicioRegistro: dA[0], fim: addDays(hoje, 290),
      engenheiroRTId: 'u_master', engenheiroRT: RT, diasUteis: [1, 2, 3, 4, 5, 6], exigeAssinaturaOperacional: true,
      status: 'ativa', avancoFisico: 38, avancoPrevisto: 41, usuarioIds: ['u_joao', 'u_fernanda'],
    },
    {
      id: 'obra_beta', nome: 'Obra Beta', descricao: 'Galpão Logístico Beta', contrato: 'CT-019', os: 'OS 034/2026',
      clienteId: 'cli_pontadaareia', clienteNome: clientes[1].nome, empresaExecutora: empresa.nome,
      endereco: 'Rod. BR-135, km 12 — Distrito Industrial, São Luís/MA', inicio: addDays(hoje, -50), inicioRegistro: dB[0], fim: addDays(hoje, 160),
      engenheiroRTId: 'u_master', engenheiroRT: RT, diasUteis: [1, 2, 3, 4, 5, 6], exigeAssinaturaOperacional: false,
      status: 'ativa', avancoFisico: 61, avancoPrevisto: 55, usuarioIds: ['u_marcos', 'u_ana', 'u_roberto'],
    },
    {
      id: 'obra_gama', nome: 'Obra Gama', descricao: 'Reforma da UBS Gama', contrato: 'CT-023', os: 'OS 047/2026',
      clienteId: 'cli_saudeviva', clienteNome: clientes[2].nome, empresaExecutora: empresa.nome,
      endereco: 'Rua Grande, 350 — Centro, São Luís/MA', inicio: dG[0], inicioRegistro: dG[0], fim: addDays(hoje, 105),
      engenheiroRTId: 'u_master', engenheiroRT: RT, diasUteis: [1, 2, 3, 4, 5, 6], exigeAssinaturaOperacional: false,
      status: 'ativa', avancoFisico: 12, avancoPrevisto: 15, usuarioIds: ['u_marcos', 'u_paula'],
    },
  ];
  const O = Object.fromEntries(obras.map((o) => [o.id, o]));
  const master = U.u_master;

  const rdos = [];
  const novo = (obra, autor, cliente, numero, data, status, opts = {}) => {
    const rdo = construirRdo({ obra, autor, numero, data, agora, master, clienteUser: cliente, versao: opts.versao, seedVersao: opts.seedVersao });
    if (opts.exemplo) aplicarExemploDocumento(rdo, { data });
    if (opts.editar) opts.editar(rdo);
    aplicarFluxo(rdo, { status, agora, autor, master, clienteUser: cliente, ...(opts.fluxo || {}) });
    rdos.push(rdo);
    return rdo;
  };

  // ---------------- Obra Alfa (João / Fernanda) ----------------
  const alfa = O.obra_alfa;
  [1, 2, 3, 4].forEach((n) => novo(alfa, U.u_joao, U.u_fernanda, n, dA[n - 1], 'finalizado'));
  novo(alfa, U.u_joao, U.u_fernanda, 5, dA[4], 'finalizado', {
    fluxo: { ressalva: 'Quantitativo de aterro informado diverge da medição do cliente; solicito conferência.' },
  });
  novo(alfa, U.u_joao, U.u_fernanda, 6, dA[5], 'enviado_cliente', { fluxo: { horasDesdeEnvio: 31 } });
  novo(alfa, U.u_joao, U.u_fernanda, 7, dA[6], 'submetido', { exemplo: true, fluxo: { horasDesdeSubmissao: 27 } });
  const alfa8 = novo(alfa, U.u_joao, U.u_fernanda, 8, dA[7], 'devolvido', {
    editar: (r) => { r.fotos[2].local = 'Obra'; },
    fluxo: { devolucao: { motivo: 'Foto 03 sem local preciso: informe o eixo/pavimento onde a foto foi tirada e reenvie.', prazo: combineDateTime(hoje, '18:00') } },
  });
  novo(alfa, U.u_joao, U.u_fernanda, 9, dA[8], 'rascunho', {
    editar: (r) => {
      r.atividades = []; r.fotos = []; r.materiais = []; r.qualidade = []; r.equipamentos = r.equipamentos.slice(0, 1);
      r.declaracao = { aceita: false, dataHora: null }; r.assinaturaOperacional = null;
      r.semRegistro = { materiais: false, qualidade: false, ocorrencias: false, visitas: false, pendencias: false };
      r.ocorrencias = []; r.seguranca.semIncidentes = false; r.planejamento = { proximoDia: '', restricoes: '' };
    },
  });

  // ---------------- Obra Beta (Marcos, Ana / Roberto) ----------------
  const beta = O.obra_beta;
  const rob = U.u_roberto;
  novo(beta, U.u_marcos, rob, 1, dB[0], 'finalizado');
  novo(beta, U.u_marcos, rob, 2, dB[1], 'finalizado');
  const beta3v1 = novo(beta, U.u_marcos, rob, 3, dB[2], 'retificado');
  const beta3v2 = novo(beta, U.u_marcos, rob, 3, dB[2], 'finalizado', {
    versao: 2, seedVersao: 1,
    editar: (r) => {
      r.atividades[0].quantidadeDia = '1180';
      r.retificaDe = beta3v1.id;
      r.motivoRetificacao = 'Correção do quantitativo de armação de aço (kg) informado inicialmente.';
      r.auditoria.unshift({ id: `${r.id}_au0`, dataHora: addHours(agoraISO, -24 * 3), evento: 'retificacao', usuarioId: master.id, versao: 2, detalhe: `Retificação da versão 1. Motivo: ${r.motivoRetificacao}` });
    },
  });
  beta3v1.retificadoPor = beta3v2.id;
  beta3v1.auditoria.push({ id: `${beta3v1.id}_ret`, dataHora: addHours(agoraISO, -24 * 3), evento: 'retificacao', usuarioId: master.id, versao: 1, detalhe: `Substituído pela versão 2. Motivo: ${beta3v2.motivoRetificacao}` });
  novo(beta, U.u_marcos, rob, 4, dB[3], 'finalizado');
  novo(beta, U.u_marcos, rob, 5, dB[4], 'finalizado');
  const beta6 = novo(beta, U.u_ana, rob, 6, dB[4], 'submetido', { fluxo: { horasDesdeSubmissao: 60 } });
  beta6.status = 'cancelado';
  beta6.cancelamento = { motivo: 'Registro duplicado: RDO do mesmo dia e turno lançado por engano.', por: master.id, em: addHours(agoraISO, -50) };
  beta6.auditoria.push({ id: `${beta6.id}_can`, dataHora: beta6.cancelamento.em, evento: 'cancelamento', usuarioId: master.id, versao: 1, detalhe: beta6.cancelamento.motivo });
  novo(beta, U.u_marcos, rob, 7, dB[5], 'validado', { fluxo: { horasDesdeEnvio: 20 } });
  novo(beta, U.u_ana, rob, 8, dB[6], 'enviado_cliente', {
    fluxo: { horasDesdeEnvio: 9, esclarecimento: { horasAtras: 5, texto: 'Qual foi o traço do concreto utilizado na concretagem do módulo 1?' } },
  });

  // ---------------- Obra Gama (Marcos / Paula) ----------------
  const gama = O.obra_gama;
  [1, 2, 3].forEach((n) => novo(gama, U.u_marcos, U.u_paula, n, dG[n - 1], 'finalizado'));

  // ---------------- Notificações ----------------
  const notificacoes = [];
  const nt = (uid, tipo, titulo, mensagem, rdo, { horas = 1, lida = false, prazo = null, falhaEmail = false, chave = null, alvoId = null } = {}) => {
    const dataHora = addHours(agoraISO, -horas);
    const obra = O[rdo.obraId];
    notificacoes.push(criarNotificacao({
      usuario: U[uid], tipo, titulo, mensagem, obraId: obra.id, rdoId: rdo.id, rdoStatus: rdo.status, prazo, dataHora, lida, simularFalhaEmail: falhaEmail, chave, alvoId,
    }));
  };
  const rd = (obraId, n, v = 1) => rdos.find((r) => r.obraId === obraId && r.numero === n && r.versao === v);
  const a7 = rd('obra_alfa', 7);
  const a6 = rd('obra_alfa', 6);
  const a5 = rd('obra_alfa', 5);
  const b8 = rd('obra_beta', 8);

  nt('u_master', 'rdo_submetido', 'RDO pronto para análise', `RDO nº ${pad4(7)} da obra Obra Alfa está pronto para análise.`, a7, { horas: 27, prazo: addHours(a7.submetidoEm, 24) });
  nt('u_master', 'lembrete', 'Lembrete: análise pendente há mais de 24 h', `RDO nº ${pad4(7)} (Obra Alfa) aguarda análise há 27 h. O prazo sugerido era 24 h.`, a7, { horas: 3, prazo: addHours(a7.submetidoEm, 24), chave: chaveMaster(a7.id, 24) });
  nt('u_master', 'esclarecimento', 'Cliente solicitou esclarecimento', `Roberto Campos pediu esclarecimento no RDO nº ${pad4(8)} (Obra Beta): "Qual foi o traço do concreto…"`, b8, { horas: 5 });
  nt('u_master', 'falha_entrega', 'Falha de entrega de e-mail', `Não foi possível entregar o e-mail do RDO nº ${pad4(8)} (Obra Beta) a Roberto Campos. Push entregue. Você pode reenviar.`, b8, { horas: 8.5, falhaEmail: true, alvoId: 'u_roberto' });
  nt('u_master', 'cliente_manifestou', 'Cliente registrou ressalva', `Fernanda Albuquerque registrou ciência com ressalva no RDO nº ${pad4(5)} (Obra Alfa). PDF final disponível.`, a5, { horas: 24 * 4, lida: true });
  nt('u_joao', 'rdo_devolvido', 'RDO devolvido para correção', `RDO nº ${pad4(8)} (Obra Alfa) foi devolvido. Motivo: ${alfa8.devolucao.motivo}`, alfa8, { horas: 3, prazo: alfa8.devolucao.prazo });
  nt('u_joao', 'cliente_manifestou', 'Cliente registrou ressalva', `Fernanda Albuquerque registrou ciência com ressalva no RDO nº ${pad4(5)}. PDF final disponível.`, a5, { horas: 24 * 4, lida: true });
  nt('u_fernanda', 'rdo_validado', 'RDO aguarda sua ciência/aceite', `RDO nº ${pad4(6)} da obra Obra Alfa foi validado e aguarda sua ciência/aceite.`, a6, { horas: 31, prazo: addHours(a6.liberadoAoClienteEm, 24) });
  nt('u_fernanda', 'lembrete', 'Lembrete: RDO aguardando ciência', `RDO nº ${pad4(6)} (Obra Alfa) aguarda sua ciência/aceite há 31 h.`, a6, { horas: 7, prazo: addHours(a6.liberadoAoClienteEm, 24), chave: chaveCliente(a6.id, 24) });
  nt('u_fernanda', 'cliente_manifestou', 'RDO finalizado', `RDO nº ${pad4(5)} (Obra Alfa) foi finalizado com a sua ressalva. PDF final disponível.`, a5, { horas: 24 * 4, lida: true });
  nt('u_roberto', 'rdo_validado', 'RDO aguarda sua ciência/aceite', `RDO nº ${pad4(8)} da obra Obra Beta foi validado e aguarda sua ciência/aceite.`, b8, { horas: 9, lida: true });
  nt('u_roberto', 'esclarecimento', 'Esclarecimento em análise', `Sua solicitação sobre o RDO nº ${pad4(8)} foi enviada ao responsável técnico.`, b8, { horas: 5, lida: true });

  const auditoriaGlobal = [
    { id: 'ag1', dataHora: addHours(agoraISO, -24 * 40), evento: 'obra', usuarioId: 'u_master', detalhe: 'Obra Alfa cadastrada (CT-014).' },
    { id: 'ag2', dataHora: addHours(agoraISO, -24 * 40), evento: 'usuario', usuarioId: 'u_master', detalhe: 'Usuário João Ribeiro vinculado à Obra Alfa.' },
    { id: 'ag3', dataHora: addHours(agoraISO, -24 * 40), evento: 'usuario', usuarioId: 'u_master', detalhe: 'Cliente Fernanda Albuquerque vinculada à Obra Alfa.' },
    { id: 'ag4', dataHora: addHours(agoraISO, -24 * 26), evento: 'obra', usuarioId: 'u_master', detalhe: 'Obra Beta cadastrada (CT-019).' },
    { id: 'ag5', dataHora: addHours(agoraISO, -24 * 13), evento: 'obra', usuarioId: 'u_master', detalhe: 'Obra Gama cadastrada (CT-023).' },
  ];

  return {
    schemaVersion: SCHEMA_VERSION,
    geradoEm: agoraISO,
    empresa,
    clientes,
    users,
    obras,
    rdos,
    notifications: notificacoes,
    auditoriaGlobal,
    files: [],
    catalogos: JSON.parse(JSON.stringify(CATALOGOS_PADRAO)),
    settings: configuracoesPadrao(),
    academico: gerarAcademico(agoraISO),
  };
}
