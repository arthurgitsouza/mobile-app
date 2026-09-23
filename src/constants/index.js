// Constantes do domínio RDO (documento-base UNDB / PLANENGEN).

export const PERFIL = { MASTER: 'master', OPERACIONAL: 'operacional', CLIENTE: 'cliente' };

export const PERFIS = {
  master: {
    key: 'master',
    label: 'Master',
    longo: 'Usuário Master',
    descricao: 'Proprietário / engenheiro responsável',
    icone: 'shield-account-outline',
  },
  operacional: {
    key: 'operacional',
    label: 'Operacional',
    longo: 'Usuário Operacional',
    descricao: 'Alimentador do RDO no canteiro',
    icone: 'hard-hat',
  },
  cliente: {
    key: 'cliente',
    label: 'Cliente',
    longo: 'Usuário Cliente',
    descricao: 'Acompanhamento e ciência/aceite',
    icone: 'account-tie-outline',
  },
};

export const STATUS = {
  RASCUNHO: 'rascunho',
  SUBMETIDO: 'submetido',
  EM_ANALISE: 'em_analise',
  DEVOLVIDO: 'devolvido',
  VALIDADO: 'validado',
  ENVIADO_CLIENTE: 'enviado_cliente',
  FINALIZADO: 'finalizado',
  RETIFICADO: 'retificado',
  CANCELADO: 'cancelado',
};

// Ordem de exibição em filtros.
export const STATUS_ORDEM = [
  'rascunho',
  'submetido',
  'em_analise',
  'devolvido',
  'validado',
  'enviado_cliente',
  'finalizado',
  'retificado',
  'cancelado',
];

// Etapas do fluxo (seção 5) para a linha do tempo do RDO.
export const ETAPAS_FLUXO = [
  { key: 'rascunho', label: 'Rascunho' },
  { key: 'submetido', label: 'Submetido' },
  { key: 'em_analise', label: 'Em análise' },
  { key: 'validado', label: 'Validado' },
  { key: 'enviado_cliente', label: 'Enviado ao cliente' },
  { key: 'ciencia', label: 'Ciência/aceite' },
  { key: 'finalizado', label: 'Finalizado' },
];

// Passos do formulário por etapas (grupos A–M da seção 7).
export const PASSOS_RDO = [
  { key: 'identificacao', letras: 'A', titulo: 'Identificação', curto: 'Identif.', icone: 'card-account-details-outline', ajuda: 'Confira os dados que identificam o registro. Data e turno definem a unicidade do RDO na obra.' },
  { key: 'clima', letras: 'B', titulo: 'Condições climáticas', curto: 'Clima', icone: 'weather-partly-rainy', ajuda: 'Registre o tempo por período e, se choveu, o impacto mensurável no serviço.' },
  { key: 'maoDeObra', letras: 'C', titulo: 'Mão de obra', curto: 'Equipe', icone: 'account-group-outline', ajuda: 'Informe o efetivo por função. O total é calculado automaticamente para evitar dupla contagem.' },
  { key: 'equipamentos', letras: 'D', titulo: 'Equipamentos', curto: 'Equip.', icone: 'excavator', ajuda: 'Registre horas produtivas e paradas. Equipamento parado exige motivo e duração.' },
  { key: 'atividades', letras: 'E', titulo: 'Atividades executadas', curto: 'Atividades', icone: 'hammer-wrench', ajuda: 'Descreva serviço, local, unidade e quantidade do dia. Sem produção? Justifique.' },
  { key: 'materiaisQualidade', letras: 'F·G', titulo: 'Materiais e qualidade', curto: 'Materiais', icone: 'package-variant-closed', ajuda: 'Materiais recebidos/utilizados, inspeções, ensaios e não conformidades.' },
  { key: 'seguranca', letras: 'H', titulo: 'Segurança e meio ambiente', curto: 'Segurança', icone: 'shield-check-outline', ajuda: 'DDS, EPI/EPC, incidentes, resíduos e providências.' },
  { key: 'ocorrencias', letras: 'I·J', titulo: 'Ocorrências e visitas', curto: 'Ocorrências', icone: 'alert-octagon-outline', ajuda: 'Fatos relevantes, interferências, visitas e orientações recebidas.' },
  { key: 'fotos', letras: 'K', titulo: 'Registro fotográfico', curto: 'Fotos', icone: 'camera-outline', ajuda: 'Toda foto exige legenda. Vincule à atividade ou ocorrência para virar evidência.' },
  { key: 'pendencias', letras: 'L', titulo: 'Pendências e planejamento', curto: 'Pendências', icone: 'clipboard-list-outline', ajuda: 'Cada pendência precisa de responsável, prazo e criticidade.' },
  { key: 'revisao', letras: 'M', titulo: 'Revisão e envio', curto: 'Revisão', icone: 'clipboard-check-outline', ajuda: 'Confira as validações, aceite a declaração e envie ao master.' },
];

export const TURNOS = [
  { value: 'diurno', label: 'Diurno', icone: 'weather-sunny' },
  { value: 'noturno', label: 'Noturno', icone: 'weather-night' },
  { value: 'misto', label: 'Misto', icone: 'theme-light-dark' },
];

export const CONDICOES_TEMPO = [
  { value: 'ensolarado', label: 'Ensolarado', icone: 'weather-sunny' },
  { value: 'parc_nublado', label: 'Parc. nublado', icone: 'weather-partly-cloudy' },
  { value: 'nublado', label: 'Nublado', icone: 'weather-cloudy' },
  { value: 'chuva_fraca', label: 'Chuva fraca', icone: 'weather-rainy' },
  { value: 'chuva_moderada', label: 'Chuva moderada', icone: 'weather-pouring' },
  { value: 'chuva_forte', label: 'Chuva forte', icone: 'weather-lightning-rainy' },
  { value: 'ventania', label: 'Ventania', icone: 'weather-windy' },
  { value: 'neblina', label: 'Neblina', icone: 'weather-fog' },
];

export const PERIODOS_CLIMA = [
  { key: 'manha', label: 'Manhã', icone: 'weather-sunset-up' },
  { key: 'tarde', label: 'Tarde', icone: 'weather-sunny' },
  { key: 'noite', label: 'Noite', icone: 'weather-night' },
];

export const IMPACTOS_CLIMA = [
  { value: 'nenhum', label: 'Sem impacto' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'total', label: 'Paralisação total' },
];

export const FONTES_CLIMA = [
  { value: 'manual', label: 'Observação manual' },
  { value: 'pluviometro', label: 'Pluviômetro da obra' },
  { value: 'integracao', label: 'Integração meteorológica', disabled: true, nota: 'em breve' },
];

export const CONDICOES_EQUIPAMENTO = [
  { value: 'operante', label: 'Operante' },
  { value: 'operante_restricao', label: 'Com restrição' },
  { value: 'manutencao', label: 'Em manutenção' },
  { value: 'parado', label: 'Parado' },
];

export const SITUACOES_ATIVIDADE = [
  { value: 'nao_iniciada', label: 'Não iniciada' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluida', label: 'Concluída' },
  { value: 'paralisada', label: 'Paralisada' },
];

export const MOVIMENTO_MATERIAL = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'utilizado', label: 'Utilizado' },
];

export const INSPECAO_MATERIAL = [
  { value: 'aceito', label: 'Aceito' },
  { value: 'aceito_ressalva', label: 'Aceito c/ ressalva' },
  { value: 'recusado', label: 'Recusado' },
  { value: 'pendente', label: 'Pendente' },
];

export const TIPOS_QUALIDADE = [
  { value: 'inspecao', label: 'Inspeção' },
  { value: 'ensaio', label: 'Ensaio' },
  { value: 'nao_conformidade', label: 'Não conformidade' },
  { value: 'liberacao', label: 'Liberação' },
];

export const RESULTADOS_QUALIDADE = [
  { value: 'conforme', label: 'Conforme' },
  { value: 'nao_conforme', label: 'Não conforme' },
  { value: 'pendente', label: 'Pendente' },
];

export const TIPOS_INCIDENTE = [
  { value: 'quase_acidente', label: 'Quase acidente' },
  { value: 'acidente_sem_afastamento', label: 'Acidente sem afastamento' },
  { value: 'acidente_com_afastamento', label: 'Acidente com afastamento' },
  { value: 'incidente_ambiental', label: 'Incidente ambiental' },
  { value: 'outro', label: 'Outro' },
];

export const ORIGENS_PENDENCIA = [
  { value: 'projeto', label: 'Projeto' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'fornecedor', label: 'Fornecedor' },
  { value: 'execucao', label: 'Execução' },
  { value: 'qualidade', label: 'Qualidade' },
  { value: 'seguranca', label: 'Segurança' },
  { value: 'outros', label: 'Outros' },
];

export const CRITICIDADES = [
  { value: 'baixa', label: 'Baixa' },
  { value: 'media', label: 'Média' },
  { value: 'alta', label: 'Alta' },
  { value: 'critica', label: 'Crítica' },
];

export const STATUS_PENDENCIA = [
  { value: 'aberta', label: 'Aberta' },
  { value: 'andamento', label: 'Em andamento' },
  { value: 'resolvida', label: 'Resolvida' },
];

export const CONTEXTOS_COMENTARIO = [
  { value: 'geral', label: 'Geral' },
  ...PASSOS_RDO.filter((p) => p.key !== 'revisao').map((p) => ({ value: p.key, label: p.titulo })),
];

export const TIPOS_CIENCIA = {
  ciencia: { label: 'Ciente, sem ressalvas', curto: 'Ciência/aceite', cor: 'success', icone: 'check-decagram-outline' },
  ressalva: { label: 'Ciente, com ressalva', curto: 'Aceite com ressalva', cor: 'warning', icone: 'alert-decagram-outline' },
  esclarecimento: { label: 'Solicitar esclarecimento', curto: 'Esclarecimento solicitado', cor: 'info', icone: 'help-circle-outline' },
};

export const EVENTOS_AUDITORIA = {
  criacao: { label: 'RDO criado', icone: 'file-plus-outline' },
  rascunho_salvo: { label: 'Rascunho salvo', icone: 'content-save-outline' },
  submissao: { label: 'Enviado ao master', icone: 'send-outline' },
  sincronizacao: { label: 'Sincronizado com o servidor', icone: 'cloud-check-outline' },
  visualizacao: { label: 'Visualizado', icone: 'eye-outline' },
  analise_iniciada: { label: 'Análise iniciada', icone: 'magnify' },
  comentario: { label: 'Comentário registrado', icone: 'comment-text-outline' },
  devolucao: { label: 'Devolvido para correção', icone: 'undo-variant' },
  correcao_reenvio: { label: 'Corrigido e reenviado', icone: 'send-check-outline' },
  edicao_master: { label: 'Editado pelo master (com justificativa)', icone: 'pencil-lock-outline' },
  validacao: { label: 'Validado e assinado pelo master', icone: 'check-decagram-outline' },
  envio_cliente: { label: 'Enviado ao cliente', icone: 'account-arrow-right-outline' },
  ciencia_cliente: { label: 'Ciência/aceite do cliente', icone: 'check-decagram-outline' },
  ressalva_cliente: { label: 'Ciência com ressalva do cliente', icone: 'alert-decagram-outline' },
  esclarecimento_cliente: { label: 'Esclarecimento solicitado pelo cliente', icone: 'help-circle-outline' },
  esclarecimento_respondido: { label: 'Esclarecimento respondido', icone: 'message-reply-text-outline' },
  finalizacao: { label: 'RDO finalizado — PDF gerado', icone: 'file-pdf-box' },
  pdf_gerado: { label: 'PDF gerado/compartilhado', icone: 'file-pdf-box' },
  retificacao: { label: 'Retificação aberta', icone: 'file-restore-outline' },
  cancelamento: { label: 'RDO cancelado', icone: 'file-cancel-outline' },
  exclusao: { label: 'RDO excluído (exceção)', icone: 'delete-forever-outline' },
  exportacao: { label: 'Exportação de dados', icone: 'table-arrow-right' },
  usuario: { label: 'Usuário/cadastro alterado', icone: 'account-cog-outline' },
  obra: { label: 'Obra cadastrada/alterada', icone: 'office-building-cog-outline' },
  sessao: { label: 'Sessão', icone: 'login-variant' },
};

// Eventos visíveis ao perfil Cliente na consulta de histórico (seção 4).
export const EVENTOS_PUBLICOS = [
  'validacao',
  'envio_cliente',
  'ciencia_cliente',
  'ressalva_cliente',
  'esclarecimento_cliente',
  'esclarecimento_respondido',
  'finalizacao',
  'retificacao',
];

// Matriz de permissões por perfil (seção 4). 'sim' | 'nao' | 'restrito'
export const MATRIZ_PERMISSOES = [
  { grupo: 'Acesso', itens: [
    { label: 'Acessar todas as obras e RDOs', master: 'sim', operacional: 'restrito', cliente: 'restrito', nota: 'Operacional: obras atribuídas. Cliente: apenas suas obras e RDOs liberados.' },
    { label: 'Cadastrar usuários, obras e clientes', master: 'sim', operacional: 'nao', cliente: 'nao' },
    { label: 'Acompanhar indicadores e avaliações acadêmicas', master: 'sim', operacional: 'nao', cliente: 'nao' },
  ] },
  { grupo: 'Preenchimento', itens: [
    { label: 'Criar e preencher RDO', master: 'nao', operacional: 'sim', cliente: 'nao' },
    { label: 'Salvar rascunho e enviar ao master', master: 'nao', operacional: 'sim', cliente: 'nao' },
    { label: 'Responder a devoluções', master: 'nao', operacional: 'sim', cliente: 'nao' },
  ] },
  { grupo: 'Análise e assinatura', itens: [
    { label: 'Ler e comentar', master: 'sim', operacional: 'sim', cliente: 'restrito', nota: 'Cliente comenta apenas RDOs liberados.' },
    { label: 'Devolver ao operacional (com motivo)', master: 'sim', operacional: 'nao', cliente: 'nao' },
    { label: 'Editar com justificativa', master: 'sim', operacional: 'nao', cliente: 'nao' },
    { label: 'Validar, chancelar e assinar', master: 'sim', operacional: 'nao', cliente: 'nao' },
    { label: 'Ciência/aceite, ressalva ou esclarecimento', master: 'nao', operacional: 'nao', cliente: 'sim' },
  ] },
  { grupo: 'Documentos', itens: [
    { label: 'Baixar PDF e consultar histórico', master: 'sim', operacional: 'sim', cliente: 'sim' },
    { label: 'Exportar dados (CSV/planilha)', master: 'sim', operacional: 'nao', cliente: 'nao' },
    { label: 'Cancelar / retificar RDO assinado', master: 'sim', operacional: 'nao', cliente: 'nao' },
    { label: 'Excluir definitivamente (exceção, não assinados)', master: 'sim', operacional: 'nao', cliente: 'nao' },
  ] },
];

// Catálogos padrão (biblioteca de cadastros). Editáveis pelo master em Cadastros.
export const CATALOGOS_PADRAO = {
  funcoes: [
    'Engenheiro', 'Mestre de obras', 'Encarregado', 'Técnico em edificações', 'Técnico de segurança', 'Almoxarife',
    'Pedreiro', 'Servente', 'Carpinteiro', 'Armador', 'Eletricista', 'Encanador', 'Pintor', 'Azulejista',
    'Operador de máquinas', 'Motorista', 'Soldador', 'Ajudante',
  ],
  equipamentos: [
    'Betoneira', 'Compactador (sapo)', 'Placa vibratória', 'Caminhão basculante', 'Caminhão betoneira', 'Retroescavadeira',
    'Escavadeira hidráulica', 'Mini carregadeira', 'Rolo compactador', 'Guincho', 'Vibrador de imersão', 'Bomba de concreto',
    'Serra circular', 'Gerador', 'Martelete',
  ],
  servicos: [
    { nome: 'Locação e marcação', unidade: 'm²' },
    { nome: 'Escavação', unidade: 'm³' },
    { nome: 'Aterro compactado', unidade: 'm³' },
    { nome: 'Armação de aço', unidade: 'kg' },
    { nome: 'Formas', unidade: 'm²' },
    { nome: 'Concretagem', unidade: 'm³' },
    { nome: 'Alvenaria de vedação', unidade: 'm²' },
    { nome: 'Chapisco e reboco', unidade: 'm²' },
    { nome: 'Contrapiso', unidade: 'm²' },
    { nome: 'Revestimento cerâmico', unidade: 'm²' },
    { nome: 'Instalações hidráulicas', unidade: 'm' },
    { nome: 'Instalações elétricas', unidade: 'm' },
    { nome: 'Impermeabilização', unidade: 'm²' },
    { nome: 'Pintura', unidade: 'm²' },
    { nome: 'Cobertura', unidade: 'm²' },
    { nome: 'Limpeza da obra', unidade: 'vb' },
  ],
  materiais: [
    'Cimento CP-II (saco 50 kg)', 'Areia média', 'Brita 1', 'Aço CA-50', 'Bloco cerâmico 9×19×19', 'Concreto usinado fck 30',
    'Tubo PVC 100 mm', 'Argamassa colante', 'Cal hidratada', 'Madeira para formas',
  ],
  unidades: ['m', 'm²', 'm³', 'kg', 't', 'un', 'cj', 'vb', 'h', 'dia', 'l', 'saco', 'viagem'],
  frentes: ['Pavimento térreo', '1º pavimento', '2º pavimento', 'Fundações', 'Área externa', 'Cobertura', 'Canteiro / almoxarifado'],
  origensEmpresa: ['Equipe própria', 'Empreiteira terceirizada', 'Subcontratada'],
};

// Rótulo legível de um valor em uma lista de opções ({ value, label }).
export const rotuloDe = (lista, valor) => lista.find((o) => o.value === valor)?.label ?? (valor || '—');
