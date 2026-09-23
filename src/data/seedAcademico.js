// Módulo acadêmico (RF-20, opcional): entregas dos grupos, critérios, notas, comentários e versões.
// Fases = entregáveis esperados dos alunos (seção 16); critérios = declaração final (seção 22).

import { addHours } from '../utils/date.js';

export const CRITERIOS_PADRAO = [
  { id: 'c1', nome: 'Aderência ao fluxo de obra', peso: 20 },
  { id: 'c2', nome: 'Consistência dos dados', peso: 20 },
  { id: 'c3', nome: 'Segurança e controle de acesso', peso: 15 },
  { id: 'c4', nome: 'Rastreabilidade e auditoria', peso: 15 },
  { id: 'c5', nome: 'Funcionamento em condições reais', peso: 15 },
  { id: 'c6', nome: 'Clareza da documentação', peso: 15 },
];

export const FASES_ACADEMICAS = [
  { id: 1, titulo: 'Levantamento e validação de requisitos', conteudo: 'Documento revisado, perguntas ao solicitante, escopo e premissas.' },
  { id: 2, titulo: 'Mapa de jornada e fluxos', conteudo: 'Fluxos dos três perfis e estados do RDO.' },
  { id: 3, titulo: 'Modelo de dados', conteudo: 'Entidades, relacionamentos, dicionário e regras.' },
  { id: 4, titulo: 'Protótipo de baixa fidelidade', conteudo: 'Navegação e estrutura das telas.' },
  { id: 5, titulo: 'Protótipo de alta fidelidade', conteudo: 'Interface mobile clicável e identidade visual.' },
  { id: 6, titulo: 'MVP funcional', conteudo: 'Autenticação, obras, RDO, fotos, submissão, validação e visualização do cliente.' },
  { id: 7, titulo: 'Assinatura e notificações', conteudo: 'Fluxo rastreável, ao menos push/e-mail simulado ou integrado.' },
  { id: 8, titulo: 'Relatórios e exportação', conteudo: 'PDF do RDO e painel básico.' },
  { id: 9, titulo: 'Testes', conteudo: 'Plano, casos, evidências, usabilidade e correções.' },
  { id: 10, titulo: 'Documentação e apresentação', conteudo: 'Manual, arquitetura, implantação, demonstração e limitações.' },
];

const GRUPOS = [
  { id: 'g1', nome: 'Grupo 1 — Canteiro Digital', integrantes: ['Beatriz Lima', 'Caio Mendes', 'Larissa Prado'], avaliadas: 5, entregue: 6 },
  { id: 'g2', nome: 'Grupo 2 — Diário Vivo', integrantes: ['Davi Rocha', 'Helena Sá', 'Otávio Brito'], avaliadas: 3, entregue: 4 },
  { id: 'g3', nome: 'Grupo 3 — ObraLog', integrantes: ['Marina Duarte', 'Pedro Alcântara'], avaliadas: 2, entregue: 0 },
  { id: 'g4', nome: 'Grupo 4 — RDO Fácil', integrantes: ['Júlia Freitas', 'Rafael Nunes', 'Thiago Pires'], avaliadas: 1, entregue: 2 },
];

export function gerarAcademico(agoraISO) {
  const grupos = GRUPOS.map((g, gi) => ({
    id: g.id,
    nome: g.nome,
    integrantes: g.integrantes,
    entregas: FASES_ACADEMICAS.map((f) => {
      const avaliada = f.id <= g.avaliadas;
      const entregue = f.id === g.entregue;
      if (!avaliada && !entregue) return { faseId: f.id, status: 'pendente', versoes: [], notas: {}, comentario: '', avaliadoEm: null };
      const baseNota = 6.5 + ((gi * 7 + f.id * 3) % 30) / 10;
      const notas = avaliada
        ? Object.fromEntries(CRITERIOS_PADRAO.map((c, ci) => [c.id, Math.min(10, Math.round((baseNota + ((ci * 5 + f.id) % 9) / 10) * 10) / 10)]))
        : {};
      const versoes = [
        { numero: 1, data: addHours(agoraISO, -24 * (30 - f.id * 2)), arquivo: `fase${f.id}_${g.id}_v1.pdf`, comentario: avaliada && f.id % 2 === 0 ? 'Primeira entrega.' : '' },
      ];
      if (avaliada && f.id % 2 === 0) versoes.push({ numero: 2, data: addHours(agoraISO, -24 * (28 - f.id * 2)), arquivo: `fase${f.id}_${g.id}_v2.pdf`, comentario: 'Revisão após comentários do professor.' });
      return {
        faseId: f.id,
        status: avaliada ? 'avaliada' : 'em_avaliacao',
        versoes,
        notas,
        comentario: avaliada ? 'Boa aderência ao fluxo do canteiro. Detalhar melhor as regras de validação e o tratamento de exceções.' : '',
        avaliadoEm: avaliada ? addHours(agoraISO, -24 * (26 - f.id * 2)) : null,
      };
    }),
  }));
  return { criterios: CRITERIOS_PADRAO, fases: FASES_ACADEMICAS, grupos };
}

// Nota final ponderada (0–10) a partir das notas por critério.
export function notaFinal(notas, criterios = CRITERIOS_PADRAO) {
  const soma = criterios.reduce((s, c) => s + c.peso, 0);
  if (!soma) return null;
  const preenchidos = criterios.filter((c) => typeof notas?.[c.id] === 'number');
  if (!preenchidos.length) return null;
  const total = preenchidos.reduce((s, c) => s + notas[c.id] * c.peso, 0);
  const pesoUsado = preenchidos.reduce((s, c) => s + c.peso, 0);
  return Math.round((total / pesoUsado) * 10) / 10;
}
