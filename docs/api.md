# Contrato da API — RDO Mobile

Este contrato descreve o que o back-end precisa oferecer para o app deixar de usar o `AsyncStorage` e as ações locais. Cada uma das **38 ações** de `src/store/actions.js` está coberta na seção 12 (tabela de cobertura), na mesma divisão de módulos que a camada `src/services/api` vai usar: `auth`, `obras`, `rdos`, `fotos`, `comentarios`, `assinaturas`, `notificacoes`, `usuarios`, `cadastros`, `relatorios`, `academico`.

Documentos relacionados:

- `docs/modelo-de-dados.md`: campos e valores de cada objeto citado aqui.
- `docs/regras-de-negocio.md`: transições, permissões, validações, hash e lembretes.
- `docs/exemplos/*.json`: exemplos reais de payload, gerados por `node scripts/exportar-seed.js`.

> **Status:** proposta para revisão. As decisões em aberto estão na seção 13. Quando o back-end for escolhido, este arquivo pode virar `openapi.yaml` sem mudar o conteúdo.

## 1. Convenções gerais

| Assunto | Regra |
| --- | --- |
| **URL base** | `{API_URL}/api/v1` (o app lê `EXPO_PUBLIC_API_URL`). |
| **Formato** | JSON em UTF-8 (`Content-Type: application/json`), exceto o envio de fotos (`multipart/form-data`). |
| **Nomes** | Campos em português e `camelCase`, iguais aos do app (`obraId`, `criadoEm`). |
| **Datas** | `data`: `AAAA-MM-DD`. Hora: `HH:MM`. Data e hora: ISO 8601 em UTC (`2026-10-08T13:30:00.000Z`). Ver `modelo-de-dados.md`, seção 1. |
| **Números** | Número JSON com ponto decimal (decisão D1). O cliente HTTP converte `"42,0"` do formulário em `42` e de volta. |
| **Autenticação** | `Authorization: Bearer <token>` em todas as rotas, exceto as de `/auth` marcadas como públicas. |
| **Identificação do aparelho** | `X-Device-Id: <deviceId>` (ID de instalação gerado no primeiro uso) e `X-Device-Label: Android 15 • Expo Go`. O servidor usa os dois na evidência da assinatura. |
| **IP** | O servidor grava o IP real da requisição. O app nunca envia IP. |
| **Hora oficial** | Todo carimbo de hora é do servidor. O app não envia `criadoEm`, `dataHora` nem `hash*`. |
| **Respostas de escrita** | Devolvem o objeto atualizado completo (por exemplo, o RDO inteiro), para o app trocar a cópia local. |
| **Tempo limite** | O app espera até 15 s e então trata como falha de rede. |
| **Idempotência** | Toda rota `POST`/`PUT`/`PATCH` aceita `Idempotency-Key: <uuid>`. Repetir a mesma chave devolve a resposta da primeira vez. É essencial para a fila offline (seção 11). |

### 1.1 Paginação

Listas aceitam `pagina` (padrão 1), `porPagina` (padrão 20, máximo 100) e `ordem`. Resposta:

```json
{ "itens": [ ], "total": 134, "pagina": 1, "porPagina": 20 }
```

### 1.2 Formato de erro (todas as rotas)

```json
{
  "codigo": "VALIDACAO",
  "mensagem": "O RDO tem 2 erros que impedem o envio.",
  "campos": [
    { "passo": "fotos", "campo": "legenda", "mensagem": "Foto 02: a legenda é obrigatória.", "ref": "obra_alfa_9v1_ft3" }
  ]
}
```

O cliente HTTP (Pessoa 2) monta o erro padronizado `{ status, codigo, mensagem, campos }` com o status HTTP e este corpo. `campos` só aparece em `422` (mesma estrutura do `erros` de `validarRdo`).

| HTTP | `codigo` | Quando |
| --- | --- | --- |
| 400 | `REQUISICAO_INVALIDA` | JSON mal formado ou campo obrigatório ausente. |
| 401 | `NAO_AUTENTICADO` | Sem token, token inválido ou expirado. **O app encerra a sessão.** |
| 401 | `CREDENCIAIS_INVALIDAS` | Login com e-mail ou senha incorretos (não encerra sessão, só mostra o erro). |
| 403 | `SEM_PERMISSAO` | O perfil não pode usar a rota. |
| 403 | `USUARIO_BLOQUEADO` | Usuário com `ativo = false`. |
| 404 | `NAO_ENCONTRADO` | Não existe **ou o usuário não pode ver** (não distinguir, para não revelar existência). |
| 409 | `TRANSICAO_INVALIDA` | O status atual do RDO não permite a ação (ex.: devolver um RDO já validado). |
| 409 | `RDO_DUPLICADO` | Já existe RDO ativo na mesma obra, data e turno e o app não confirmou (decisão D5). |
| 409 | `CONFLITO` | Outra pessoa alterou o mesmo registro antes (use `atualizadoEm` na edição, seção 5). |
| 410 | `CODIGO_EXPIRADO` | Código de uso único ou de recuperação vencido. |
| 413 | `ARQUIVO_GRANDE` | Foto acima do limite (decisão D4). |
| 422 | `VALIDACAO` | Falha nas regras de negócio (RDO inválido, falta motivo, justificativa vazia…). |
| 429 | `MUITAS_TENTATIVAS` | Limite de tentativas de login ou de código. |
| 5xx | `ERRO_INTERNO` | Falha do servidor. O app mantém o rascunho e deixa tentar de novo. |

## 2. Perfis e permissões nas rotas

Resumo (detalhes em `regras-de-negocio.md`, seção 2). Em toda rota que recebe `obraId` ou `rdoId`, o servidor confere o vínculo do usuário com a obra:

| Perfil | Pode |
| --- | --- |
| **master** | Tudo, em todas as obras. |
| **operacional** | Obras vinculadas. Criar, editar e enviar **os próprios** RDOs; comentar. |
| **cliente** | Obras vinculadas, **só RDOs liberados** (`enviado_cliente`, `finalizado`, ou retificado/cancelado já liberado). Manifestar ciência; comentar. |

## 3. Módulo `auth` (sessão, termos e senha)

| Método e rota | Função do app | Quem | Corpo | Resposta | Erros |
| --- | --- | --- | --- | --- | --- |
| `POST /auth/login` (pública) | `entrar` | — | `{ email, senha, manter }` | `200 { token, expiraEm, usuario, termosAceitos }` (`termosAceitos` é `null` se ainda não aceitou) | 401 `CREDENCIAIS_INVALIDAS`, 403 `USUARIO_BLOQUEADO`, 429 |
| `POST /auth/logout` | `sair` | qualquer | — | `204` (invalida o token) | — |
| `GET /auth/sessao` | restaurar sessão ao abrir o app | qualquer | — | `200 { usuario, termosAceitos }` | 401 |
| `POST /auth/recuperacao` (pública) | recuperar senha (tela `ForgotPassword`) | — | `{ email }` | `202` (sempre, exista ou não o e-mail) | 429 |
| `POST /auth/recuperacao/confirmar` (pública) | `alterarSenha` (fluxo de recuperação) | — | `{ email, codigo, novaSenha }` | `204` | 410 `CODIGO_EXPIRADO`, 422 |
| `POST /auth/senha` | `alterarSenha` (logado) | qualquer | `{ senhaAtual, novaSenha }` | `204` | 401 `CREDENCIAIS_INVALIDAS`, 422 |
| `POST /auth/segundo-fator` | pedir o código da assinatura | master, cliente | `{ finalidade: "assinatura", rdoId }` | `202 { expiraEm }` (envia o código por e-mail ou SMS) | 429 |
| `POST /usuarios/me/termos` | `aceitarTermos` | qualquer | `{ versaoTermos, opcoes }` | `201 { em, opcoes }` | — |

Regras:

- A senha **nunca** é devolvida em resposta alguma, nem guardada em texto. Regras de senha (tamanho mínimo etc.) a definir; hoje o app aceita qualquer valor e todos usam `123456`.
- O código de recuperação **não** aparece mais na tela (isso só existe no modo mock).
- `definirBiometria` não tem rota: a biometria é local do aparelho (decisão D6).

Exemplo de login:

```json
POST /auth/login
{ "email": "operacional@planengen.com.br", "senha": "********", "manter": true }

200
{
  "token": "eyJhbGciOi…",
  "expiraEm": "2026-10-14T15:00:00.000Z",
  "usuario": { "id": "u_joao", "nome": "João Ribeiro", "perfil": "operacional", "cargo": "Mestre de obras", "ativo": true, "canais": { "push": true, "email": true, "whatsapp": false } },
  "termosAceitos": { "em": "2026-09-04T12:00:00.000Z", "opcoes": { } }
}
```

## 4. Módulo `obras` (e cadastros que dependem dela)

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /obras` | lista de obras | todos (filtrado) | filtros: `status`, `clienteId` | `200` lista paginada. Master: todas; demais: só as vinculadas. |
| `GET /obras/{obraId}` | detalhe | com vínculo | — | `200 Obra` (inclui `usuarioIds`) |
| `POST /obras` | `salvarObra` (nova) | master | `Obra` sem `id`: `nome`, `descricao`, `contrato`, `os`, `clienteId`, `endereco`, `inicio`, `inicioRegistro`, `fim`, `engenheiroRTId`, `diasUteis`, `exigeAssinaturaOperacional`, `status`, `usuarioIds` | `201 Obra`. O servidor preenche `clienteNome`, `empresaExecutora`, `engenheiroRT`. Auditoria global `obra`. |
| `PUT /obras/{obraId}` | `salvarObra` (edição) | master | igual ao `POST` | `200 Obra`. RDOs já criados **não mudam** (`identificacao` é cópia). |

## 5. Módulo `rdos`

### 5.1 Consulta

| Método e rota | Função do app | Quem | Resposta |
| --- | --- | --- | --- |
| `GET /rdos` | listas e filtros (RF-16) | todos (filtrado) | `200` lista paginada de **resumos** (campos abaixo). |
| `GET /rdos/{rdoId}` | detalhe | quem pode ver | `200 RDO` completo, com `fotos` (com `url`), `comentarios` e `assinaturas`; `comentarios` e `auditoria` já filtrados pelo perfil. |
| `GET /rdos/{rdoId}/auditoria` | histórico | quem pode ver | `200 [AuditoriaRdo]` (cliente: só eventos públicos). |
| `GET /obras/{obraId}/rdos/acumulado` | acumulado anterior do serviço | master, operacional | filtros `servico`, `data`, `ignorarRdoId`; `200 { servico, acumulado }`. |

**Filtros de `GET /rdos`** (RF-16): `obraId`, `de` e `ate` (período de `data`), `numero`, `status` (um ou vários, separados por vírgula), `autorId`, `atividade` (texto, busca em `atividades[].servico`), `ocorrencia` (`true` = só os que têm ocorrências; ou texto, busca em `ocorrencias[].fato`), `pendente` (`true` = com `sync` pendente ou com esclarecimento pendente), `pagina`, `porPagina`, `ordem` (`data`, `-data`, `numero`).

**Resumo do RDO** (cartão das listas): `id`, `obraId`, `numero`, `versao`, `data`, `turno`, `status`, `autorId`, `atualizadoEm`, `submetidoEm`, `esclarecimentoPendente`, `devolucao.prazo`, e os contadores `totalTrabalhadores`, `totalFotos`, `totalOcorrencias`.

O cliente só recebe RDOs liberados, mesmo que peça `status=rascunho` (resposta vazia, não erro).

### 5.2 Criação e edição (operacional)

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `POST /obras/{obraId}/rdos` | `criarRdo` | operacional da obra | `{ data, turno, reaproveitarDe, idLocal, confirmarDuplicado }` (só `data` e `turno` obrigatórios) | `201 RDO` em `rascunho`, com `id` e `numero` do servidor e `Location` do novo recurso. |
| `PUT /rdos/{rdoId}/conteudo` | `salvarRdo` | autor (operacional) | `{ conteudo, atualizadoEm, manual }` | `200 RDO` |

Regras de `POST /obras/{obraId}/rdos`:

- O servidor monta o RDO vazio (`criarRdoVazio`): copia os dados da obra para `identificacao` e gera `id`, `numero` (seção "Numeração" em `regras-de-negocio.md`) e `versao = 1`.
- `reaproveitarDe`: id de um RDO anterior da mesma obra; o servidor copia mão de obra, equipamentos, atividades (zerando quantidades), pendências abertas e restrições (`reaproveitarDoAnterior`).
- `idLocal`: UUID gerado pelo app quando cria offline (decisão D3). Único por usuário.
- Se já existe RDO ativo na mesma obra, data e turno: `409 RDO_DUPLICADO`; repetir com `confirmarDuplicado: true` para criar mesmo assim (decisão D5).

Regras de `PUT /rdos/{rdoId}/conteudo`:

- `conteudo` traz os blocos editáveis: `data`, `turno`, `identificacao.responsavelPreenchimento`, `clima`, `maoDeObra`, `observacaoMaoDeObra`, `equipamentos`, `semProducao`, `atividades`, `materiais`, `qualidade`, `seguranca`, `ocorrencias`, `visitas`, `pendencias`, `planejamento`, `semRegistro`, `observacoesGerais`, `declaracao.aceita`, `assinaturaOperacional`.
- O servidor **ignora e nunca aceita** do cliente: `id`, `obraId`, `numero`, `versao`, `status`, `autorId`, carimbos de hora, `assinaturas`, `hashTecnico`, `hashFinal`, `comentarios`, `auditoria`, `devolucao`, `cancelamento`, `sync`, e as `fotos` (que têm rotas próprias, módulo `fotos`).
- `atualizadoEm` é o valor que o app tinha. Se o servidor tem outro, responde `409 CONFLITO` (outra pessoa ou outro aparelho salvou antes).
- Só no status `rascunho` ou `devolvido` e só o autor: senão `409 TRANSICAO_INVALIDA` ou `403`.
- `manual = true` registra o evento `rascunho_salvo` na auditoria (salvamento automático não registra).
- Salvar rascunho **não valida** o conteúdo; a validação roda só ao submeter.

### 5.3 Fluxo

Todas as rotas abaixo devolvem o RDO completo atualizado, conferem o status de origem (senão `409 TRANSICAO_INVALIDA`) e gravam a auditoria e as notificações descritas em `regras-de-negocio.md`, seção 1.1.

| Método e rota | Função do app | Quem | De → Para | Corpo | Erros específicos |
| --- | --- | --- | --- | --- | --- |
| `POST /rdos/{rdoId}/submeter` | `submeterRdo` | autor | `rascunho`/`devolvido` → `submetido` | — | `422 VALIDACAO` com `campos` (erros) |
| `POST /rdos/{rdoId}/analise` | `iniciarAnalise` | master | `submetido` → `em_analise` | — | 409 se já está em análise ou em outro estado (o app trata como sucesso) |
| `POST /rdos/{rdoId}/visualizacoes` | `registrarVisualizacao` | quem pode ver | igual | — | Responde `204`; **não** registra se o mesmo usuário já visualizou há menos de 10 min. |
| `POST /rdos/{rdoId}/devolucao` | `devolverRdo` | master | `submetido`/`em_analise` → `devolvido` | `{ motivo, prazo, contexto }` | 422 sem `motivo` |
| `PUT /rdos/{rdoId}/edicao-master` | `editarComoMaster` | master | `submetido`/`em_analise` (não muda) | `{ conteudo, justificativa, alteracoes }` | 422 sem `justificativa` ou com `alteracoes` vazia |
| `POST /rdos/{rdoId}/validacao` | `validarEAssinar` | master | `submetido`/`em_analise` → `validado` (→ `enviado_cliente` se `enviarAgora`) | `{ assinatura, enviarAgora, canais }` | 422 sem `assinatura`; 401/410 código 2FA |
| `POST /rdos/{rdoId}/envio-cliente` | `enviarAoCliente` | master | `validado` → `enviado_cliente` | `{ canais }` | — |
| `POST /rdos/{rdoId}/envio-cliente/reenvio` | `reenviarNotificacaoCliente` | master | `enviado_cliente` (não muda) | — | — |
| `POST /rdos/{rdoId}/manifestacao` | `assinarComoCliente` | cliente da obra | `enviado_cliente` → `finalizado` (ciência/ressalva) ou mantém (esclarecimento) | `{ tipo, texto, assinatura }` | 422 sem `texto` em `ressalva` e `esclarecimento` |
| `POST /rdos/{rdoId}/retificacao` | `retificarRdo` | master | original → `retificado`; **novo RDO** em `rascunho` | `{ motivo }` | 422 sem `motivo` |
| `POST /rdos/{rdoId}/cancelamento` | `cancelarRdo` | master | qualquer → `cancelado` | `{ motivo }` | 422 sem `motivo`; 409 se já está `cancelado`/`retificado` |
| `POST /rdos/{rdoId}/exclusao` | `excluirRdo` | master | só não assinados | `{ motivo }` | 409 se o RDO foi assinado; 422 sem `motivo` |
| `POST /rdos/{rdoId}/pdf` | `registrarPdf` | quem pode ver | igual | — | Registra o evento `pdf_gerado`. Hoje o PDF é montado no aparelho; ver D8. |

Resposta de `POST /rdos/{rdoId}/retificacao`: `201` com o **novo** RDO (o app abre essa versão, como `RdoDetailScreen` faz com o retorno de `retificarRdo`) e cabeçalho `Location`.

Resposta de `POST /rdos/{rdoId}/exclusao`: `204`.

### 5.4 Exemplos

**Erro de validação ao submeter** (`422`):

```json
POST /rdos/rdo_alfa_0009/submeter

422
{
  "codigo": "VALIDACAO",
  "mensagem": "O RDO tem 3 erros que impedem o envio.",
  "campos": [
    { "passo": "atividades", "campo": "lista", "mensagem": "Registre ao menos uma atividade ou marque \"Dia sem produção\" com justificativa." },
    { "passo": "revisao", "campo": "declaracao", "mensagem": "Aceite a declaração de responsabilidade para enviar." },
    { "passo": "revisao", "campo": "assinatura", "mensagem": "Esta obra exige a assinatura do responsável pelo preenchimento." }
  ]
}
```

(Os avisos não bloqueiam; o app os obtém em `GET /rdos/{id}/validacao`, seção 5.5.)

**Devolver:**

```json
POST /rdos/rdo_alfa_0008/devolucao
{ "motivo": "Foto 03 sem local preciso: informe o eixo/pavimento e reenvie.", "prazo": "2026-10-13T21:00:00.000Z", "contexto": "fotos" }
```

**Validar e assinar:**

```json
POST /rdos/rdo_alfa_0007/validacao
{
  "enviarAgora": true,
  "canais": ["app", "email"],
  "assinatura": {
    "tracos": [[{ "x": 49.2, "y": 80.2 }, { "x": 53, "y": 79.7 }]],
    "largura": 300,
    "altura": 120,
    "segundoFator": { "metodo": "otp", "codigo": "482913" }
  }
}
```

O servidor acrescenta `usuarioId`, `nome`, `papel`, `dataHora`, `versao`, `ip`, `dispositivo`, `declaracao` (texto exato exibido), `metodo2fa` e `hash` à `assinatura`, e devolve o RDO com `assinaturas.master` completo.

**Manifestação do cliente** (`tipo`: `ciencia`, `ressalva` ou `esclarecimento`; só os dois primeiros levam `assinatura`):

```json
POST /rdos/rdo_alfa_0006/manifestacao
{
  "tipo": "ressalva",
  "texto": "Quantitativo de aterro informado diverge da medição do cliente; solicito conferência.",
  "assinatura": { "tracos": [[]], "largura": 300, "altura": 120, "segundoFator": { "metodo": "biometria" } }
}
```

### 5.5 Validação prévia (sem enviar)

| Método e rota | Função do app | Quem | Resposta |
| --- | --- | --- | --- |
| `GET /rdos/{rdoId}/validacao` | tela de revisão (`validarRdo`) | autor, master | `200 { valido, erros, avisos, porPasso, progresso }` |

Mesma estrutura de `validarRdo` (ver `regras-de-negocio.md`, seção 3). O app pode continuar calculando localmente para dar retorno imediato ao digitar; esta rota é a conferência oficial.

## 6. Módulo `fotos`

As fotos não vão dentro do JSON do RDO: o arquivo sobe pela rota própria e o RDO passa a trazer `url` (decisão D4).

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `POST /rdos/{rdoId}/fotos` | adicionar foto (`StepFotos`) | autor | `multipart/form-data`: `arquivo` (imagem), `legenda`, `local`, `vinculoTipo` (`atividade`/`ocorrencia`), `vinculoId`, `capturadaEm`, `latitude`, `longitude`, `largura`, `altura`, `compressao` | `201 Foto` com `id`, `numero`, `url`, `autorId`, `dataHora` |
| `PUT /rdos/{rdoId}/fotos/{fotoId}` | editar legenda, local e vínculo | autor | `{ legenda, local, vinculo }` | `200 Foto` |
| `DELETE /rdos/{rdoId}/fotos/{fotoId}` | remover foto | autor | — | `204`. Os números das demais fotos são renumerados em sequência. |
| `GET /rdos/{rdoId}/fotos/{fotoId}/arquivo` | exibir a imagem | quem pode ver o RDO | — | `200` binário (a URL exige o token; `url` na `Foto` aponta para esta rota). |

- Só com RDO em `rascunho` ou `devolvido` e só o autor.
- Progresso de envio (RNF-02): o app mede o progresso do upload; o servidor não precisa de rota especial.
- Tipos aceitos: `image/jpeg`, `image/png`, `image/heic` (convertida). Limite de tamanho e quantidade por RDO: decisão D4 (premissa aberta "limite de fotos" da seção 20).

## 7. Módulo `comentarios`

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /rdos/{rdoId}/comentarios` | lista | quem pode ver | — | `200 [Comentario]` (cliente: só `visibilidade = cliente`) |
| `POST /rdos/{rdoId}/comentarios` | `comentarRdo` | ver tabela abaixo | `{ texto, contexto, contextoRef, visibilidade }` | `201 Comentario` + RDO atualizado se houve mudança (resposta de esclarecimento) |

Quem pode comentar, por perfil e status (`regras-de-negocio.md`, seção 2): operacional e master em qualquer status menos `cancelado` (master também em `rascunho` e `devolvido`); cliente só em `enviado_cliente` e `finalizado`. `visibilidade`: o cliente sempre `cliente`; o master escolhe, e `cliente` só vale se o RDO já foi liberado (senão `422`). Se o master comenta num RDO com `esclarecimentoPendente`, o servidor grava `tipo: resposta`, `visibilidade: cliente` e baixa a pendência.

## 8. Módulo `assinaturas`

As assinaturas acontecem nas rotas de fluxo (`/validacao` e `/manifestacao`, seção 5.3) porque assinar **é** a transição. Este módulo cobre só a consulta e a evidência:

| Método e rota | Função do app | Quem | Resposta |
| --- | --- | --- | --- |
| `GET /rdos/{rdoId}/assinaturas` | tela de comprovante (`ReceiptScreen`) | quem pode ver | `200 { master, cliente, hashTecnico, hashFinal }` |
| `GET /rdos/{rdoId}/comprovante` | comprovante com QR | quem pode ver | `200 { numero, versao, hashTecnico, hashFinal, finalizadoEm, urlVerificacao }`. O QR do app passa a apontar para `urlVerificacao`. |
| `GET /verificacao/{hash}` (pública) | conferir um PDF impresso | — | `200 { valido, numero, obra, finalizadoEm }` (sem dados sensíveis). ⚠️ Opcional; decidir com o solicitante. |

`assinaturaOperacional` (desenhada pelo operacional) vai no `conteudo` de `PUT /rdos/{rdoId}/conteudo`, sem segundo fator.

## 9. Módulo `notificacoes`

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /notificacoes` | central de notificações | todos (só as do próprio usuário) | filtros: `lida`, `tipo`, `rdoId`, paginação | `200` lista paginada, mais `naoLidas` (total). |
| `PATCH /notificacoes/{id}` | `marcarNotificacaoLida` | dono | `{ lida: true }` | `200 Notificacao` |
| `POST /notificacoes/marcar-todas-lidas` | `marcarTodasLidas` | dono | — | `204` |
| `POST /notificacoes/{id}/reenvio` | `reenviarEntrega` | master | — | `200 Notificacao` (entrega refeita, `resolvida: true`). Só para `tipo = falha_entrega`; senão 409. |
| `PUT /dispositivos/{deviceId}/push` | registrar o token de push do aparelho | qualquer | `{ tokenPush, plataforma }` | `204` |

- `processarLembretes` **não tem rota**: é tarefa agendada do servidor (`regras-de-negocio.md`, seção 5.1). O app só lê `GET /notificacoes` ao abrir, ao voltar ao primeiro plano e quando chega um push.
- O "push simulado" do app (aviso na tela quando entra notificação nova) é trocado pelo push real; o app consulta a lista ao receber.

## 10. Módulos `usuarios`, `cadastros`, `relatorios` e `academico`

### 10.1 `usuarios`

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /usuarios` | lista de usuários | master | filtros `perfil`, `ativo`, `obraId` | `200` lista (sem senha) |
| `GET /usuarios/{id}` | detalhe | master; ou o próprio usuário | — | `200 Usuario` (com `obraIds`) |
| `POST /usuarios` | `salvarUsuario` (novo) | master | `{ nome, email, perfil, cargo, telefone, clienteId, crea, canais, obraIds }` | `201 Usuario`. O servidor envia o **convite por e-mail** com link para definir a senha. Não existe senha padrão. Auditoria global `usuario`. |
| `PUT /usuarios/{id}` | `salvarUsuario` (edição) | master | igual (sem `email` se já ativado, a definir) | `200 Usuario`. `obraIds` (ignorado para master) substitui os vínculos usuário–obra. |
| `PATCH /usuarios/{id}/ativo` | `alternarUsuarioAtivo` | master | `{ ativo }` | `200 Usuario`. Bloqueado encerra as sessões abertas. Auditoria global `usuario`. |
| `PATCH /usuarios/me/canais` | `atualizarCanais` | o próprio usuário | `{ push, email, whatsapp }` (parcial) | `200 { canais }` |

### 10.2 `cadastros`

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /empresa` | dados da empresa | todos | — | `200 Empresa` |
| `PUT /empresa` | `salvarEmpresa` | master | campos da empresa (parcial) | `200 Empresa`. Auditoria global `obra`. |
| `GET /clientes` | lista | master (operacional e cliente: só os das suas obras) | — | `200` lista |
| `POST /clientes` | `salvarCliente` (novo) | master | `{ nome, contato, email, telefone }` | `201 Cliente` |
| `PUT /clientes/{id}` | `salvarCliente` (edição) | master | igual | `200 Cliente`. Atualiza `clienteNome` das obras desse cliente. |
| `GET /catalogos` | todas as listas | todos | — | `200 { funcoes, equipamentos, servicos, materiais, unidades, frentes, origensEmpresa }` |
| `PUT /catalogos/{chave}` | `salvarCatalogo` | master | `{ lista: [texto] }` | `200 { chave, lista }`. `chave` precisa existir. |
| `GET /configuracoes` | configurações | todos | — | `200` (sem `forceOffline` e `simularFalhaEmail`, que são do aparelho) |
| `PATCH /configuracoes` | `atualizarConfiguracoes` | master | `{ inatividadeMin, lembretes }` (parcial; `lembretes` é mesclado) | `200` |
| `GET /auditoria` | auditoria global (tela `AuditScreen`) | master | filtros `evento`, `usuarioId`, `de`, `ate`, paginação | `200` lista de `AuditoriaGlobal` |
| `GET /exportacoes` | central de arquivos (lista de CSV gerados) | master | paginação | `200` lista de `ArquivoExportado` |
| `POST /exportacoes` | `registrarExportacao` | master | `{ nome, tipo, descricao }` | `201 ArquivoExportado`. Auditoria global `exportacao`. |

### 10.3 `relatorios`

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /relatorios/indicadores` | painel (`ReportsScreen`, `calcularIndicadores`) | master | `obraIds` (lista), `de`, `ate` | `200` com a mesma estrutura de retorno de `calcularIndicadores` (`src/domain/reports.js`). Ver decisão D7. |
| `GET /relatorios/rdos.csv` | exportação "RDOs" | master | `obraId`, `de`, `ate` | `200 text/csv` (colunas de `csvRdos`, `src/domain/exportacao.js`) |
| `GET /relatorios/atividades.csv` | exportação "Atividades" | master | idem | `200 text/csv` (`csvAtividades`) |
| `GET /relatorios/mao-de-obra.csv` | exportação "Mão de obra" | master | idem | `200 text/csv` (`csvMaoDeObra`) |

### 10.4 `academico` (RF-20, opcional)

| Método e rota | Função do app | Quem | Corpo | Resposta |
| --- | --- | --- | --- | --- |
| `GET /academico` | tela acadêmica | master | — | `200 { criterios, fases, grupos }` |
| `PUT /academico/grupos/{grupoId}/entregas/{faseId}/avaliacao` | `salvarAvaliacao` | master | `{ notas: { c1: 7.5, … }, comentario }` | `200 Entrega`. O servidor calcula `notaFinal`, define `status: avaliada` e `avaliadoEm`. Notas de 0 a 10. |
| `POST /academico/grupos/{grupoId}/entregas/{faseId}/versoes` | `registrarEntregaAcademica` | master | `multipart/form-data`: `arquivo`, `comentario` | `201 Versao`. A entrega passa a `em_avaliacao`; `numero` da versão sobe em 1. |

## 11. Fila offline (RF-05)

O app guarda a ação pendente no aparelho e envia em ordem quando a rede volta. Item da fila (definido pela Pessoa 2):

```json
{ "id": "q_01HX…", "acao": "rdos.submeter", "args": { "rdoId": "loc_9f2c…" }, "criadoEm": "2026-10-13T18:12:00.000Z", "tentativas": 0 }
```

Proposta para o servidor, sem endpoint novo:

1. Cada item vira **uma requisição normal** (as rotas acima), enviada em ordem, com `Idempotency-Key = id` do item. Se a resposta se perde e o app repete, o servidor devolve a mesma resposta.
2. Um RDO criado offline nasce com `idLocal` (UUID). Enquanto o app não sabe o `id` do servidor, ele usa `loc_<idLocal>` no lugar do `rdoId` em qualquer rota (`/rdos/loc_9f2c…/submeter`). O servidor aceita os dois formatos (decisão D3).
3. Ordem para um RDO criado e enviado offline: `POST /obras/{obraId}/rdos` → `PUT …/conteudo` → `POST …/fotos` (uma por foto) → `POST …/submeter`. Se alguma falhar com `422` ou `409`, a fila **para** nesse item e o app avisa o usuário (o rascunho nunca se perde).
4. Falha de rede ou `5xx`: manter o item e tentar de novo (com espera crescente). `401`: pedir login e continuar.
5. A hora oficial é a do **servidor ao receber**; `criadoEm` do item da fila serve só para ordenar. O app deve avisar que a data/hora oficial será a da sincronização.

Alternativa mais eficiente (opcional, depois): `POST /sincronizacao` com a lista de itens e resposta por item. Só se o desempenho pedir.

## 12. Cobertura: todas as 38 ações têm rota

| # | Ação (`store/actions.js`) | Módulo | Rota no contrato |
| --- | --- | --- | --- |
| 1 | `entrar` | auth | `POST /auth/login` |
| 2 | `sair` | auth | `POST /auth/logout` |
| 3 | `aceitarTermos` | auth | `POST /usuarios/me/termos` |
| 4 | `definirBiometria` | auth | **Sem rota** (local do aparelho; D6) |
| 5 | `alterarSenha` | auth | `POST /auth/senha` e `POST /auth/recuperacao/confirmar` |
| 6 | `criarRdo` | rdos | `POST /obras/{obraId}/rdos` |
| 7 | `salvarRdo` | rdos | `PUT /rdos/{rdoId}/conteudo` |
| 8 | `submeterRdo` | rdos | `POST /rdos/{rdoId}/submeter` |
| 9 | `sincronizarPendentes` | rdos | Fila offline (seção 11); sem rota própria |
| 10 | `registrarVisualizacao` | rdos | `POST /rdos/{rdoId}/visualizacoes` |
| 11 | `iniciarAnalise` | rdos | `POST /rdos/{rdoId}/analise` |
| 12 | `comentarRdo` | comentarios | `POST /rdos/{rdoId}/comentarios` |
| 13 | `devolverRdo` | rdos | `POST /rdos/{rdoId}/devolucao` |
| 14 | `editarComoMaster` | rdos | `PUT /rdos/{rdoId}/edicao-master` |
| 15 | `validarEAssinar` | assinaturas / rdos | `POST /rdos/{rdoId}/validacao` |
| 16 | `enviarAoCliente` | rdos | `POST /rdos/{rdoId}/envio-cliente` |
| 17 | `reenviarNotificacaoCliente` | rdos | `POST /rdos/{rdoId}/envio-cliente/reenvio` |
| 18 | `reenviarEntrega` | notificacoes | `POST /notificacoes/{id}/reenvio` |
| 19 | `assinarComoCliente` | assinaturas / rdos | `POST /rdos/{rdoId}/manifestacao` |
| 20 | `retificarRdo` | rdos | `POST /rdos/{rdoId}/retificacao` |
| 21 | `cancelarRdo` | rdos | `POST /rdos/{rdoId}/cancelamento` |
| 22 | `excluirRdo` | rdos | `POST /rdos/{rdoId}/exclusao` |
| 23 | `registrarPdf` | rdos | `POST /rdos/{rdoId}/pdf` |
| 24 | `marcarNotificacaoLida` | notificacoes | `PATCH /notificacoes/{id}` |
| 25 | `marcarTodasLidas` | notificacoes | `POST /notificacoes/marcar-todas-lidas` |
| 26 | `processarLembretes` | notificacoes | **Sem rota** (tarefa agendada do servidor) |
| 27 | `salvarObra` | obras | `POST /obras`, `PUT /obras/{obraId}` |
| 28 | `salvarUsuario` | usuarios | `POST /usuarios`, `PUT /usuarios/{id}` |
| 29 | `alternarUsuarioAtivo` | usuarios | `PATCH /usuarios/{id}/ativo` |
| 30 | `salvarCliente` | cadastros | `POST /clientes`, `PUT /clientes/{id}` |
| 31 | `salvarEmpresa` | cadastros | `PUT /empresa` |
| 32 | `salvarCatalogo` | cadastros | `PUT /catalogos/{chave}` |
| 33 | `atualizarConfiguracoes` | cadastros | `PATCH /configuracoes` |
| 34 | `atualizarCanais` | usuarios | `PATCH /usuarios/me/canais` |
| 35 | `registrarExportacao` | relatorios | `POST /exportacoes` |
| 36 | `salvarAvaliacao` | academico | `PUT /academico/grupos/{grupoId}/entregas/{faseId}/avaliacao` |
| 37 | `registrarEntregaAcademica` | academico | `POST /academico/grupos/{grupoId}/entregas/{faseId}/versoes` |
| 38 | `resetarDemo` | — | **Sem rota em produção.** Só existe no modo mock/demonstração (`EXPO_PUBLIC_DEMO=true`). |

Rotas de **leitura** que o app precisa e que não vêm de nenhuma ação (hoje o app lê tudo do `state` local): `GET /obras`, `GET /obras/{id}`, `GET /rdos`, `GET /rdos/{id}`, `GET /rdos/{id}/auditoria`, `GET /rdos/{id}/comentarios`, `GET /rdos/{id}/validacao`, `GET /rdos/{id}/assinaturas`, `GET /rdos/{id}/comprovante`, `GET /notificacoes`, `GET /usuarios`, `GET /clientes`, `GET /empresa`, `GET /catalogos`, `GET /configuracoes`, `GET /auditoria`, `GET /exportacoes`, `GET /relatorios/*`, `GET /academico`, `GET /auth/sessao`.

## 13. Decisões abertas

| # | Decisão | Proposta neste contrato | Quem decide |
| --- | --- | --- | --- |
| D1 | Número como texto com vírgula ou número JSON | Número JSON; conversão no cliente HTTP. | Pessoas 2 e 3 |
| D2 | Versionar a API | `/api/v1`; mudanças que quebram viram `/v2`. | Quem constrói o back-end |
| D3 | RDO criado offline sem `id` do servidor | `idLocal` + prefixo `loc_` aceito nas rotas. | Pessoas 2 e 3 + back-end |
| D4 | Fotos: armazenamento, tamanho máximo e quantidade por RDO | Upload `multipart`; limite a definir (premissa aberta da seção 20). | Solicitante |
| D5 | RDO duplicado (obra, data, turno) | `409 RDO_DUPLICADO` com confirmação do usuário. | Solicitante |
| D6 | Segundo fator da assinatura (código x biometria) | Código (OTP) validado pelo servidor; biometria só como confirmação local. | Solicitante |
| D7 | Indicadores calculados no servidor ou no app | Servidor (`GET /relatorios/indicadores`); alternativa: app continua calculando a partir de `GET /rdos` (mais simples para o back-end). | Pessoas 2, 3 e 6 |
| D8 | PDF gerado no app ou no servidor | Fica no app (expo-print); o servidor só registra. Se for do servidor, o PDF passa a ser o documento oficial com o `hashFinal`. | Solicitante |
| D9 | Autenticação (token simples, JWT com renovação) | Token de acesso com expiração; `manter conectado` aumenta a validade. | Quem constrói o back-end |
