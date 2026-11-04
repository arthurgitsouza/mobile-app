-- =====================================================================================
-- RDO Mobile — schema do banco (Supabase / PostgreSQL)
-- Base: docs/modelo-de-dados.md · Permissões: docs/regras-de-negocio.md, seção 2
--
-- Como rodar: Supabase → SQL Editor → cole este arquivo inteiro → Run (uma vez, em banco vazio).
-- Se der erro, corrija e rode de novo (o editor roda o script numa transação, então em geral
-- nada fica criado pela metade).
--
-- Convenções:
--  * Nomes em snake_case. A API converte para camelCase (server/src/mapear.js).
--  * ids são texto: o servidor pode deixar o padrão (uuid em texto) e o seed pode usar
--    ids como 'u_joao' e 'obra_alfa' (docs/exemplos/*.json) sem converter nada.
--  * Objetos que o app trata como um bloco só (clima, identificacao, declaracao…) ficam em
--    colunas jsonb, e DENTRO do jsonb as chaves continuam em camelCase, como a API devolve.
--  * Valores de lista (enum) são texto com CHECK: guardam a chave, nunca o rótulo.
--  * Números são numeric (decisão M1: número JSON com ponto decimal).
--  * O servidor usa a chave service_role (ignora o RLS). O RLS abaixo é a segunda barreira,
--    para quem tentar falar direto com o banco usando o token de um usuário.
-- =====================================================================================

create schema if not exists privado;
grant usage on schema privado to authenticated;

-- Hora no formato HH:MM (0:00 a 23:59), guardada como texto como no app.
create domain hora_hhmm as text check (value ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');

-- ============================== Empresa, clientes, usuários ==========================

create table empresa (
  id          text primary key default gen_random_uuid()::text,
  nome        text not null,
  cnpj        text not null,
  cidade      text,
  email       text,
  telefone    text,
  responsavel text
);

create table clientes (
  id       text primary key default gen_random_uuid()::text,
  nome     text not null,
  contato  text,
  email    text,
  telefone text
);

create table usuarios (
  id             text primary key default gen_random_uuid()::text,
  auth_id        uuid unique references auth.users (id) on delete set null,  -- id no Supabase Auth
  nome           text not null,
  email          text not null unique,
  perfil         text not null check (perfil in ('master', 'operacional', 'cliente')),
  cargo          text,
  telefone       text,
  cliente_id     text references clientes (id),
  ativo          boolean not null default true,        -- false = bloqueado
  canais         jsonb not null default '{"push": true, "email": true, "whatsapp": false}',
  crea           text,                                  -- M8: obrigatório para master (validar na API)
  termos_aceitos jsonb,                                 -- { em, opcoes, versaoTermos }
  criado_em      timestamptz not null default now(),
  constraint usuario_cliente_tem_cliente check (perfil <> 'cliente' or cliente_id is not null)
);

-- ============================== Obras ================================================

create table obras (
  id                           text primary key default gen_random_uuid()::text,
  nome                         text not null,
  descricao                    text,
  contrato                     text not null,
  os                           text,
  cliente_id                   text not null references clientes (id),
  empresa_executora            text,                    -- se vazio, a API usa o nome da empresa
  endereco                     text not null,
  inicio                       date not null,           -- início do contrato
  inicio_registro              date not null,           -- primeiro dia do RDO digital
  fim                          date not null,
  engenheiro_rt_id             text not null references usuarios (id),
  engenheiro_rt                text,                    -- texto "Eng. X — CREA …" (a API pode calcular)
  dias_uteis                   integer[] not null default '{1,2,3,4,5,6}',  -- 0 = domingo … 6 = sábado
  exige_assinatura_operacional boolean not null default false,
  status                       text not null default 'ativa' check (status in ('ativa', 'paralisada', 'concluida')),
  avanco_fisico                numeric check (avanco_fisico between 0 and 100),    -- M9
  avanco_previsto              numeric check (avanco_previsto between 0 and 100),  -- M9
  -- Contador da numeração dos RDOs (RF-04). Use sempre proximo_numero_rdo(); nunca é reaproveitado.
  ultimo_numero_rdo            integer not null default 0
);

create table obra_usuario (
  obra_id    text not null references obras (id) on delete cascade,
  usuario_id text not null references usuarios (id) on delete cascade,
  primary key (obra_id, usuario_id)
);
create index on obra_usuario (usuario_id);

-- ============================== RDO (cabeçalho) ======================================

create table rdos (
  id                       text primary key default gen_random_uuid()::text,
  obra_id                  text not null references obras (id),
  numero                   integer not null,            -- gerado pelo servidor (proximo_numero_rdo)
  versao                   integer not null default 1,  -- sobe a cada retificação
  data                     date not null,               -- não pode ser futura (validar na API, UTC−3)
  turno                    text not null check (turno in ('diurno', 'noturno', 'misto')),
  status                   text not null default 'rascunho' check (status in
                             ('rascunho', 'submetido', 'em_analise', 'devolvido', 'validado',
                              'enviado_cliente', 'finalizado', 'retificado', 'cancelado')),
  autor_id                 text not null references usuarios (id),
  criado_em                timestamptz not null default now(),
  atualizado_em            timestamptz not null default now(),
  id_local                 uuid,                        -- criado offline no app (decisão D3/M3)
  retifica_de              text references rdos (id),
  retificado_por           text references rdos (id),
  motivo_retificacao       text,
  reaproveitado_de         text references rdos (id) on delete set null,
  identificacao            jsonb not null default '{}', -- cópia dos dados da obra (M2): não muda depois
  clima                    jsonb,                       -- bloco B
  observacao_mao_de_obra   text,
  sem_producao             jsonb not null default '{"ativo": false, "justificativa": ""}',
  planejamento             jsonb not null default '{}', -- { proximoDia, restricoes }
  sem_registro             jsonb not null default '{}', -- { materiais, qualidade, ocorrencias, visitas, pendencias }
  seguranca                jsonb,                       -- bloco H, sem a lista de incidentes (tabela incidentes)
  observacoes_gerais       text,
  declaracao               jsonb not null default '{"aceita": false}',  -- { aceita, dataHora }
  submetido_em             timestamptz,                 -- base do prazo de 24 h do master
  devolucao                jsonb,                       -- { motivo, prazo, por, em }
  esclarecimento_pendente  boolean not null default false,
  hash_tecnico             text check (hash_tecnico ~ '^[0-9a-f]{64}$'),
  hash_final               text check (hash_final ~ '^[0-9a-f]{64}$'),
  liberado_ao_cliente_em   timestamptz,
  finalizado_em            timestamptz,
  cancelamento             jsonb,                       -- { motivo, por, em }
  unique (obra_id, numero, versao)
);
create unique index rdos_id_local_unico on rdos (autor_id, id_local) where id_local is not null;
create index on rdos (obra_id, status);
create index on rdos (obra_id, data, turno);   -- aviso de duplicado (M5): índice comum, não único
create index on rdos (hash_final) where hash_final is not null;  -- GET /verificacao/{hash}

-- ============================== RDO (blocos C a L) ===================================

create table mao_de_obra (                      -- bloco C
  id          text primary key default gen_random_uuid()::text,
  rdo_id      text not null references rdos (id) on delete cascade,
  ordem       integer not null default 0,
  empresa     text,
  funcao      text not null,
  quantidade  integer not null check (quantidade >= 1),
  hora_inicio hora_hhmm,
  hora_fim    hora_hhmm,
  horas       numeric not null check (horas > 0 and horas <= 24),
  observacao  text
);

create table equipamentos (                     -- bloco D
  id                text primary key default gen_random_uuid()::text,
  rdo_id            text not null references rdos (id) on delete cascade,
  ordem             integer not null default 0,
  tipo              text not null,
  identificacao     text,
  quantidade        integer not null check (quantidade >= 1),
  horas_disponiveis numeric not null default 0,
  horas_produtivas  numeric not null default 0,
  horas_paradas     numeric not null default 0,
  motivo_parada     text,
  operador          text,
  condicao          text not null check (condicao in ('operante', 'operante_restricao', 'manutencao', 'parado')),
  observacao        text
);

create table atividades (                       -- bloco E
  id             text primary key default gen_random_uuid()::text,
  rdo_id         text not null references rdos (id) on delete cascade,
  ordem          integer not null default 0,
  frente         text,
  servico        text not null,
  descricao      text,
  unidade        text not null,
  quantidade_dia numeric not null,
  referencia_eap text,
  percentual     numeric check (percentual between 0 and 100),
  situacao       text not null check (situacao in ('nao_iniciada', 'em_andamento', 'concluida', 'paralisada')),
  observacao     text
);

create table materiais (                        -- bloco F
  id              text primary key default gen_random_uuid()::text,
  rdo_id          text not null references rdos (id) on delete cascade,
  ordem           integer not null default 0,
  movimento       text not null check (movimento in ('recebido', 'utilizado')),
  material        text not null,
  unidade         text not null,
  quantidade      numeric not null,
  fornecedor      text,
  nota_romaneio   text,
  lote            text,
  local_aplicacao text,
  inspecao        text check (inspecao in ('aceito', 'aceito_ressalva', 'recusado', 'pendente')),
  armazenamento   text
);

create table qualidade (                        -- bloco G
  id          text primary key default gen_random_uuid()::text,
  rdo_id      text not null references rdos (id) on delete cascade,
  ordem       integer not null default 0,
  tipo        text not null check (tipo in ('inspecao', 'ensaio', 'nao_conformidade', 'liberacao')),
  descricao   text not null,
  resultado   text check (resultado in ('conforme', 'nao_conforme', 'pendente')),
  documento   text,
  responsavel text,
  observacao  text
);

create table incidentes (                       -- bloco H (lista de incidentes)
  id         text primary key default gen_random_uuid()::text,
  rdo_id     text not null references rdos (id) on delete cascade,
  ordem      integer not null default 0,
  tipo       text not null check (tipo in ('quase_acidente', 'acidente_sem_afastamento',
                                           'acidente_com_afastamento', 'incidente_ambiental', 'outro')),
  descricao  text not null,
  providencia text
);

create table ocorrencias (                      -- bloco I
  id                 text primary key default gen_random_uuid()::text,
  rdo_id             text not null references rdos (id) on delete cascade,
  codigo             text not null,             -- OC-001… (sequência dentro do RDO)
  fato               text not null,
  horario            hora_hhmm not null,
  local              text,
  partes             text,
  impacto_prazo      boolean not null default false,
  impacto_custo      boolean not null default false,
  impacto_qualidade  boolean not null default false,
  acao_imediata      text,
  responsavel        text,
  prazo              date,
  observacao         text,
  unique (rdo_id, codigo)
);

create table visitas (                          -- bloco J
  id            text primary key default gen_random_uuid()::text,
  rdo_id        text not null references rdos (id) on delete cascade,
  ordem         integer not null default 0,
  visitante     text not null,
  empresa_cargo text,
  entrada       hora_hhmm,
  saida         hora_hhmm,
  motivo        text not null,
  orientacao    text,
  atendido_por  text
);

create table fotos (                            -- bloco K
  id           text primary key default gen_random_uuid()::text,
  rdo_id       text not null references rdos (id) on delete cascade,
  numero       integer not null,              -- ordem no RDO (Foto 01)
  storage_path text,                          -- caminho no bucket fotos-rdo (null = foto de demonstração)
  legenda      text not null default '',      -- a submissão exige legenda (validar na API)
  local        text,
  vinculo_tipo text check (vinculo_tipo in ('atividade', 'ocorrencia')),
  vinculo_id   text,
  autor_id     text not null references usuarios (id),
  data_hora    timestamptz not null default now(),
  latitude     numeric,
  longitude    numeric,
  largura      integer,
  altura       integer,
  compressao   integer
);

create table pendencias (                       -- bloco L
  id          text primary key default gen_random_uuid()::text,
  rdo_id      text not null references rdos (id) on delete cascade,
  ordem       integer not null default 0,
  descricao   text not null,
  origem      text check (origem in ('projeto', 'cliente', 'fornecedor', 'execucao', 'qualidade', 'seguranca', 'outros')),
  responsavel text,
  prazo       date,
  prazo_hora  hora_hhmm,
  criticidade text check (criticidade in ('baixa', 'media', 'alta', 'critica')),
  status      text not null default 'aberta' check (status in ('aberta', 'andamento', 'resolvida'))
);

-- Índice por rdo_id em todas as tabelas filhas
create index on mao_de_obra (rdo_id);
create index on equipamentos (rdo_id);
create index on atividades (rdo_id);
create index on materiais (rdo_id);
create index on qualidade (rdo_id);
create index on incidentes (rdo_id);
create index on ocorrencias (rdo_id);
create index on visitas (rdo_id);
create index on fotos (rdo_id);
create index on pendencias (rdo_id);

-- ============================== Assinaturas, comentários, auditoria ==================

create table assinaturas (                      -- bloco M (operacional, master e cliente)
  id          text primary key default gen_random_uuid()::text,
  rdo_id      text not null references rdos (id) on delete cascade,
  papel       text not null check (papel in ('operacional', 'master', 'cliente')),
  usuario_id  text not null references usuarios (id),
  nome        text not null,
  data_hora   timestamptz not null default now(),   -- hora do servidor
  versao      integer not null,
  tipo        text check (tipo in ('ciencia', 'ressalva')),   -- só do cliente
  texto       text,                                           -- obrigatório na ressalva (validar na API)
  ip          text,
  dispositivo text,
  metodo_2fa  text check (metodo_2fa in ('otp', 'biometria')),
  declaracao  text,                                           -- texto jurídico exato, não só uma chave
  hash        text check (hash ~ '^[0-9a-f]{64}$'),           -- cópia do hash_tecnico
  tracos      jsonb,                                          -- desenho: lista de listas de pontos {x,y}
  largura     integer,
  altura      integer
);
create index on assinaturas (rdo_id);
-- Master e cliente assinam uma vez por versão; a assinatura do operacional pode se repetir após devolução.
create unique index assinaturas_oficial_unica on assinaturas (rdo_id, papel, versao) where papel in ('master', 'cliente');

create table comentarios (
  id            text primary key default gen_random_uuid()::text,
  rdo_id        text not null references rdos (id) on delete cascade,
  autor_id      text not null references usuarios (id),
  papel         text not null check (papel in ('master', 'operacional', 'cliente')),
  tipo          text not null check (tipo in ('comentario', 'resposta', 'devolucao', 'esclarecimento', 'sistema')),
  contexto      text not null default 'geral' check (contexto in ('geral', 'identificacao', 'clima', 'maoDeObra',
                  'equipamentos', 'atividades', 'materiaisQualidade', 'seguranca', 'ocorrencias', 'fotos', 'pendencias')),
  contexto_ref  text,
  texto         text not null,
  data_hora     timestamptz not null default now(),
  visibilidade  text not null default 'interno' check (visibilidade in ('interno', 'cliente'))
);
create index on comentarios (rdo_id);

-- Auditoria do RDO: só inclui, nunca altera nem apaga (trigger abaixo).
-- Sem FK em rdo_id de propósito: o registro precisa sobreviver mesmo se o RDO for excluído.
create table auditoria_rdo (
  id         text primary key default gen_random_uuid()::text,
  rdo_id     text not null,
  data_hora  timestamptz not null default now(),
  evento     text not null check (evento in ('criacao', 'rascunho_salvo', 'submissao', 'sincronizacao',
               'visualizacao', 'analise_iniciada', 'comentario', 'devolucao', 'correcao_reenvio', 'edicao_master',
               'validacao', 'envio_cliente', 'ciencia_cliente', 'ressalva_cliente', 'esclarecimento_cliente',
               'esclarecimento_respondido', 'finalizacao', 'pdf_gerado', 'retificacao', 'cancelamento', 'exclusao',
               'exportacao', 'usuario', 'obra', 'sessao')),
  usuario_id text not null,          -- id do usuário ou 'sistema'
  versao     integer,
  detalhe    text,
  meta       jsonb                   -- em edicao_master: { justificativa, alteracoes[] }
);
create index on auditoria_rdo (rdo_id, data_hora);

create table auditoria_global (        -- eventos que não pertencem a um RDO
  id         text primary key default gen_random_uuid()::text,
  data_hora  timestamptz not null default now(),
  evento     text not null check (evento in ('obra', 'usuario', 'exclusao', 'exportacao')),
  usuario_id text not null,
  detalhe    text
);

-- ============================== Notificações, arquivos, dispositivos =================

create table notificacoes (
  id          text primary key default gen_random_uuid()::text,
  usuario_id  text not null references usuarios (id) on delete cascade,   -- destinatário
  tipo        text not null check (tipo in ('rdo_submetido', 'rdo_devolvido', 'rdo_validado', 'cliente_manifestou',
                'esclarecimento', 'prazo_vencido', 'lembrete', 'falha_entrega', 'sistema')),
  titulo      text not null,
  mensagem    text,
  obra_id     text references obras (id) on delete set null,
  rdo_id      text references rdos (id) on delete set null,
  rdo_status  text,
  prazo       timestamptz,
  data_hora   timestamptz not null default now(),
  lida        boolean not null default false,
  resolvida   boolean,
  chave       text,                  -- evita lembrete duplicado (lem:master:<rdoId>:<horas>…)
  alvo_id     text references usuarios (id) on delete set null,   -- em falha_entrega
  entregas    jsonb not null default '[]'   -- [{ canal, status, em }]
);
create index on notificacoes (usuario_id, lida, data_hora desc);
create unique index notificacoes_chave_unica on notificacoes (usuario_id, chave) where chave is not null;

create table arquivos_exportados (
  id         text primary key default gen_random_uuid()::text,
  criado_em  timestamptz not null default now(),
  criado_por text not null references usuarios (id),
  nome       text not null,
  tipo       text not null,
  descricao  text
);

create table dispositivos (
  device_id     text primary key,
  usuario_id    text not null references usuarios (id) on delete cascade,
  token_push    text,
  plataforma    text,
  atualizado_em timestamptz not null default now()
);

-- Respostas guardadas para o cabeçalho Idempotency-Key (fila offline). Só o servidor usa.
create table idempotencia (
  usuario_id text not null references usuarios (id) on delete cascade,
  chave      text not null,
  status_http integer not null,
  resposta   jsonb,
  criado_em  timestamptz not null default now(),
  primary key (usuario_id, chave)
);

-- ============================== Catálogos, configurações, acadêmico ==================

create table catalogo_item (
  id         text primary key default gen_random_uuid()::text,
  empresa_id text not null references empresa (id) on delete cascade,
  catalogo   text not null check (catalogo in ('funcoes', 'equipamentos', 'servicos', 'materiais',
               'unidades', 'frentes', 'origensEmpresa')),
  valor      text not null,
  ordem      integer not null default 0,
  unique (empresa_id, catalogo, valor)
);

create table configuracoes (            -- M7: por empresa
  empresa_id                      text primary key references empresa (id) on delete cascade,
  lembrete_operacional_fim_dia    hora_hhmm not null default '18:00',
  lembrete_master_horas           numeric not null default 24,
  lembrete_cliente_horas          numeric[] not null default '{24,48}',
  lembrete_escalonamento_horas    numeric not null default 72,
  inatividade_min                 integer not null default 0   -- 0 = desligada
);

create table criterios_academicos (
  id   text primary key,
  nome text not null,
  peso integer not null check (peso >= 0)       -- a soma dos pesos deve ser 100 (validar na API)
);

create table fases_academicas (
  id       integer primary key,
  titulo   text not null,
  conteudo text
);

create table grupos_academicos (
  id          text primary key default gen_random_uuid()::text,
  nome        text not null,
  integrantes text[] not null default '{}'      -- nomes em texto, não são usuários
);

create table entregas_academicas (
  grupo_id    text not null references grupos_academicos (id) on delete cascade,
  fase_id     integer not null references fases_academicas (id),
  status      text not null default 'pendente' check (status in ('pendente', 'em_avaliacao', 'avaliada')),
  notas       jsonb not null default '{}',      -- { criterioId: nota 0–10 }
  nota_final  numeric,
  comentario  text,
  avaliado_em timestamptz,
  primary key (grupo_id, fase_id)
);

create table versoes_entrega (
  id         text primary key default gen_random_uuid()::text,
  grupo_id   text not null,
  fase_id    integer not null,
  numero     integer not null,
  data       date not null default current_date,
  arquivo    text,
  comentario text,
  foreign key (grupo_id, fase_id) references entregas_academicas (grupo_id, fase_id) on delete cascade,
  unique (grupo_id, fase_id, numero)
);

-- ============================== Funções e triggers ===================================

-- Próximo número do RDO da obra (RF-04). O UPDATE trava a linha da obra, então dois RDOs criados
-- ao mesmo tempo nunca recebem o mesmo número. O número gasto não volta (nem se o RDO for cancelado).
-- Uso (API): select proximo_numero_rdo('obra_alfa');
-- Atenção ao seed: depois de inserir os RDOs, rode
--   update obras set ultimo_numero_rdo = coalesce((select max(numero) from rdos where obra_id = obras.id), 0);
create function proximo_numero_rdo(p_obra text) returns integer
language sql as $$
  update obras set ultimo_numero_rdo = ultimo_numero_rdo + 1 where id = p_obra returning ultimo_numero_rdo;
$$;
revoke execute on function proximo_numero_rdo(text) from public, anon, authenticated;
grant execute on function proximo_numero_rdo(text) to service_role;

create function privado.atualizar_data() returns trigger language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end $$;
create trigger rdos_atualizado_em before update on rdos
  for each row execute function privado.atualizar_data();

-- Auditoria é só de inclusão.
create function privado.bloquear_alteracao() returns trigger language plpgsql as $$
begin
  raise exception 'Registros de auditoria não podem ser alterados nem apagados (%).', tg_table_name
    using errcode = '42501';
end $$;
create trigger auditoria_rdo_imutavel before update or delete on auditoria_rdo
  for each row execute function privado.bloquear_alteracao();
create trigger auditoria_global_imutavel before update or delete on auditoria_global
  for each row execute function privado.bloquear_alteracao();

-- Funções de apoio ao RLS. São security definer para consultar `usuarios` sem entrar em loop de políticas.
create function privado.usuario_id() returns text language sql stable security definer set search_path = public as $$
  select id from usuarios where auth_id = auth.uid() and ativo
$$;

create function privado.perfil() returns text language sql stable security definer set search_path = public as $$
  select perfil from usuarios where auth_id = auth.uid() and ativo
$$;

-- Master vê todas as obras; os outros, só as vinculadas (obra_usuario).
create function privado.na_obra(p_obra text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from usuarios u
    where u.auth_id = auth.uid() and u.ativo
      and (u.perfil = 'master'
           or exists (select 1 from obra_usuario ou where ou.obra_id = p_obra and ou.usuario_id = u.id))
  )
$$;

-- O cliente só vê RDO enviado ou finalizado; vê retificado/cancelado se já tinha sido liberado.
create function privado.rdo_liberado(p_status text, p_liberado_em timestamptz) returns boolean
language sql immutable as $$
  select p_status in ('enviado_cliente', 'finalizado')
      or (p_status in ('retificado', 'cancelado') and p_liberado_em is not null)
$$;

create function privado.status_rdo(p_rdo text) returns text language sql stable security definer set search_path = public as $$
  select status from rdos where id = p_rdo
$$;

create function privado.pode_ver_rdo(p_rdo text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rdos r
    where r.id = p_rdo
      and privado.na_obra(r.obra_id)
      and (privado.perfil() <> 'cliente' or privado.rdo_liberado(r.status, r.liberado_ao_cliente_em))
  )
$$;

-- Operacional edita o próprio RDO em rascunho/devolvido; o master edita (com justificativa) em submetido/em_analise.
create function privado.pode_editar_rdo(p_rdo text) returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from rdos r
    where r.id = p_rdo
      and ((privado.perfil() = 'operacional' and r.autor_id = privado.usuario_id()
            and r.status in ('rascunho', 'devolvido') and privado.na_obra(r.obra_id))
        or (privado.perfil() = 'master' and r.status in ('submetido', 'em_analise')))
  )
$$;

-- Quem não é master não pode mudar perfil, e-mail, vínculo com o Auth, cliente nem bloquear/desbloquear.
-- (Chamadas do servidor com service_role e do SQL Editor não têm auth.uid(), então passam.)
create function privado.proteger_usuario() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and privado.perfil() is distinct from 'master' then
    if new.id is distinct from old.id or new.auth_id is distinct from old.auth_id
       or new.perfil is distinct from old.perfil or new.email is distinct from old.email
       or new.cliente_id is distinct from old.cliente_id or new.ativo is distinct from old.ativo then
      raise exception 'Você não pode alterar esses campos do usuário.' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger usuarios_protegidos before update on usuarios
  for each row execute function privado.proteger_usuario();

grant execute on all functions in schema privado to authenticated;

-- ============================== RLS ==================================================
-- Liga o RLS em TODAS as tabelas do schema public. Tabela sem política = ninguém (exceto o servidor) acessa.

do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Empresa, clientes, catálogos e configurações: todos leem (os dados são só rótulos); master altera.
create policy empresa_ler on empresa for select to authenticated using (privado.perfil() is not null);
create policy empresa_alterar on empresa for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

create policy clientes_ler on clientes for select to authenticated
  using (privado.perfil() = 'master' or exists (select 1 from obras o where o.cliente_id = clientes.id));
create policy clientes_alterar on clientes for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

create policy catalogo_ler on catalogo_item for select to authenticated using (privado.perfil() is not null);
create policy catalogo_alterar on catalogo_item for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

create policy configuracoes_ler on configuracoes for select to authenticated using (privado.perfil() is not null);
create policy configuracoes_alterar on configuracoes for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

-- Usuários: master vê e cadastra todos; cada um vê e edita o próprio (campos sensíveis: trigger acima).
-- Não há DELETE: usuário sai de cena sendo bloqueado (ativo = false).
create policy usuarios_ler on usuarios for select to authenticated
  using (privado.perfil() = 'master' or id = privado.usuario_id());
create policy usuarios_inserir on usuarios for insert to authenticated with check (privado.perfil() = 'master');
create policy usuarios_alterar on usuarios for update to authenticated
  using (privado.perfil() = 'master' or id = privado.usuario_id())
  with check (privado.perfil() = 'master' or id = privado.usuario_id());

-- Obras e vínculos: master cadastra; os outros veem só as suas.
create policy obras_ler on obras for select to authenticated using (privado.na_obra(id));
create policy obras_alterar on obras for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

create policy obra_usuario_ler on obra_usuario for select to authenticated
  using (privado.perfil() = 'master' or usuario_id = privado.usuario_id());
create policy obra_usuario_alterar on obra_usuario for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

-- RDO: o cliente só vê os liberados; só o operacional cria; o autor edita em rascunho/devolvido.
create policy rdos_ler on rdos for select to authenticated
  using (privado.na_obra(obra_id)
         and (privado.perfil() <> 'cliente' or privado.rdo_liberado(status, liberado_ao_cliente_em)));
create policy rdos_inserir on rdos for insert to authenticated
  with check (privado.perfil() = 'operacional' and privado.na_obra(obra_id)
              and autor_id = privado.usuario_id() and status = 'rascunho');
create policy rdos_alterar on rdos for update to authenticated
  using (privado.perfil() = 'master'
         or (privado.perfil() = 'operacional' and autor_id = privado.usuario_id()
             and status in ('rascunho', 'devolvido') and privado.na_obra(obra_id)))
  with check (privado.perfil() = 'master'
              or (privado.perfil() = 'operacional' and autor_id = privado.usuario_id()
                  and status in ('rascunho', 'devolvido', 'submetido')));
-- Excluir é exceção do master e só para RDO não assinado.
create policy rdos_excluir on rdos for delete to authenticated
  using (privado.perfil() = 'master' and status in ('rascunho', 'submetido', 'em_analise', 'devolvido'));

-- Blocos C a L: lê quem pode ver o RDO; escreve quem pode editá-lo.
do $$
declare t text;
begin
  foreach t in array array['mao_de_obra', 'equipamentos', 'atividades', 'materiais', 'qualidade',
                           'incidentes', 'ocorrencias', 'visitas', 'fotos', 'pendencias'] loop
    execute format('create policy %I on public.%I for select to authenticated using (privado.pode_ver_rdo(rdo_id))',
                   t || '_ler', t);
    execute format('create policy %I on public.%I for all to authenticated using (privado.pode_editar_rdo(rdo_id)) with check (privado.pode_editar_rdo(rdo_id))',
                   t || '_escrever', t);
  end loop;
end $$;

-- Assinaturas: imutáveis (sem UPDATE/DELETE). Cada perfil assina só o seu papel, no estado certo.
create policy assinaturas_ler on assinaturas for select to authenticated using (privado.pode_ver_rdo(rdo_id));
create policy assinaturas_inserir on assinaturas for insert to authenticated
  with check (
    usuario_id = privado.usuario_id()
    and ((papel = 'master' and privado.perfil() = 'master'
          and privado.status_rdo(rdo_id) in ('submetido', 'em_analise'))
      or (papel = 'cliente' and privado.perfil() = 'cliente' and privado.pode_ver_rdo(rdo_id)
          and privado.status_rdo(rdo_id) = 'enviado_cliente')
      or (papel = 'operacional' and privado.perfil() = 'operacional' and privado.pode_editar_rdo(rdo_id)))
  );

-- Comentários: o cliente só vê (e faz) os de visibilidade "cliente", e só em RDO enviado/finalizado.
create policy comentarios_ler on comentarios for select to authenticated
  using (privado.pode_ver_rdo(rdo_id) and (privado.perfil() <> 'cliente' or visibilidade = 'cliente'));
create policy comentarios_inserir on comentarios for insert to authenticated
  with check (
    autor_id = privado.usuario_id() and papel = privado.perfil()
    and privado.pode_ver_rdo(rdo_id)
    and privado.status_rdo(rdo_id) <> 'cancelado'
    and (privado.perfil() <> 'cliente'
         or (visibilidade = 'cliente' and privado.status_rdo(rdo_id) in ('enviado_cliente', 'finalizado')))
  );

-- Auditoria do RDO: o cliente só vê os eventos públicos. Só inclui.
create policy auditoria_rdo_ler on auditoria_rdo for select to authenticated
  using (privado.pode_ver_rdo(rdo_id)
         and (privado.perfil() <> 'cliente'
              or evento in ('validacao', 'envio_cliente', 'ciencia_cliente', 'ressalva_cliente',
                            'esclarecimento_cliente', 'esclarecimento_respondido', 'finalizacao', 'retificacao')));
create policy auditoria_rdo_inserir on auditoria_rdo for insert to authenticated
  with check (usuario_id = privado.usuario_id() and privado.pode_ver_rdo(rdo_id));

create policy auditoria_global_ler on auditoria_global for select to authenticated using (privado.perfil() = 'master');
create policy auditoria_global_inserir on auditoria_global for insert to authenticated
  with check (usuario_id = privado.usuario_id());

-- Notificações: cada usuário vê e marca como lida só as dele. Quem cria é o servidor.
create policy notificacoes_ler on notificacoes for select to authenticated using (usuario_id = privado.usuario_id());
create policy notificacoes_alterar on notificacoes for update to authenticated
  using (usuario_id = privado.usuario_id()) with check (usuario_id = privado.usuario_id());

-- Exportações e módulo acadêmico: só o master.
create policy exportados_master on arquivos_exportados for all to authenticated
  using (privado.perfil() = 'master') with check (privado.perfil() = 'master');

do $$
declare t text;
begin
  foreach t in array array['criterios_academicos', 'fases_academicas', 'grupos_academicos',
                           'entregas_academicas', 'versoes_entrega'] loop
    execute format('create policy %I on public.%I for all to authenticated using (privado.perfil() = ''master'') with check (privado.perfil() = ''master'')',
                   t || '_master', t);
  end loop;
end $$;

-- Dispositivos: cada um cuida só dos seus.
create policy dispositivos_proprios on dispositivos for all to authenticated
  using (usuario_id = privado.usuario_id()) with check (usuario_id = privado.usuario_id());

-- `idempotencia` fica sem política de propósito: só o servidor (service_role) usa.

-- Fotos: o bucket `fotos-rdo` deve ser PRIVADO. O servidor lê e grava com a service_role;
-- o app recebe as fotos pela API (GET /rdos/{id}/fotos/{fotoId}/arquivo).
