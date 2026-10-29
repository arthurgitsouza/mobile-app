# Como separar "HTML e CSS" no React Native

Cada tela e cada componente vira uma pasta com dois arquivos: `index.js` para a
estrutura e `styles.js` para a aparência. No React Native não existe HTML nem
CSS; o equivalente é o JSX (estrutura) e o `StyleSheet` (estilo).

```
src/screens/auth/LoginScreen/
  index.js    ← estrutura: JSX, estado e lógica da tela   (o "HTML")
  styles.js   ← aparência: StyleSheet.create               (o "CSS")
```

## Exemplo

```js
// styles.js
import { StyleSheet } from 'react-native';
import { colors } from '../../../theme';

export const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  hero: { backgroundColor: colors.navy700, alignItems: 'center' },
});

// Valores que dependem do aparelho (ex.: área segura) viram funções aqui mesmo.
export const dinamico = {
  hero: (topo) => ({ paddingTop: topo + 28 }),
};

// index.js
import { styles, dinamico } from './styles';
// ...
<View style={[styles.hero, dinamico.hero(insets.top)]} />;
```

Exemplo real com tabelas de aparência: `src/components/ui/Button`.

## Regras

1. O `index.js` não tem `StyleSheet.create` nem `style={{ … }}`; só usa
   `styles.x` ou `dinamico.x(valor)`.
2. Cores, espaços e fontes continuam vindo de `src/theme`; nada de repetir valores.
3. Tabelas de aparência também vão para `styles.js` (ex.: `VARIANTS` e `SIZES`
   do `Button`, `TONES` do `Card`).
4. Arquivo com vários componentes vira uma pasta por componente.
5. Os `index.js` que reexportam cada pasta (`components/ui/index.js` etc.)
   continuam. Como `import X from './auth/LoginScreen'` encontra a pasta
   sozinho, nenhuma outra tela precisa mudar o import.
6. Só mover código: nada de mudar comportamento, nomes ou props no mesmo PR.

## Como converter um arquivo

1. Crie a pasta com o nome do arquivo e mova o arquivo para dentro como
   `index.js`, com `git mv`, para manter o histórico.
2. Leve o `StyleSheet.create` e as tabelas de aparência para `styles.js`
   (`export const styles`).
3. Troque cada `style={{ … }}` por um nome que descreva o papel do elemento
   (`styles.cartao`, não `styles.gap10`). Valores iguais reaproveitam o mesmo nome.
4. Valor que só se sabe em tempo de execução vira função em `dinamico`.
5. Ajuste os imports relativos: a pasta nova está um nível mais fundo
   (`'../../theme'` vira `'../../../theme'`).
6. Remova imports que ficaram sem uso e rode `npm run lint -- --fix`.

## Como conferir

- `npm test` e `npm run lint` passam.
- Nenhum `index.js` de tela ou componente contém `StyleSheet.create`,
  `style={{` ou `contentContainerStyle={{`.
- O app abre no Expo Go e a tela convertida está igual ao antes.