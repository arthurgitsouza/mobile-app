# Design do app

## Decisões visuais

- Cores:
  - Principal (cabeçalho, botão principal, títulos): #0B5BC4
  - Destaque (linha do cabeçalho, botão de ação, assinaturas): #D9A441
  - Fundo da tela: #EEF0F2
  - Cartão: #FFFFFF
  - Borda: #D7E0EB
  - Texto: #202020
  - Texto secundário: #4E617A
  - Sucesso: #1B6E45
  - Alerta: #9A4F00
  - Perigo: #B0281C
  - Informação: #0A5F99
- Tipografia: fonte do sistema, sem fonte personalizada. Android: Roboto. iOS: San Francisco. Hashes: Menlo (iOS) e monospace (Android). Pesos 400, 500, 700 e 800. Tamanhos 30, 24, 19, 16, 15, 13 e 12; texto corrido 15 com linha 22.
- Espaçamentos: escala 4, 8, 12, 16, 20, 24 e 32. Margem da tela 16, espaço interno do cartão 16, espaço entre itens 8 ou 12. Raios 8, 12, 16 e 22.
- Cartões: fundo #FFFFFF, borda 1 em #D7E0EB, raio 16, espaço interno 16, sombra leve (opacidade 0,06, desfoque 6, deslocamento 2).
- Botões: altura 40, 50 ou 56, raio 12, borda 1,5, texto em negrito. Principal: fundo #0B5BC4, texto #FFFFFF. Destaque: fundo #D9A441, texto #010028. Secundário: fundo #FFFFFF, borda e texto #0B5BC4. Desabilitado: opacidade 0,45.

<details>
<summary>Sugestão de tipografia (opcional, não aplicada)</summary>

- Fonte: Inter nos dois sistemas, para o app ficar igual no Android e no iOS.
- Pesos: 400, 500, 700 e 800, os mesmos que o app já usa.
- Exige instalar o pacote `@expo-google-fonts/inter` e carregar as fontes no `App.js`; combinar antes com a Thai e com o dono do repositório.

</details>

## Divisão das telas

- Thai: login, painéis, obras, formulário do RDO; estrutura de screens/rdo, obras e reports
- Luís: detalhe do RDO, análise, assinaturas, PDF, notificações, gestão; estilos inline de components

## Quem edita o quê

- src/theme e src/components/ui: Luís
- screens/rdo: Thai, até avisar "liberei" no grupo

## Identidade visual da Planengen

- O app usa o logo da Planengen na tela de login (assets/logo-planengen.png), na versão clara, própria para fundo escuro.
- Cores oficiais da marca (PDF de identidade visual): azul escuro #010028, azul #0084F4, cinza claro #EEF0F2 e cinza escuro #202020.
- Decisão (pedido do professor): o azul do app passa a ser um tom mais claro, próximo do azul oficial, com variações de azul. Só os valores do tema (src/theme/index.js) mudaram; os nomes dos tokens foram mantidos.
- O azul oficial #0084F4 com texto branco tem contraste de 3,75:1, abaixo do mínimo de 4,5:1 para texto pequeno. Por isso ele fica para ícones e áreas grandes (ícone do app), e o cabeçalho e os botões usam #0B5BC4.

| Token (src/theme/index.js) | Antes                  | Agora                | Uso                                                 |
| -------------------------- | ---------------------- | -------------------- | --------------------------------------------------- |
| navy900                    | #0C2038                | #010028              | Azul escuro oficial: sombras e textos sobre dourado |
| navy800                    | #11294A                | #06308A              | Tom intermediário escuro                            |
| navy700                    | #17375E                | #0B5BC4              | Cabeçalho, botões principais e aba ativa            |
| navy600                    | #1F4E79                | #0066C4              | Rótulos, ícones e destaques                         |
| blue500                    | #2F6FB3                | #0066C4              | Links e textos azuis pequenos                       |
| blue200                    | #B9D3EE                | #B3D9FC              | Variação clara                                      |
| blue100                    | #E3EEFB                | #DCEEFE              | Fundos de destaque                                  |
| blue50                     | #F1F6FC                | #EEF5FD              | Fundos suaves                                       |
| bg                         | #F3F6FA                | #EEF0F2              | Cinza claro oficial                                 |
| text                       | #14253B                | #202020              | Cinza escuro oficial                                |
| textSubtle                 | #71849C                | #5A6C85              | Textos de apoio (contraste 4,7:1 sobre o fundo)     |
| textOnDarkMuted            | #B7C7DC                | #DCEEFE              | Subtítulo do cabeçalho (5,4:1)                      |
| overlay                    | rgba(12, 32, 56, 0.55) | rgba(1, 0, 40, 0.55) | Fundo escurecido de janelas                         |

- O dourado (gold500 e variações) não faz parte da marca. Foi mantido só como acento de aprovações e assinaturas e no filete do cabeçalho. Pode ser trocado por azul se o professor pedir.
- As fontes da marca (Codec Cold Trial e Gadugi) não foram aplicadas: a primeira tem licença de teste e a segunda só existe no Windows.
- Informações de protótipo (textos de demonstração, dados fictícios) ficam visíveis apenas no modo demo (EXPO_PUBLIC_DEMO). Fora dele, o app mostra só o que é de uso real.
