// Bases exportáveis (RF-18): esquema estável, uma linha por fato, pronto para Excel/Power BI.
import { STATUS } from '../constants/index.js';
import { paraCsv } from '../utils/csv.js';
import { toNumber } from '../utils/format.js';
import { formatDate, formatDateTime, nomeDiaSemana } from '../utils/date.js';
import { resumoEquipamentos, totalHomemHora, totalTrabalhadores } from './rdo.js';

const vigentes = (rdos) => rdos.filter((r) => ![STATUS.CANCELADO, STATUS.RETIFICADO].includes(r.status));

export function csvRdos(rdos, obras, users) {
  const obra = (r) => obras.find((o) => o.id === r.obraId);
  const nome = (id) => users.find((u) => u.id === id)?.nome || '';
  return paraCsv(vigentes(rdos), [
    { titulo: 'Obra', chave: (r) => obra(r)?.nome },
    { titulo: 'Contrato', chave: (r) => obra(r)?.contrato },
    { titulo: 'RDO nº', chave: (r) => r.numero },
    { titulo: 'Versão', chave: (r) => r.versao },
    { titulo: 'Data', chave: (r) => formatDate(r.data) },
    { titulo: 'Dia da semana', chave: (r) => nomeDiaSemana(r.data) },
    { titulo: 'Turno', chave: (r) => r.turno },
    { titulo: 'Situação', chave: (r) => r.status },
    { titulo: 'Autor', chave: (r) => nome(r.autorId) },
    { titulo: 'Efetivo', chave: (r) => totalTrabalhadores(r) },
    { titulo: 'Homem-hora', chave: (r) => totalHomemHora(r) },
    { titulo: 'Equipamentos (un)', chave: (r) => resumoEquipamentos(r).unidades },
    { titulo: 'Horas produtivas equip.', chave: (r) => resumoEquipamentos(r).horasProdutivas },
    { titulo: 'Horas paradas equip.', chave: (r) => resumoEquipamentos(r).horasParadas },
    { titulo: 'Choveu', chave: (r) => (r.clima.choveu ? 'sim' : 'não') },
    { titulo: 'Precipitação (mm)', chave: (r) => toNumber(r.clima.precipitacaoMm) },
    { titulo: 'Horas paralisadas', chave: (r) => r.clima.horasParalisadas },
    { titulo: 'Atividades', chave: (r) => r.atividades.length },
    { titulo: 'Ocorrências', chave: (r) => r.ocorrencias.length },
    { titulo: 'Fotos', chave: (r) => r.fotos.length },
    { titulo: 'Pendências abertas', chave: (r) => r.pendencias.filter((p) => p.status !== 'resolvida').length },
    { titulo: 'Enviado em', chave: (r) => (r.submetidoEm ? formatDateTime(r.submetidoEm) : '') },
    { titulo: 'Validado em', chave: (r) => (r.assinaturas?.master ? formatDateTime(r.assinaturas.master.dataHora) : '') },
    { titulo: 'Ciência do cliente em', chave: (r) => (r.assinaturas?.cliente ? formatDateTime(r.assinaturas.cliente.dataHora) : '') },
    { titulo: 'Tipo de ciência', chave: (r) => r.assinaturas?.cliente?.tipo || '' },
    { titulo: 'Hash SHA-256', chave: (r) => r.hashFinal || r.hashTecnico || '' },
  ]);
}

export function csvAtividades(rdos, obras) {
  const linhas = vigentes(rdos).flatMap((r) => r.atividades.map((a) => ({ r, a })));
  return paraCsv(linhas, [
    { titulo: 'Obra', chave: ({ r }) => obras.find((o) => o.id === r.obraId)?.nome },
    { titulo: 'RDO nº', chave: ({ r }) => r.numero },
    { titulo: 'Data', chave: ({ r }) => formatDate(r.data) },
    { titulo: 'Frente/local', chave: ({ a }) => a.frente },
    { titulo: 'Serviço', chave: ({ a }) => a.servico },
    { titulo: 'Unidade', chave: ({ a }) => a.unidade },
    { titulo: 'Quantidade do dia', chave: ({ a }) => toNumber(a.quantidadeDia) },
    { titulo: 'Referência EAP', chave: ({ a }) => a.referenciaEAP },
    { titulo: '% do serviço', chave: ({ a }) => toNumber(a.percentual) },
    { titulo: 'Situação', chave: ({ a }) => a.situacao },
  ]);
}

export function csvMaoDeObra(rdos, obras) {
  const linhas = vigentes(rdos).flatMap((r) => r.maoDeObra.map((m) => ({ r, m })));
  return paraCsv(linhas, [
    { titulo: 'Obra', chave: ({ r }) => obras.find((o) => o.id === r.obraId)?.nome },
    { titulo: 'RDO nº', chave: ({ r }) => r.numero },
    { titulo: 'Data', chave: ({ r }) => formatDate(r.data) },
    { titulo: 'Empresa/equipe', chave: ({ m }) => m.empresa },
    { titulo: 'Função', chave: ({ m }) => m.funcao },
    { titulo: 'Quantidade', chave: ({ m }) => toNumber(m.quantidade) },
    { titulo: 'Horas por trabalhador', chave: ({ m }) => toNumber(m.horas) },
    { titulo: 'Homem-hora', chave: ({ m }) => toNumber(m.quantidade) * toNumber(m.horas) },
  ]);
}
