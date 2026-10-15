# Servidor falso para integração (Etapa 2)

Implementação em `scripts/mock-server.js`, sem dependências adicionais, para Node >=22. Lê `docs/exemplos/*.json` na inicialização. **Somente desenvolvimento:** login e tokens fictícios, dados em memória, sem segurança, persistência ou envio real de mensagens. Não expor na internet.

## Executar

Na raiz do projeto: `node scripts/exportar-seed.js` (se precisar regenerar os exemplos), depois `node scripts/mock-server.js`. Porta padrão `3001`; personalizar com `MOCK_PORT`. Verificar `GET http://localhost:3001/api/v1/health`.

O aplicativo deve usar `USE_MOCK=false` **e** apontar `EXPO_PUBLIC_API_URL` para `http://SEU_IP_LOCAL:3001` (ou ajustar a variável ao que a Pessoa 2 efetivamente implementou). Em celular físico, `localhost` aponta para o próprio celular: use o IP LAN do computador, com celular e computador na mesma rede e firewall liberando a porta. As rotas estão sob `/api/v1`.

## Login fictício

`POST /api/v1/auth/login` com `{ "email": "master@planengen.com.br", "senha": "123456", "manter": true }`. O e-mail precisa existir em `docs/exemplos/usuarios.json`; todos os usuários ativos usam **somente no mock** a senha fictícia `123456`. Use `Authorization: Bearer <token retornado>` nas outras chamadas. Tokens duram enquanto o processo estiver ativo.

## Cobertura implementada

- `GET /health`; `POST /auth/login`, `GET /auth/sessao`, `POST /auth/logout`.
- `GET /obras`, `GET /obras/:id` com visibilidade por perfil e filtros de status/cliente.
- `GET /rdos`, `GET /rdos/:id`, `GET /rdos/:id/auditoria`, `GET /rdos/:id/comentarios`, `GET /rdos/:id/assinaturas`. Filtros RF-16, paginação e resumo de RDO.
- `GET /notificacoes`, `PATCH /notificacoes/:id`, `POST /notificacoes/marcar-todas-lidas`.
- Consultas auxiliares: `GET /usuarios`, `/clientes`, `/empresa`, `/catalogos`, `/configuracoes`, `/auditoria`, `/academico` (algumas restritas a master).
- Erros simulados: 400 JSON inválido, 401 sem token/login inválido, 403 usuário bloqueado/rota restrita, 404 recurso não visível, 422 marcação inválida, 501 rota não implementada.

## Limites e pendências

Não implementa o contrato inteiro: criação/edição/transições de RDO, fotos multipart, segundo fator, validação de domínio, assinaturas, push/e-mail, exportações e demais escritas **não são simuladas**; retornam `501 NAO_IMPLEMENTADO`. A Pessoa 2 deve validar essas integrações posteriormente contra um back-end real ou expandir este mock. O estado de notificações reinicia ao reiniciar o servidor. A visibilidade de cliente usa vínculos disponíveis no seed; confirmar o vínculo definitivo com a Pessoa 2. `USE_MOCK=false` não é suficiente por si só: a camada HTTP da Pessoa 2 deve estar configurada para usar `EXPO_PUBLIC_API_URL` e `/api/v1`.

## Teste rápido no PowerShell

```powershell
$base = 'http://localhost:3001/api/v1'
Invoke-RestMethod "$base/health"
$login = Invoke-RestMethod "$base/auth/login" -Method Post -ContentType 'application/json' -Body '{"email":"master@planengen.com.br","senha":"123456"}'
$h = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod "$base/obras" -Headers $h
Invoke-RestMethod "$base/rdos?status=rascunho&pagina=1&porPagina=5" -Headers $h
Invoke-RestMethod "$base/notificacoes" -Headers $h
```
