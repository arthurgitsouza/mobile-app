// Textos jurídicos e modelos de mensagem. Os textos de declaração devem ser validados
// pelo solicitante antes do uso real (premissa 7 da seção 20 do documento-base).

export const TERMOS_USO = [
  {
    titulo: '1. Finalidade do aplicativo',
    texto:
      'O RDO Mobile registra, de forma cronológica e rastreável, as condições e os fatos relevantes da execução de obras: serviços, recursos, clima, ocorrências, fotos, pendências e manifestações dos responsáveis. O aplicativo organiza a informação; a força documental do registro depende da qualidade dos dados, da integridade das assinaturas e das regras do contrato.',
  },
  {
    titulo: '2. Perfis e responsabilidades',
    texto:
      'Cada usuário atua conforme seu perfil (Master, Operacional ou Cliente) e nas obras que lhe foram atribuídas. Quem preenche, quem valida e quem acompanha possuem permissões próprias e não podem se sobrepor. Credenciais são pessoais e intransferíveis.',
  },
  {
    titulo: '3. Assinaturas e integridade',
    texto:
      'Após a assinatura, o conteúdo do RDO fica bloqueado. Correções geram retificação vinculada, preservando a versão original, o motivo e a trilha de auditoria. A assinatura desenhada na tela é apenas uma representação visual; a validade decorre da sessão autenticada, do segundo fator e das evidências registradas (data/hora, versão, IP e dispositivo).',
  },
  {
    titulo: '4. Uso adequado',
    texto:
      'Registre fatos objetivos, no mesmo dia, com evidências. É vedado inserir informação sabidamente falsa, compartilhar credenciais ou tentar burlar as regras de validação e auditoria.',
  },
];

export const POLITICA_PRIVACIDADE = [
  {
    titulo: 'Dados tratados',
    texto:
      'Nome, e-mail, telefone, perfil, obras vinculadas, registros de atividade, fotografias, assinaturas e dados de auditoria (data/hora, IP e identificador do dispositivo). Localização é coletada somente se você autorizar, foto a foto.',
  },
  {
    titulo: 'Finalidade e base legal',
    texto:
      'Execução do contrato de obra, cumprimento de obrigações e exercício regular de direitos. A base legal específica deve ser definida pelo controlador (empresa contratante), conforme a LGPD (Lei 13.709/2018).',
  },
  {
    titulo: 'Minimização e fotos',
    texto:
      'Evite fotografar pessoas identificáveis sem necessidade. Fotos são armazenadas com legenda, autoria e data/hora; a compressão aplicada é registrada e o arquivo original é preservado quando necessário.',
  },
  {
    titulo: 'Direitos do titular',
    texto:
      'Você pode solicitar confirmação de tratamento, acesso, correção, portabilidade e informações sobre compartilhamento, pelo encarregado de dados da empresa. Registros assinados são mantidos pelo prazo contratual/legal.',
  },
];

export const DECLARACAO_OPERACIONAL =
  'Declaro, sob minha responsabilidade, que as informações registradas neste RDO são verdadeiras, foram apuradas no dia indicado e refletem os fatos ocorridos na obra.';

export const declaracaoMaster = (rdoNum, versao) =>
  `Declaro que revisei o conteúdo integral do RDO ${rdoNum} (versão ${versao}), que o valido tecnicamente e o chancelo como registro fiel da execução na data indicada. Estou ciente de que, após esta assinatura, o conteúdo será bloqueado e qualquer correção gerará retificação vinculada, com preservação do histórico.`;

export const declaracaoCliente = (tipo, rdoNum, versao) => {
  const base = `Declaro ter recebido e tomado ciência do conteúdo integral do RDO ${rdoNum} (versão ${versao}), conforme exibido neste aplicativo.`;
  if (tipo === 'ressalva') {
    return `${base} Registro a ressalva descrita abaixo, que integrará o PDF final. Esta assinatura representa ciência/aceite do registro, sem prejuízo da ressalva.`;
  }
  if (tipo === 'esclarecimento') {
    return `${base} Solicito esclarecimento sobre o ponto descrito abaixo antes de manifestar minha ciência/aceite.`;
  }
  return `${base} Esta assinatura representa ciência/aceite do registro, nos termos do texto exibido, não implicando por si só aprovação de medições, prazos ou valores contratuais.`;
};

export const AVISO_ASSINATURA_DESENHADA =
  'O desenho é apenas a representação visual da assinatura. A validade do ato decorre da sessão autenticada, do segundo fator e das evidências registradas (identidade, data/hora, versão, IP, dispositivo e hash do conteúdo).';

export const AVISO_TEXTO_DECLARACAO =
  'Texto de declaração de exemplo — deve ser validado pelo solicitante (premissa 7, seção 20 do documento-base).';

export const RESSALVA_EXEMPLOS = [
  'Quantitativo informado diverge da medição do cliente.',
  'Solicito confirmação da solução adotada para a interferência registrada.',
  'Fotos não permitem identificar o local exato da execução.',
];

export function emailCliente({ nomeCliente, rdoNum, obra, dataFmt, versao, prazoFmt }) {
  return {
    assunto: `[RDO Mobile] RDO ${rdoNum} — ${obra} aguarda sua ciência/aceite`,
    corpo:
      `Olá, ${nomeCliente}.\n\n` +
      `O RDO ${rdoNum} (versão ${versao}) da obra ${obra}, referente a ${dataFmt}, foi validado e assinado pelo responsável técnico e está disponível para sua ciência/aceite.\n\n` +
      `Prazo sugerido para manifestação: ${prazoFmt}.\n\n` +
      `Acesse com segurança pelo aplicativo RDO Mobile ou pelo link abaixo (requer login):\n` +
      `rdomobile://rdo/${rdoNum.replace(/\D/g, '')}\n\n` +
      `Este é um e-mail automático. Em caso de dúvida, responda pelo próprio aplicativo (comentário ou solicitação de esclarecimento).`,
  };
}
