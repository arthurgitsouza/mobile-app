# API do RDO Mobile (back-end)

Servidor Node (Express) que implementa as rotas do [`docs/api.md`](../docs/api.md) usando o **Supabase**
(PostgreSQL, Auth e Storage). Ele substitui o servidor falso (`scripts/mock-server.js`) sem mudar o app.

```text
App (Expo)  →  API (esta pasta, /api/v1)  →  Supabase (banco, login e fotos)
```

## Rodar no computador

1. Copie `server/.env.example` para `server/.env` e preencha com as chaves do Supabase
   (**Project Settings → API**). O `.env` não vai para o GitHub.
2. Instale e rode:

   ```bash
   cd server
   npm install
   npm run dev
   ```

3. Teste: abra `http://localhost:3001/api/v1/health`. Deve aparecer `"banco": "conectado"`.

## Ligar o app a esta API

No `.env` da raiz do app:

```text
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001/api/v1
```

No celular, use o IP do computador na rede (não `localhost`), com os dois no mesmo Wi-Fi.
Depois de publicada, use a URL do Render.

## Estrutura

```text
server/
  src/
    index.js            inicia o servidor
    app.js              Express, CORS, /api/v1/health e tratamento de erros
    config.js           variáveis de ambiente
    supabase.js         clientes do Supabase: db (service_role) e auth (anon)
    erros.js            erros no formato do app: { codigo, mensagem, campos }
    mapear.js           snake_case do banco ↔ camelCase da API
    middleware/
      autenticar.js     confere o token e carrega req.usuario; exigirPerfil('master', …)
    rotas/              uma pasta de rotas por área, com as 73 rotas do contrato
  test/                 testes (npm test), rodam sem banco
  sql/                  schema.sql e seed.sql do banco (Francisco e Kauã)
```

Cada rota ainda não feita responde `501 NAO_IMPLEMENTADO`. Para implementar, troque `pendente(...)`
pela função, como em `rotas/auth.js` (login, sessão e logout já estão prontos e servem de exemplo).

## O que o banco precisa ter para o login funcionar

- Os usuários criados no **Supabase Auth** (Authentication → Users), com e-mail e senha.
- Uma tabela `usuarios` com as colunas do `docs/modelo-de-dados.md` em snake_case, mais
  `auth_id uuid` (o id do usuário no Supabase Auth) e `termos_aceitos jsonb`.

## Publicar no Render (grátis)

1. Em [render.com](https://render.com), **New → Web Service** e escolha este repositório.
2. **Root Directory:** `server` · **Build Command:** `npm install` · **Start Command:** `npm start`.
3. Em **Environment**, cadastre as mesmas variáveis do `.env`.
4. Ao terminar, a URL da API fica `https://NOME.onrender.com/api/v1`.

## Regras

- A chave `service_role` só existe aqui no servidor e nas variáveis do Render. Nunca no app nem no GitHub.
- A senha nunca é guardada nem devolvida pela API; quem cuida dela é o Supabase Auth.
- Toda rota confere o perfil e o vínculo com a obra (`docs/regras-de-negocio.md`, seção 2).
