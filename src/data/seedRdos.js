// Gerador de RDOs de demonstração (sem back-end). Determinístico por obra/número.
// Reproduz o exemplo do documento-base (RDO nº 0007 — Obra Alfa) e cria RDOs em cada estado do fluxo.

import { criarRdoVazio, conteudoTecnico, calcularHoras } from '../domain/rdo.js';
import { combineDateTime, addDays } from '../utils/date.js';
import { hashOf } from '../utils/object.js';
import { declaracaoMaster, declaracaoCliente } from '../constants/texts.js';

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedNumber(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

const fmt = (n, d = 1) => String(Math.round(n * 10 ** d) / 10 ** d).replace('.', ',');

// Assinatura desenhada sintética (traços normalizados em 300×120).
export function assinaturaFake(seed) {
  const rnd = mulberry32(seedNumber(seed));
  const traco = [];
  const n = 2 + Math.floor(rnd() * 2);
  for (let s = 0; s < n; s++) {
    const pts = [];
    const x0 = 30 + s * 70 + rnd() * 20;
    const amp = 18 + rnd() * 26;
    for (let i = 0; i <= 26; i++) {
      const t = i / 26;
      pts.push({
        x: Math.round((x0 + t * (90 + rnd() * 30)) * 10) / 10,
        y: Math.round((62 + Math.sin(t * Math.PI * (2 + s) + rnd()) * amp * (1 - t * 0.4) + (rnd() - 0.5) * 5) * 10) / 10,
      });
    }
    traco.push(pts);
  }
  return { tracos: traco, largura: 300, altura: 120 };
}

// Modelos por obra: efetivo, equipamentos e serviços típicos.
export const MODELOS_OBRA = {
  obra_alfa: {
    equipe: [['Engenheiro', 1], ['Encarregado', 1], ['Pedreiro', 4], ['Servente', 6]],
    equipamentos: [['Betoneira', 1, 7], ['Compactador (sapo)', 1, 4], ['Caminhão basculante', 1, 4]],
    servicos: [
      { nome: 'Alvenaria de vedação', un: 'm²', base: 42, frente: 'Pavimento térreo, eixos B–D', icone: 'wall', pct: 38 },
      { nome: 'Concretagem', un: 'm³', base: 8.5, frente: 'Fundações — sapatas', icone: 'cube-outline', pct: 44 },
      { nome: 'Aterro compactado', un: 'm³', base: 55, frente: 'Área externa', icone: 'excavator', pct: 61 },
    ],
  },
  obra_beta: {
    equipe: [['Engenheiro', 1], ['Encarregado', 1], ['Armador', 5], ['Carpinteiro', 4], ['Servente', 5]],
    equipamentos: [['Bomba de concreto', 1, 5], ['Retroescavadeira', 1, 6], ['Vibrador de imersão', 2, 4]],
    servicos: [
      { nome: 'Armação de aço', un: 'kg', base: 1200, frente: 'Radier — módulo 2', icone: 'wrench', pct: 55 },
      { nome: 'Formas', un: 'm²', base: 160, frente: 'Pilares — eixo 3', icone: 'cube-outline', pct: 48 },
      { nome: 'Concretagem', un: 'm³', base: 32, frente: 'Radier — módulo 1', icone: 'cube-outline', pct: 62 },
    ],
  },
  obra_gama: {
    equipe: [['Técnico em edificações', 1], ['Pedreiro', 3], ['Azulejista', 2], ['Pintor', 2]],
    equipamentos: [['Serra circular', 1, 5], ['Gerador', 1, 6]],
    servicos: [
      { nome: 'Chapisco e reboco', un: 'm²', base: 60, frente: 'Ala leste — consultórios', icone: 'wall', pct: 22 },
      { nome: 'Revestimento cerâmico', un: 'm²', base: 28, frente: 'Sanitários', icone: 'view-grid-outline', pct: 15 },
    ],
  },
};

/**
 * Constrói um RDO completo.
 * spec: { obra, autor, numero, data, status, versao?, retificaDe?, agora, now (Date ms), master, cliente, extra? }
 */
export function construirRdo(spec) {
  const { obra, autor, numero, data, agora, master, clienteUser } = spec;
  const modelo = MODELOS_OBRA[obra.id];
  const rnd = mulberry32(seedNumber(`${obra.id}-${numero}-${spec.seedVersao || spec.versao || 1}`));
  const rdo = criarRdoVazio({ obra, autor, data, turno: 'diurno', numero, versao: spec.versao || 1 });
  const sid = (() => {
    let i = 0;
    return (p) => `${obra.id}_${numero}v${spec.versao || 1}_${p}${++i}`;
  })();
  rdo.id = `rdo_${obra.id.replace('obra_', '')}_${String(numero).padStart(4, '0')}${(spec.versao || 1) > 1 ? `_v${spec.versao}` : ''}`;

  const at = (hhmm, deltaDias = 0) => {
    const t = new Date(combineDateTime(addDays(data, deltaDias), hhmm)).getTime();
    return new Date(Math.min(t, agora - 10 * 60 * 1000)).toISOString();
  };

  // ---- B. Clima ----
  const choveu = rnd() < 0.25;
  rdo.clima.periodos = {
    manha: { condicao: choveu ? 'nublado' : rnd() < 0.5 ? 'ensolarado' : 'parc_nublado', temperatura: String(25 + Math.floor(rnd() * 4)) },
    tarde: { condicao: choveu ? 'chuva_moderada' : rnd() < 0.3 ? 'nublado' : 'ensolarado', temperatura: String(28 + Math.floor(rnd() * 5)) },
    noite: { condicao: '', temperatura: '' },
  };
  if (choveu) {
    const mm = 2 + Math.floor(rnd() * 12);
    rdo.clima.choveu = true;
    rdo.clima.chuvaInicio = '14:10';
    rdo.clima.chuvaFim = mm > 8 ? '15:40' : '14:45';
    rdo.clima.precipitacaoMm = String(mm);
    rdo.clima.impacto = mm > 8 ? 'total' : 'parcial';
    rdo.clima.horasParalisadas = mm > 8 ? '01:30' : '00:35';
  }
  rdo.clima.fonte = 'manual';

  // ---- C. Mão de obra ----
  rdo.maoDeObra = modelo.equipe.map(([funcao, q], i) => ({
    id: sid('mo'),
    empresa: i < 2 ? 'Equipe própria' : 'Empreiteira terceirizada',
    funcao,
    quantidade: String(Math.max(1, q + (i >= 2 && rnd() < 0.3 ? (rnd() < 0.5 ? -1 : 1) : 0))),
    horaInicio: '07:00',
    horaFim: '16:00',
    horas: calcularHoras('07:00', '16:00'),
    observacao: '',
  }));

  // ---- D. Equipamentos ----
  rdo.equipamentos = modelo.equipamentos.map(([tipo, q, prod], i) => {
    const disp = 8;
    const produtivas = Math.max(2, prod + (rnd() < 0.4 ? -1 : 0));
    const paradas = choveu && i === 0 ? 1 : 0;
    return {
      id: sid('eq'),
      tipo,
      identificacao: `${tipo.slice(0, 3).toUpperCase()}-${10 + i}`,
      quantidade: String(q),
      horasDisponiveis: String(disp),
      horasProdutivas: String(produtivas),
      horasParadas: String(paradas),
      motivoParada: paradas ? 'Chuva — serviço externo suspenso' : '',
      operador: i === 0 ? 'Operador da empreiteira' : '',
      condicao: 'operante',
      observacao: '',
    };
  });

  // ---- E. Atividades ----
  rdo.atividades = modelo.servicos.map((s) => ({
    id: sid('at'),
    frente: s.frente,
    servico: s.nome,
    descricao: `Execução de ${s.nome.toLowerCase()} — ${s.frente}.`,
    unidade: s.un,
    quantidadeDia: fmt(s.base * (0.7 + rnd() * 0.6), s.un === 'kg' ? 0 : 1),
    referenciaEAP: `${1 + Math.floor(rnd() * 6)}.${1 + Math.floor(rnd() * 4)}`,
    percentual: String(Math.max(1, s.pct - Math.floor(rnd() * 6))),
    situacao: 'em_andamento',
    observacao: '',
  }));

  // ---- F/G. Materiais e qualidade ----
  rdo.materiais = [
    { id: sid('ma'), movimento: 'utilizado', material: 'Cimento CP-II (saco 50 kg)', unidade: 'saco', quantidade: String(20 + Math.floor(rnd() * 30)), fornecedor: '', notaRomaneio: '', lote: '', localAplicacao: modelo.servicos[0].frente, inspecao: 'aceito', armazenamento: 'Almoxarife — sobre pallets' },
  ];
  if (rnd() < 0.5) {
    rdo.materiais.push({ id: sid('ma'), movimento: 'recebido', material: 'Bloco cerâmico 9×19×19', unidade: 'un', quantidade: '2000', fornecedor: 'Cerâmica Maranhão', notaRomaneio: `NF ${4000 + numero * 13}`, lote: `L${numero}`, localAplicacao: '', inspecao: 'aceito', armazenamento: 'Pátio coberto' });
  }
  rdo.qualidade = [{ id: sid('qa'), tipo: 'inspecao', descricao: 'Verificação de prumo e nível dos serviços do dia.', resultado: 'conforme', documento: '', responsavel: obra.engenheiroRT?.split(' — ')[0] || '', observacao: '' }];

  // ---- H. Segurança ----
  rdo.seguranca = {
    dds: { realizado: true, tema: ['Uso correto de EPI', 'Trabalho em altura', 'Organização e limpeza', 'Riscos elétricos'][numero % 4], participantes: String(rdo.maoDeObra.reduce((s, m) => s + Number(m.quantidade), 0)) },
    epiEpc: { conferidos: true, observacao: '' },
    permissoes: '',
    inspecoes: 'Inspeção de rotina realizada pelo encarregado.',
    semIncidentes: true,
    incidentes: [],
    residuos: 'Entulho destinado à caçamba do canteiro.',
    condicionantes: '',
    providencias: '',
  };

  // ---- I/J. Ocorrências e visitas ----
  if (choveu) {
    rdo.ocorrencias.push({
      id: sid('oc'), codigo: 'OC-001', fato: `Chuva ${rdo.clima.impacto === 'total' ? 'forte' : 'moderada'} — serviços externos suspensos.`, horario: rdo.clima.chuvaInicio,
      local: 'Frentes externas', partes: 'Encarregado', impactoPrazo: true, impactoCusto: false, impactoQualidade: false,
      acaoImediata: 'Proteção de materiais e paralisação temporária.', responsavel: 'Encarregado', prazo: '', observacao: '',
    });
  } else {
    rdo.semRegistro.ocorrencias = true;
  }
  rdo.semRegistro.visitas = true;

  // ---- K. Fotos ----
  const cores = ['blue', 'green', 'peach'];
  rdo.fotos = modelo.servicos.slice(0, 3).map((s, i) => ({
    id: sid('ft'),
    numero: i + 1,
    uri: null,
    cor: cores[i % 3],
    icone: s.icone,
    legenda: `${s.nome} — ${s.frente}`,
    local: s.frente,
    vinculo: { tipo: 'atividade', id: rdo.atividades[i]?.id || null },
    autorId: autor.id,
    dataHora: at(['09:12', '11:40', '15:20'][i]),
    coordenada: null,
    meta: { largura: 1600, altura: 1200, compressao: 80 },
    envio: 'enviada',
  }));

  // ---- L. Pendências e planejamento ----
  rdo.pendencias = [];
  rdo.planejamento = {
    proximoDia: `Dar continuidade a ${modelo.servicos[0].nome.toLowerCase()} e ${modelo.servicos[1].nome.toLowerCase()}.`,
    restricoes: '',
  };
  rdo.semRegistro.pendencias = true;
  rdo.observacoesGerais = '';
  rdo.declaracao = { aceita: true, dataHora: at('17:10') };
  if (obra.exigeAssinaturaOperacional) {
    rdo.assinaturaOperacional = {
      usuarioId: autor.id, nome: autor.nome, dataHora: at('17:12'), ...assinaturaFake(`op-${obra.id}-${numero}`),
    };
  }
  rdo.criadoEm = at('07:15');
  rdo.atualizadoEm = at('17:12');
  rdo.auditoria = [
    { id: sid('au'), dataHora: at('07:15'), evento: 'criacao', usuarioId: autor.id, versao: rdo.versao, detalhe: 'RDO criado a partir do RDO anterior.' },
    { id: sid('au'), dataHora: at('16:40'), evento: 'rascunho_salvo', usuarioId: autor.id, versao: rdo.versao, detalhe: 'Salvamento automático.' },
  ];
  rdo.comentarios = [];

  return rdo;
}

// Aplica o exemplo exato do documento-base (Figura 1 / tabela 8.1) ao RDO informado.
export function aplicarExemploDocumento(rdo, { data }) {
  const id = (p) => `${rdo.id}_${p}`;
  const at = (hhmm) => combineDateTime(data, hhmm);
  rdo.clima = {
    periodos: {
      manha: { condicao: 'nublado', temperatura: '27' },
      tarde: { condicao: 'chuva_moderada', temperatura: '26' },
      noite: { condicao: '', temperatura: '' },
    },
    choveu: true,
    chuvaInicio: '14:10',
    chuvaFim: '14:45',
    precipitacaoMm: '4',
    impacto: 'parcial',
    horasParalisadas: '00:35',
    fonte: 'pluviometro',
    observacao: 'Concretagem externa suspensa por 35 min.',
  };
  rdo.maoDeObra = [
    ['Equipe própria', 'Engenheiro', 1], ['Equipe própria', 'Encarregado', 1],
    ['Empreiteira terceirizada', 'Pedreiro', 4], ['Empreiteira terceirizada', 'Servente', 6],
  ].map(([empresa, funcao, q], i) => ({
    id: id(`mo${i}`), empresa, funcao, quantidade: String(q), horaInicio: '07:00', horaFim: '16:00', horas: '8', observacao: '',
  }));
  rdo.equipamentos = [
    { id: id('eq0'), tipo: 'Betoneira', identificacao: 'BET-01', quantidade: '1', horasDisponiveis: '8', horasProdutivas: '7', horasParadas: '1', motivoParada: 'Chuva e limpeza do equipamento', operador: 'Servente treinado', condicao: 'operante', observacao: '' },
    { id: id('eq1'), tipo: 'Compactador (sapo)', identificacao: 'CPT-02', quantidade: '1', horasDisponiveis: '8', horasProdutivas: '4', horasParadas: '4', motivoParada: 'Solo saturado após a chuva', operador: 'Operador da empreiteira', condicao: 'operante_restricao', observacao: '' },
    { id: id('eq2'), tipo: 'Caminhão basculante', identificacao: 'CAM-05', quantidade: '1', horasDisponiveis: '8', horasProdutivas: '6', horasParadas: '0', motivoParada: '', operador: 'Motorista terceirizado', condicao: 'operante', observacao: '2 viagens de material de aterro.' },
  ];
  rdo.atividades = [
    { id: id('at0'), frente: 'Pavimento térreo, eixos B–D', servico: 'Alvenaria de vedação', descricao: 'Execução de alvenaria de vedação no pavimento térreo, eixos B–D: 42,00 m².', unidade: 'm²', quantidadeDia: '42', referenciaEAP: '3.2', percentual: '38', situacao: 'em_andamento', observacao: '' },
    { id: id('at1'), frente: 'Fundações — sapatas', servico: 'Concretagem', descricao: 'Concretagem de sapatas com bomba; interrompida pela chuva por 35 min.', unidade: 'm³', quantidadeDia: '8,5', referenciaEAP: '2.4', percentual: '44', situacao: 'em_andamento', observacao: 'Concretagem externa suspensa por 35 min.' },
    { id: id('at2'), frente: 'Área externa', servico: 'Aterro compactado', descricao: 'Aterro compactado em camadas de 20 cm.', unidade: 'm³', quantidadeDia: '55', referenciaEAP: '2.1', percentual: '61', situacao: 'em_andamento', observacao: '' },
  ];
  rdo.materiais = [
    { id: id('ma0'), movimento: 'utilizado', material: 'Cimento CP-II (saco 50 kg)', unidade: 'saco', quantidade: '32', fornecedor: '', notaRomaneio: '', lote: '', localAplicacao: 'Sapatas eixo D', inspecao: 'aceito', armazenamento: 'Almoxarife — sobre pallets' },
    { id: id('ma1'), movimento: 'recebido', material: 'Bloco cerâmico 9×19×19', unidade: 'un', quantidade: '2000', fornecedor: 'Cerâmica Maranhão', notaRomaneio: 'NF 4587', lote: 'L-0715', localAplicacao: '', inspecao: 'aceito', armazenamento: 'Pátio coberto' },
  ];
  rdo.qualidade = [{ id: id('qa0'), tipo: 'inspecao', descricao: 'Verificação de prumo e nível da alvenaria nos eixos B–D.', resultado: 'conforme', documento: 'FVS-012', responsavel: 'Encarregado', observacao: '' }];
  rdo.seguranca = {
    dds: { realizado: true, tema: 'Trabalho em altura e uso de EPI', participantes: '12' },
    epiEpc: { conferidos: true, observacao: 'Capacetes, luvas e botas conferidos na entrada.' },
    permissoes: '',
    inspecoes: 'Inspeção de rotina do encarregado.',
    semIncidentes: true,
    incidentes: [],
    residuos: 'Entulho de alvenaria — caçamba nº 3.',
    condicionantes: '',
    providencias: 'Área da interferência hidráulica isolada e sinalizada.',
  };
  rdo.semRegistro = { materiais: false, qualidade: false, ocorrencias: false, visitas: false, pendencias: false };
  rdo.ocorrencias = [
    { id: id('oc0'), codigo: 'OC-001', fato: 'Chuva moderada das 14h10 às 14h45; precipitação registrada: 4 mm; concretagem externa suspensa por 35 min.', horario: '14:10', local: 'Fundações — sapatas', partes: 'Encarregado', impactoPrazo: true, impactoCusto: false, impactoQualidade: false, acaoImediata: 'Proteção do concreto fresco e retomada após a chuva.', responsavel: 'Encarregado', prazo: '', observacao: '' },
    { id: id('oc1'), codigo: 'OC-002', fato: 'Interferência hidráulica não indicada no projeto, identificada às 10h20 no eixo C/4.', horario: '10:20', local: 'Eixo C/4', partes: 'Encarregado e Engenharia', impactoPrazo: true, impactoCusto: true, impactoQualidade: false, acaoImediata: 'Área isolada; solicitada orientação ao projetista.', responsavel: 'Eng. Carlos Lima', prazo: addDays(data, 1), observacao: '' },
  ];
  rdo.visitas = [
    { id: id('vi0'), visitante: 'Fernanda Albuquerque', empresaCargo: 'Grupo Horizonte — Gerente de Projetos', entrada: '09:30', saida: '10:15', motivo: 'Vistoria da alvenaria do térreo', orientacao: 'Solicitou registro fotográfico dos eixos B–D antes do chapisco.', atendidoPor: 'Encarregado' },
  ];
  rdo.fotos = [
    { id: id('ft0'), numero: 1, uri: null, cor: 'blue', icone: 'wall', legenda: 'Alvenaria concluída nos eixos B–D', local: 'Pavimento térreo, eixos B–D', vinculo: { tipo: 'atividade', id: id('at0') }, autorId: rdo.autorId, dataHora: at('09:12'), coordenada: null, meta: { largura: 1600, altura: 1200, compressao: 80 }, envio: 'enviada' },
    { id: id('ft1'), numero: 2, uri: null, cor: 'green', icone: 'cube-outline', legenda: 'Concretagem das sapatas com bomba', local: 'Obra', vinculo: { tipo: 'atividade', id: id('at1') }, autorId: rdo.autorId, dataHora: at('11:40'), coordenada: null, meta: { largura: 1600, altura: 1200, compressao: 80 }, envio: 'enviada' },
    { id: id('ft2'), numero: 3, uri: null, cor: 'peach', icone: 'pipe', legenda: 'Tubulação encontrada no eixo C/4 antes da execução', local: 'Eixo C/4', vinculo: { tipo: 'ocorrencia', id: id('oc1') }, autorId: rdo.autorId, dataHora: at('10:24'), coordenada: null, meta: { largura: 1600, altura: 1200, compressao: 80 }, envio: 'enviada' },
  ];
  rdo.pendencias = [
    { id: id('pe0'), descricao: 'Projetista deverá confirmar solução para a interferência hidráulica no eixo C/4.', origem: 'projeto', responsavel: 'Coordenação de Projetos', prazo: addDays(data, 1), prazoHora: '12:00', criticidade: 'alta', status: 'aberta' },
  ];
  rdo.planejamento = {
    proximoDia: 'Prosseguir alvenaria eixos D–F e concretagem das sapatas restantes; aguardar solução do eixo C/4.',
    restricoes: 'Definição do projetista para a interferência hidráulica.',
  };
  return rdo;
}

// Finaliza estados do fluxo (assinaturas, hashes, auditoria) conforme o status desejado.
export function aplicarFluxo(rdo, { status, agora, autor, master, clienteUser, ressalva, horasDesdeSubmissao, horasDesdeEnvio, devolucao, esclarecimento }) {
  const data = rdo.data;
  const at = (hhmm, delta = 0) => {
    const t = new Date(combineDateTime(addDays(data, delta), hhmm)).getTime();
    return new Date(Math.min(t, agora - 10 * 60 * 1000)).toISOString();
  };
  const ago = (h) => new Date(agora - h * 3600 * 1000).toISOString();
  const aud = (evento, usuarioId, dataHora, detalhe = '') => rdo.auditoria.push({ id: `${rdo.id}_au${rdo.auditoria.length + 1}`, dataHora, evento, usuarioId, versao: rdo.versao, detalhe });
  const ipSim = '187.115.42.x (simulado)';

  rdo.status = status;
  if (status === 'rascunho') return rdo;

  rdo.submetidoEm = horasDesdeSubmissao != null ? ago(horasDesdeSubmissao) : at('17:20');
  rdo.declaracao.dataHora = rdo.submetidoEm;
  aud('submissao', autor.id, rdo.submetidoEm, 'Todas as validações obrigatórias atendidas.');
  if (status === 'submetido') return rdo;

  if (status === 'em_analise') {
    aud('analise_iniciada', master.id, ago(1));
    return rdo;
  }

  if (status === 'devolvido') {
    aud('analise_iniciada', master.id, ago(4));
    rdo.devolucao = { ...devolucao, por: master.id, em: ago(3) };
    aud('devolucao', master.id, rdo.devolucao.em, devolucao.motivo);
    rdo.comentarios.push({
      id: `${rdo.id}_cm1`, autorId: master.id, papel: 'master', tipo: 'devolucao', contexto: 'fotos', texto: devolucao.motivo, dataHora: rdo.devolucao.em, visibilidade: 'interno',
    });
    return rdo;
  }

  // A partir daqui o RDO foi validado pelo master (conteúdo bloqueado).
  const tValidacao = horasDesdeEnvio != null ? ago(horasDesdeEnvio + 0.1) : at('10:30', 1);
  rdo.hashTecnico = hashOf(conteudoTecnico(rdo));
  rdo.assinaturas.master = {
    usuarioId: master.id, nome: master.nome, papel: 'master', dataHora: tValidacao, versao: rdo.versao,
    ip: ipSim, dispositivo: 'Android 15 • Expo Go', metodo2fa: 'otp', declaracao: declaracaoMaster(`nº ${String(rdo.numero).padStart(4, '0')}`, rdo.versao),
    hash: rdo.hashTecnico, ...assinaturaFake(`master-${rdo.id}`),
  };
  aud('analise_iniciada', master.id, new Date(new Date(tValidacao).getTime() - 20 * 60000).toISOString());
  aud('validacao', master.id, tValidacao, `Hash técnico ${rdo.hashTecnico.slice(0, 12)}…`);
  if (status === 'validado') return rdo;

  rdo.liberadoAoClienteEm = horasDesdeEnvio != null ? ago(horasDesdeEnvio) : new Date(new Date(tValidacao).getTime() + 60000).toISOString();
  aud('envio_cliente', master.id, rdo.liberadoAoClienteEm, 'Canais: app e e-mail.');
  if (status === 'enviado_cliente') {
    if (esclarecimento) {
      rdo.esclarecimentoPendente = true;
      const tc = ago(esclarecimento.horasAtras);
      rdo.comentarios.push({ id: `${rdo.id}_cm1`, autorId: clienteUser.id, papel: 'cliente', tipo: 'esclarecimento', contexto: 'atividades', texto: esclarecimento.texto, dataHora: tc, visibilidade: 'cliente' });
      aud('esclarecimento_cliente', clienteUser.id, tc, esclarecimento.texto);
    }
    return rdo;
  }

  // finalizado / retificado / cancelado a partir de um RDO finalizado
  const tCliente = new Date(new Date(rdo.liberadoAoClienteEm).getTime() + 26 * 3600 * 1000);
  const tc = new Date(Math.min(tCliente.getTime(), agora - 15 * 60 * 1000)).toISOString();
  const tipo = ressalva ? 'ressalva' : 'ciencia';
  rdo.assinaturas.cliente = {
    usuarioId: clienteUser.id, nome: clienteUser.nome, papel: 'cliente', dataHora: tc, versao: rdo.versao, tipo,
    texto: ressalva || '', ip: '200.140.18.x (simulado)', dispositivo: 'iOS 18 • Expo Go', metodo2fa: 'otp',
    declaracao: declaracaoCliente(tipo, `nº ${String(rdo.numero).padStart(4, '0')}`, rdo.versao), hash: rdo.hashTecnico, ...assinaturaFake(`cliente-${rdo.id}`),
  };
  aud(ressalva ? 'ressalva_cliente' : 'ciencia_cliente', clienteUser.id, tc, ressalva || 'Ciente, sem ressalvas.');
  rdo.finalizadoEm = tc;
  rdo.hashFinal = hashOf({ tecnico: rdo.hashTecnico, master: rdo.assinaturas.master.dataHora, cliente: rdo.assinaturas.cliente.dataHora, tipo, texto: ressalva || '' });
  aud('finalizacao', 'sistema', tc, `PDF gerado. Hash final ${rdo.hashFinal.slice(0, 12)}…`);
  rdo.status = 'finalizado';
  if (status === 'retificado') rdo.status = 'retificado';
  if (status === 'cancelado') rdo.status = 'cancelado';
  return rdo;
}

