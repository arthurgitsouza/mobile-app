# Camada de API

O modo mock usa os transformadores de `src/store/actions.js`. As 38 ações continuam expostas em módulos por recurso e devolvem Promise. O serviço também oferece recuperação de senha, restauração da sessão e envio de foto.

O cliente HTTP suporta JSON, multipart, bearer token, tempo limite de 15 segundos e erros `ApiError`. O AppContext fornece o token e encerra a sessão em um 401 autenticado. Uma resposta de uma sessão antiga não encerra uma sessão nova.

No Android e iOS, o token é armazenado com expo-secure-store quando o usuário marca manter conectado. No navegador ele fica na memória. Mock e real usam chaves diferentes, tanto para sessão quanto para dados locais.

## Integração pendente

`remoto.js` é o ponto reservado para as rotas da Pessoa 3. Por enquanto ele devolve `CONTRATO_PENDENTE`; não existem rotas de produção inventadas. Para testes, `criarApi` aceita uma função `remoto` injetada.

Essa função recebe `(acao, args, { request, itemId })`. Ela deverá usar o contrato publicado para decidir rota, método, corpo e leitura da resposta. `montarUploadFoto` prepara o binário, mas os nomes das partes do multipart devem ser conferidos com o contrato antes de ligar a rota.

`apiState.js` recebe dados já normalizados pelo adaptador: `alteracoes` para atualizar entidades por id e `removidos` para excluir ids. `usuario`, `token`, `termosAceitos` e `aceite` são retornos internos usados pela sessão. Esses nomes não definem o formato do servidor: a conversão de seu contrato pertence ao adaptador.

## Offline

`salvarRdo` preserva o rascunho local antes de tentar enviar. A submissão salva RDO, fotos e submissão nessa ordem. A fila contém `{ id, acao, args, criadoEm, tentativas, userId }` e permanece no aparelho até a confirmação. Uma falha interrompe a fila sem descartar o item. Ao mudar de usuário, os itens de outra pessoa não são enviados.

Cada item mantém seu id nas tentativas. Quando o contrato estiver disponível, esse id deve ser mapeado ao mecanismo de idempotência previsto pelo servidor, para tratar uma confirmação perdida sem duplicar uma operação.

As imagens nativas recebem uma cópia na pasta de documentos antes do enfileiramento. O progresso exibido na tela de fotos continua sendo responsabilidade da Pessoa 4.

## Telas

Login, recuperação e termos ainda usam as telas anteriores. A lógica de serviço está preparada; a integração das telas será feita pela Pessoa 2 após a liberação de auth pela Pessoa 1, preservando index.js e styles.js. Os controles de demonstração de outras telas ficam com a Pessoa 6.
