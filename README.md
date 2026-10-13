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

## Estrutura

```text
src/
  components/   peças reutilizáveis: ui, form, charts, rdo
  screens/      telas por área: auth, home, obras, rdo, analysis, docs, admin, reports, academic
  domain/       regras de negócio puras (fluxo, validações, permissões) — testadas em tests/
  store/        estado global e ações (store/actions.js vira chamadas de API no back-end)
  services/     câmera, galeria, arquivos/PDF e biometria
  data/         dados de demonstração (seed)
  theme/        cores, espaçamentos e tipografia
  utils/        datas, formatação, hash SHA-256, PDF, CSV
```

Cada tela e componente fica numa pasta com `index.js` (estrutura) e `styles.js` (estilo), padrão definido com o
professor. A conversão está em andamento.

## Como contribuir

1. Atualize a `main` e crie uma branch por tarefa, com o seu número: `p4/teclado-etapa-clima`.
2. Edite só as pastas de que você é dono; para mexer na pasta de outra pessoa, combine antes no grupo.
3. Antes do PR: `npm run format`, `npm test` e `npm run lint` sem erros. O GitHub Actions roda os mesmos passos.
4. PR pequeno, de uma pasta ou um assunto, com print quando mudar tela. Só entra na `main` com uma revisão aprovada.

## Limitações conhecidas

- Não há back-end: os dados ficam no aparelho (AsyncStorage) e voltam ao seed ao restaurar a demonstração.
- Push, e-mail e WhatsApp são simulados; hash, data/hora e IP das assinaturas são calculados no aparelho.
- O Face ID não funciona no Expo Go do iOS; no Android a biometria funciona.
- Os textos de declaração e de ciência do cliente são exemplos e precisam ser validados pelo solicitante.
- O lint mostra avisos (regras do React Compiler e variáveis sem uso) que cada dono de pasta vai resolvendo.
