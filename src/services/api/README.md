# Camada de API

Os módulos por recurso expõem funções assíncronas usadas pelo store. Com `EXPO_PUBLIC_USE_MOCK=true`, o serviço usa os transformadores locais de `src/store/actions.js`. Com `false`, `remoto.js` converte as ações nas rotas de `docs/api.md`, usando `EXPO_PUBLIC_API_URL` como base. A URL pode incluir `/api/v1`.

O cliente HTTP suporta JSON, multipart, bearer token, tempo limite de 15 segundos e erros `ApiError`. Um 401 de uma requisição autenticada encerra a sessão correspondente. Falhas de login ou recuperação não encerram uma sessão válida.

## Login, recuperação e termos

As telas usam as ações de serviço e aguardam a resposta antes de avançar. A divisão entre `index.js` e `styles.js` foi mantida.

Login envia e-mail, senha e a opção de manter conectado. Acesso rápido por usuário e biometria de demonstração ficam restritos ao mock. O login real carrega os dados do servidor, sem senhas no estado, e substitui as coleções da sessão anterior. Rascunhos do usuário com itens pendentes na fila são preservados.

No Android e iOS, o token é armazenado com `expo-secure-store` quando o usuário marca manter conectado. No navegador fica na memória. Mock e real usam chaves diferentes para sessão e dados locais. O logout tenta revogar o token no servidor e sempre limpa a sessão do aparelho.

A recuperação usa `solicitarRecuperacao`, `verificarCodigo` e `redefinirSenha`. No mock, o serviço gera e verifica o código; a tela só exibe o código de demonstração quando `DEMO` está habilitado. O contrato real não possui uma rota separada para verificar o código: a etapa intermediária apenas confere o formato, e o servidor valida código e nova senha juntos em `/auth/recuperacao/confirmar`. A interface informa essa diferença.

O aceite só é confirmado após a resposta do servidor. Termos e canais usam as rotas previstas no contrato.

## Rotas e respostas

`remoto.js` escolhe método, rota, campos enviados e tratamento da resposta. `payloads.js` converte números dos formulários e limita o conteúdo editável do RDO. Número oficial, IP, hashes e carimbos de assinatura não são gerados pelo adaptador.

As requisições levam a identificação do aparelho. Escritas recebem uma chave de idempotência; itens da fila reutilizam a mesma chave nas tentativas. Fotos usam multipart com arquivo e metadados. Entrega acadêmica exige um arquivo com URI: o nome isolado usado pela tela de demonstração não representa um upload real.

`apiState.js` aplica as entidades normalizadas pelo adaptador: `alteracoes` atualiza por ID, `substituir` troca coleções no carregamento da sessão e `removidos` exclui IDs. `usuario`, `token`, `termosAceitos` e `aceite` são retornos internos da integração.

## Offline

`salvarRdo` preserva o rascunho local antes de enviar. A submissão enfileira conteúdo, fotos e submissão nessa ordem. Cada item contém `{ id, acao, args, criadoEm, tentativas, userId }` e permanece no aparelho até a confirmação. Uma falha interrompe a fila sem descartar o item. Itens de outro usuário não são enviados.

As fotos nativas recebem uma cópia na pasta de documentos antes do enfileiramento. Respostas do servidor preservam as fotos que ainda aguardam upload e os rascunhos com alterações posteriores. A apresentação do progresso continua com a tela de fotos.

O horário da edição local e a revisão do servidor ficam separados. O salvamento envia a última revisão confirmada em `atualizadoEm`, inclusive entre itens da fila, para que o servidor detecte edições concorrentes sem recusar um salvamento apenas porque o usuário editou o formulário. Um conflito real preserva o rascunho e o item da fila.

`forceOffline` é uma opção local. Inatividade e lembretes usam `/configuracoes`, conforme o contrato.

## Validação e limites do servidor falso

Execute `npm test`. Os testes de cobertura comparam todas as ações do store com os módulos da API e as rotas, falhando se um módulo voltar vazio ou uma ação ficar sem função.

`api-servidor.test.js` inicia o servidor de `scripts/mock-server.js` numa porta local livre e executa a camada real com `useMock: false`. Cobre login, restauração, troca de perfil, notificações, logout e preservação dos dados quando uma escrita é rejeitada.

A branch `pessoa-3`, no commit `511f03e`, também implementa criação, conteúdo, submissão, devolução, validação, manifestação e comentários do RDO. A camada foi testada contra essa versão em uma cópia separada, sem trazer o trabalho dos colegas para este PR: 68 testes passaram, incluindo duas edições offline consecutivas, o fluxo entre operacional/master/cliente e conflito entre dois aparelhos.

Os dois testes novos de escrita são explicitamente ignorados apenas se a criação devolver `501`, pois a main `9f2dc8f` ainda não recebeu essas rotas. Nessa base, são 66 testes aprovados e dois ignorados; com o servidor atualizado, os 68 executam. Outros erros não viram testes ignorados.

Recuperação, aceite de termos, fotos e várias outras escritas continuam sem handlers nessa versão do servidor. O app mostra o erro e preserva o estado pendente; os testes não tratam rejeição como sucesso. Esses fluxos ainda dependem do servidor e de uma conferência manual no Expo Go.
