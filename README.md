# RDO Mobile

Aplicativo de Registro Diário de Obra (RDO): o operacional preenche o registro no canteiro pelo celular, o master valida e
assina, e o cliente dá ciência ou registra ressalva. No fim sai um PDF com trilha de auditoria e hash de verificação.

Projeto acadêmico da UNDB (Engenharia Civil) a partir do documento de solicitação da PLANENGEN. Esta versão é só o
front-end: os dados são fictícios e ficam no próprio aparelho.

## Como rodar

Requisitos: Node.js 22 ou mais novo e o app **Expo Go** no celular (SDK 57).

```bash
npm ci
npx expo start
```

Escaneie o QR code com o Expo Go; o celular precisa estar no mesmo Wi-Fi do computador. Se a rede bloquear a conexão,
use `npx expo start --tunnel`. Para abrir no navegador, `npm run web`.

## Usuários de demonstração

Todos usam a senha `123456`. A tela de login também tem acesso rápido aos três perfis e o roteiro de demonstração
(seção 21 do documento).

| Perfil      | Nome                 | E-mail                       | Obras                |
| ----------- | -------------------- | ---------------------------- | -------------------- |
| Master      | Eng. Carlos Lima     | master@planengen.com.br      | todas                |
| Operacional | João Ribeiro         | operacional@planengen.com.br | Obra Alfa            |
| Operacional | Marcos Vinícius      | marcos@planengen.com.br      | Obra Beta, Obra Gama |
| Operacional | Ana Beatriz Costa    | ana@planengen.com.br         | Obra Beta            |
| Cliente     | Fernanda Albuquerque | cliente@horizonte.com.br     | Obra Alfa            |
| Cliente     | Roberto Campos       | roberto@pontadaareia.com.br  | Obra Beta            |
| Cliente     | Paula Nogueira       | paula@saudeviva.org.br       | Obra Gama            |

Para voltar ao cenário inicial: **Mais → Configurações → Restaurar dados de demonstração**.

## Comandos

| Comando          | O que faz                                                   |
| ---------------- | ----------------------------------------------------------- |
| `npm start`      | Inicia o Expo (QR code para o Expo Go)                      |
| `npm run web`    | Abre o app no navegador                                     |
| `npm test`       | Roda os testes das regras de negócio (`tests/`)             |
| `npm run lint`   | ESLint + Prettier; erro de formatação também falha          |
| `npm run format` | Formata o código com o Prettier (rode antes de abrir um PR) |


