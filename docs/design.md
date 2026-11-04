# Design do app

## Decisões visuais

- Cores:
  - Principal (cabeçalho, botão principal, títulos): #17375E
  - Destaque (linha do cabeçalho, botão de ação, assinaturas): #D9A441
  - Fundo da tela: #F3F6FA
  - Cartão: #FFFFFF
  - Borda: #D7E0EB
  - Texto: #14253B
  - Texto secundário: #4E617A
  - Sucesso: #1B6E45
  - Alerta: #9A4F00
  - Perigo: #B0281C
  - Informação: #0A5F99
- Tipografia: fonte do sistema, sem fonte personalizada. Android: Roboto. iOS: San Francisco. Hashes: Menlo (iOS) e monospace (Android). Pesos 400, 500, 700 e 800. Tamanhos 30, 24, 19, 16, 15, 13 e 12; texto corrido 15 com linha 22.
- Espaçamentos: escala 4, 8, 12, 16, 20, 24 e 32. Margem da tela 16, espaço interno do cartão 16, espaço entre itens 8 ou 12. Raios 8, 12, 16 e 22.
- Cartões: fundo #FFFFFF, borda 1 em #D7E0EB, raio 16, espaço interno 16, sombra leve (opacidade 0,06, desfoque 6, deslocamento 2).
- Botões: altura 40, 50 ou 56, raio 12, borda 1,5, texto em negrito. Principal: fundo #17375E, texto #FFFFFF. Destaque: fundo #D9A441, texto #0C2038. Secundário: fundo #FFFFFF, borda e texto #17375E. Desabilitado: opacidade 0,45.

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
- Decisão: manter a paleta de cores atual do app. As cores da marca (#010028, #0084F4, #EEF0F2, #202020) ficam registradas aqui como referência para uma evolução futura.
- As fontes da marca (Codec Cold Trial e Gadugi) não foram aplicadas: a primeira tem licença de teste e a segunda só existe no Windows.
- Informações de protótipo (textos de demonstração, dados fictícios) ficam visíveis apenas no modo demo (EXPO_PUBLIC_DEMO). Fora dele, o app mostra só o que é de uso real.