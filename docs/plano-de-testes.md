# Plano de testes — lado operacional

Cobre os passos 1 a 4 do cenário principal de demonstração (seção 21 do documento da PLANENGEN): o operacional abre o
RDO do dia, preenche as 11 etapas, trabalha offline, anexa fotos e envia ao master. Também registra as evidências das
Issues abertas pela equipe.

## 1. Identificação da execução

| Campo                                   | Valor                                                             |
| --------------------------------------- | ----------------------------------------------------------------- |
| Responsável pela tarefa                 | Kauã Ferreira Aragão                                                            |
| Data da execução                        | 26/10/2026                                                    |
| Commit testado (`git log -1 --oneline`) | `________` (branch com as alterações do `useAcao` no operacional) |
| Aplicativo                              | Expo Go (SDK 57), modo mock                                       |
| Aparelho Android                        | modelo: Samsung S25                                 |
| Aparelho iOS                            | não testado: a equipe não tem aparelho Apple                      |
| Tela pequena usada                      | aparelho ou emulador (ex.: 360 × 640 dp): foi usado emulador                    |

### Limitações

- **iOS não foi testado.** Nenhum integrante da equipe tem iPhone, e o Expo Go no iOS só roda em aparelho físico
  (ou em Mac com simulador). Todos os casos da coluna iOS ficam como ➖ (não aplicável) por esse motivo.
- Consequências a considerar: permissões de câmera e galeria, biometria (Face ID, que o README já indica não funcionar
  no Expo Go do iOS), teclado, área segura e leitor de tela (VoiceOver) **não foram validados** no iOS.
- Os resultados deste plano valem para **Android**.

## 2. Preparação

1. `git checkout main`, `git pull`, `npm ci`, `npx expo start` e abrir no Expo Go.
2. Entrar como **João Ribeiro** (`operacional@planengen.com.br`, senha `123456`), que só enxerga a **Obra Alfa**.
3. Antes de cada bloco de testes, restaurar o cenário em **Mais → Configurações → Restaurar dados de demonstração**.
4. Para testar o isolamento entre obras, usar também `marcos@planengen.com.br` (Obra Beta e Obra Gama).
5. O seed muda de acordo com o dia da instalação. Confira no app quais RDOs existem na Obra Alfa (há um em rascunho e
   um devolvido) antes de criar o RDO do dia.

**Legenda do resultado:** ✅ passou · ❌ falhou · ⚠️ parcial · ➖ não aplicável · — a confirmar (ainda sem resultado informado).
Todo ❌ ou ⚠️ deve ter uma Issue (modelo na seção 11) citada na coluna _Evidência_.

## 3. Acesso e criação do RDO

| ID    | Caso                        | Passos                                                          | Resultado esperado                                                                        | Android | iOS | Evidência |
| ----- | --------------------------- | --------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------- | --- | --------- |
| OP-01 | Login do operacional        | Entrar com `operacional@planengen.com.br` / `123456`            | Abre o início do operacional                                                              | ✅      | ➖  |           |
| OP-02 | Isolamento por obra         | Abrir a aba Obras                                               | Só a Obra Alfa aparece (critério 6 da seção 18)                                           | ✅      | ➖  |           |
| OP-03 | Criar RDO do dia            | Em Meus RDOs ou no detalhe da obra, tocar em novo RDO para hoje | Abre o formulário na etapa A com obra, data e turno preenchidos                           | ✅      | ➖  |           |
| OP-04 | Alerta de duplicidade       | Criar outro RDO na mesma obra, data e turno                     | Aviso "Já existe um RDO nesta data" com as opções Abrir existente e Criar mesmo assim     | ✅      | ➖  |           |
| OP-05 | Reaproveitar o dia anterior | Criar RDO e escolher **Reaproveitar** quando perguntado         | Equipe, equipamentos, atividades e pendências abertas copiados; quantidades do dia vazias | ✅      | ➖  |           |
| OP-06 | Começar em branco           | Criar RDO e escolher **Começar em branco**                      | Formulário sem dados copiados                                                             | —       | ➖  |           |
| OP-07 | Falha ao criar              | Forçar erro (ex.: sessão inválida) e tentar criar               | Aviso "Não foi possível criar o RDO" com mensagem compreensível; a tela não trava         | —       | ➖  |           |

## 4. As 11 etapas do formulário

Em cada etapa, anotar se os dados digitados são mantidos ao avançar, voltar e reabrir o RDO.

| ID    | Etapa                     | O que preencher                                                      | Resultado esperado                                                       | Android | iOS | Evidência |
| ----- | ------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------- | --- | --------- |
| ET-A  | Identificação             | Conferir obra, data, turno e responsável                             | Dados corretos; data futura é recusada                                   | ✅      | ➖  |           |
| ET-B  | Condições climáticas      | Tempo por período; marcar chuva com início, fim e impacto            | Campos condicionais de chuva aparecem; horas paralisadas pedidas         | ✅      | ➖  |           |
| ET-C  | Mão de obra               | 12 trabalhadores distribuídos em funções, com horas                  | Total de trabalhadores calculado pelas funções, sem dupla contagem       | ✅      | ➖  |           |
| ET-D  | Equipamentos              | 3 equipamentos, um deles parado                                      | Equipamento parado exige motivo e horas paradas                          | ✅      | ➖  |           |
| ET-E  | Atividades executadas     | Ao menos uma atividade com serviço, unidade, quantidade e percentual | Percentual entre 0 e 100; opção "Dia sem produção" pede justificativa    | ✅      | ➖  |           |
| ET-FG | Materiais e qualidade     | Um recebimento de material e uma inspeção                            | Aviso se faltar nota ou romaneio; descrição da inspeção obrigatória      | ✅      | ➖  |           |
| ET-H  | Segurança e meio ambiente | Marcar "Sem incidentes" ou registrar um incidente                    | Aviso se nada for informado; incidente pede tipo e descrição             | ✅      | ➖  |           |
| ET-IJ | Ocorrências e visitas     | Uma ocorrência com horário e uma visita                              | Fato e horário obrigatórios; visitante e motivo obrigatórios             | ✅      | ➖  |           |
| ET-K  | Registro fotográfico      | Ver seção 6                                                          | Ver seção 6                                                              | ✅      | ➖  |           |
| ET-L  | Pendências e planejamento | Uma pendência com descrição e responsável                            | Descrição e responsável obrigatórios                                     | ✅      | ➖  |           |
| ET-M  | Revisão e envio           | Revisar o resumo, aceitar a declaração e assinar                     | Pendências listadas por etapa; botão de envio só habilita sem pendências | ✅      | ➖  |           |

## 5. Validações da seção 9

Provocar cada erro e conferir a mensagem. Cada linha vale para Android e iOS.

| ID    | Regra (seção 9)                   | Como provocar                                         | Mensagem ou comportamento esperado                                              | Android | iOS | Evidência |
| ----- | --------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------- | ------- | --- | --------- |
| VL-01 | Data futura                       | Escolher uma data depois de hoje                      | "A data do RDO não pode ser futura."                                            | ✅      | ➖  |           |
| VL-02 | Condição climática obrigatória    | Não informar o tempo em nenhum período                | "Informe a condição do tempo em pelo menos um período."                         | ✅      | ➖  |           |
| VL-03 | Chuva exige duração e impacto     | Marcar chuva sem horário ou sem impacto               | Erros de duração, impacto e horas paralisadas                                   | ✅      | ➖  |           |
| VL-04 | Fim da chuva depois do início     | Informar fim anterior ao início                       | "O fim da chuva deve ser posterior ao início."                                  | ✅      | ➖  |           |
| VL-05 | Mão de obra                       | Deixar a função vazia ou horas fora de 0 a 24         | Erros de função e de horas                                                      | ✅      | ➖  |           |
| VL-06 | Equipamento parado                | Marcar parado sem motivo e sem horas paradas          | Erros de motivo e de duração                                                    | ✅      | ➖  |           |
| VL-07 | Horas do equipamento              | Produtivas + paradas maiores que as disponíveis       | "horas produtivas + paradas excedem as horas disponíveis"                       | ✅      | ➖  |           |
| VL-08 | Atividade ou dia sem produção     | Não registrar atividade e não marcar dia sem produção | "Registre ao menos uma atividade ou marque Dia sem produção com justificativa." | ✅      | ➖  |           |
| VL-09 | Justificativa de dia sem produção | Marcar dia sem produção sem justificar                | "Dia sem produção: informe a justificativa."                                    | ✅      | ➖  |           |
| VL-10 | Legenda da foto                   | Anexar foto sem legenda                               | "A legenda é obrigatória."                                                      | ✅      | ➖  |           |
| VL-11 | Pendência                         | Pendência sem descrição ou sem responsável            | Erros de descrição e de responsável                                             | ✅      | ➖  |           |
| VL-12 | Bloqueio do envio                 | Tentar enviar com pendências obrigatórias             | Contagem "pendências obrigatórias impedem o envio"; botão desabilitado          | ✅      | ➖  |           |
| VL-13 | Submissão completa                | Corrigir todas as pendências                          | Banner "Tudo certo para enviar" e botão habilitado                              | ✅      | ➖  |           |

## 6. Fotos (RF-10)

| ID    | Caso                           | Passos                                        | Resultado esperado                                                  | Android | iOS | Evidência |
| ----- | ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------- | ------- | --- | --------- |
| FT-01 | Foto pela câmera               | Tocar em **Tirar foto** e aceitar a permissão | Foto entra na lista com data e hora; ou aviso "Câmera indisponível" | ✅      | ➖  |           |
| FT-02 | Foto pela galeria              | Tocar em **Galeria** e escolher até 6 imagens | Fotos entram na lista; ou aviso "Galeria indisponível"              | ✅      | ➖  |           |
| FT-03 | Imagem de exemplo              | Usar o atalho "Usar imagem de exemplo"        | Foto de exemplo adicionada (útil em emulador sem câmera)            | ✅       | ➖  |           |
| FT-04 | Permissão negada               | Negar a permissão de câmera ou galeria        | Mensagem compreensível, sem travar o formulário                     | ➖       | ➖  |           |
| FT-05 | Três fotos legendadas          | Anexar 3 fotos com legenda e local            | Cenário da seção 21: três fotos legendadas; sem avisos nas fotos    | ✅       | ➖  |           |
| FT-06 | Aviso de local e de quantidade | Foto sem local; RDO sem nenhuma foto          | Avisos "local não informado" e "recomendado: ao menos 3 fotos"      | ⚠️       | ➖  |           |
| FT-07 | Progresso de envio             | Enviar o RDO com fotos online                 | Tela de progresso com as fotos (RNF-02)                             | ➖       | ➖  |           |

## 7. Modo offline (RF-05, RNF-03)

Ativar em **Mais → Configurações → Sincronização e offline → Simular modo offline**. O indicador de conexão deve mostrar
"Offline".

| ID    | Caso                      | Passos                                                   | Resultado esperado                                                       | Android | iOS | Evidência |
| ----- | ------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------ | ------- | --- | --------- |
| OF-01 | Rascunho offline          | Com offline ativo, preencher parte do RDO e sair da tela | Rascunho salvo; o botão de salvamento mostra a hora do último salvamento | —       | ➖  |           |
| OF-02 | Persistência              | Fechar o app por completo e reabrir                      | O rascunho continua lá, sem perda de dados                               | —       | ➖  |           |
| OF-03 | Enviar offline            | Concluir o RDO e enviar ao master                        | Mensagem "Salvo no aparelho"; RDO marcado como pendente de sincronização | ✅      | ➖  |           |
| OF-04 | Fotos na fila             | Enviar offline um RDO com fotos                          | Fotos ficam na fila e continuam abrindo                                  | —       | ➖  |           |
| OF-05 | Estado da sincronização   | Abrir a tela Sincronização                               | Mostra o que ainda não foi enviado                                       | —       | ➖  |           |
| OF-06 | Sincronizar ao reconectar | Desativar "Simular modo offline"                         | Sincronização automática, aviso de conclusão e status do RDO atualizado  | ✅      | ➖  |           |
| OF-07 | Offline real              | Repetir OF-03 com o modo avião do aparelho               | Mesmo comportamento do modo simulado                                     | —       | ➖  |           |

## 8. Envio e notificação ao master

| ID    | Caso                    | Passos                                      | Resultado esperado                                                            | Android | iOS | Evidência |
| ----- | ----------------------- | ------------------------------------------- | ----------------------------------------------------------------------------- | ------- | --- | --------- |
| EN-01 | Enviar online           | Concluir o RDO completo e confirmar o envio | "RDO enviado ao master"; status passa a Enviado; abre o detalhe do RDO        | ✅      | ➖  |           |
| EN-02 | Bloqueio de edição      | Tentar editar o RDO já enviado              | Sem edição; só é possível editar se o master devolver                         | ✅       | ➖  |           |
| EN-03 | Master recebe o aviso   | Entrar como `master@planengen.com.br`       | O RDO aparece na aba Análise e há aviso com obra, RDO, status e acesso direto | ✅       | ➖  |           |
| EN-04 | Correção após devolução | Abrir o RDO devolvido, corrigir e reenviar  | Comentário do master visível; reenvio muda o status para Enviado              | ✅       | ➖  |           |

## 9. Telas pequenas e acessibilidade (RNF-01, RNF-05)

Repetir os casos OP-03, ET-A a ET-M, FT-01 e EN-01 em tela pequena.

| ID    | Critério                              | Resultado esperado                                       | Resultado | Evidência |
| ----- | ------------------------------------- | -------------------------------------------------------- | --------- | --------- |
| TP-01 | Texto e botões                        | Nada cortado ou sobreposto em nenhuma etapa              | ✅        |           |
| TP-02 | Teclado aberto                        | O campo em edição e o botão principal continuam visíveis | ✅        |           |
| TP-03 | Rolagem                               | Todo o conteúdo é alcançável; barra de etapas navegável  | ✅        |           |
| TP-04 | Rodapé fixo                           | Botões Voltar, Avançar e Enviar não cobrem o conteúdo    | ✅        |           |
| TP-05 | Tamanho de toque                      | Botões e ícones tocáveis sem erros                       | ✅        |           |
| TP-06 | Fonte maior do sistema                | Com texto ampliado, o layout continua legível            | —         |           |
| TP-07 | Leitor de tela (TalkBack e VoiceOver) | Botões e campos têm rótulo e são lidos na ordem correta  | —         |           |

## 10. Resumo da execução

Todos os casos de iOS estão como ➖ (sem aparelho). Os números abaixo contam os resultados do Android.

| Bloco                 | Casos | ✅  | ❌  | ⚠️  | A confirmar |
| --------------------- | ----- | --- | --- | --- | ----------- |
| Acesso e criação (OP) | 7     | 5   | 0   | 0   | 2           |
| Etapas (ET)           | 11    | 11  | 0   | 0   | 0           |
| Validações (VL)       | 13    | 13  | 0   | 0   | 0           |
| Fotos (FT)            | 7     | 4   | 0   | 1   | 2           |
| Offline (OF)          | 7     | 2   | 0   | 0   | 5           |
| Envio e master (EN)   | 4     | 4   | 0   | 0   | 0           |
| Telas pequenas (TP)   | 7     | 5   | 0   | 0   | 2           |

### Observações da execução

- Os testes foram feitos no Android, na branch com as alterações do `useAcao` no operacional.
- Confirmados: login do operacional, isolamento por obra, criação do RDO, alerta de duplicidade, reaproveitar o dia
  anterior, as 11 etapas, as validações, fotos pela câmera e pela galeria, offline com envio ao voltar a conexão, envio
  ao master e telas pequenas sem problemas de layout. Também foram testados o cadastro e a edição de obras pelo master
  (fora dos casos deste plano).
- Os demais casos estão como "—" porque ainda não têm resultado informado. Marque ✅ ou ❌ conforme forem confirmados.
- Nenhum problema novo foi encontrado nestes testes, então nenhuma Issue nova foi aberta. As Issues #4, #5 e #6 já
  estão corrigidas (seção 12).
- Não foram anexados prints de evidência (não foi possível capturá-los no momento do preenchimento).

## 11. Como registrar um problema

Abrir uma Issue por problema, com este modelo, e citar o número dela na coluna _Evidência_:

```
Título: [Kauã] Tela ou etapa: o que acontece
Ambiente: Android ou iOS, aparelho e versão, usuário usado, commit
Passos:
1. ...
2. ...
Resultado esperado:
Resultado obtido:
Gravidade: bloqueante / alta / média / baixa
Print ou vídeo:
```

## 12. Evidências das Issues da equipe

| Issue | Título                                                                                   | Causa                                                    | Correção                                             | Verificado em (data, sistema, usuário) | Situação               |
| ----- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------------------------- | -------------------------------------- | ---------------------- |
| #4    | Login: "Não foi possível concluir" porque `src/services/api/mock.js` está vazio na main  | Módulo `mock.js` vazio                                   | Commit `29d100a` (PR #8): módulos da API preenchidos | Android; data e usuário a confirmar    | Corrigida e verificada |
| #5    | Configurações: "Restaurar dados de demonstração" falha com "undefined is not a function" | Ações sem função correspondente na camada `services/api` | Commit `29d100a` (PR #8)                             | Android; data e usuário a confirmar    | Corrigida e verificada |
| #6    | (preencher o título exato)                                                               | Mesma causa da #5                                        | Commit `29d100a` (PR #8)                             | Android; data e usuário a confirmar    | Corrigida e verificada |
|       |                                                                                          |                                                          |                                                      |                                        |                        |

Situações possíveis: aberta, corrigida e verificada, corrigida e não verificada, reaberta.

## 13. Referências

- Seção 9 (regras de negócio e validações), seção 18 (critérios de aceite) e seção 21 (cenário principal).
- RF-05 (etapas, salvamento automático e offline), RF-10 (fotos), RNF-01 a RNF-05 (responsividade, desempenho, offline,
  simplicidade e acessibilidade).
- Dados de demonstração: README, seção "Usuários de demonstração".
