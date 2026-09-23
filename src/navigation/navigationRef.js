import { createNavigationContainerRef } from '@react-navigation/native';

// Permite navegar a partir de fora das telas (ex.: toque em uma notificação "push" simulada).
export const navigationRef = createNavigationContainerRef();

// TEMP-TEST (remover): permite navegar por console nos testes manuais no navegador.
if (typeof window !== 'undefined' && typeof __DEV__ !== 'undefined' && __DEV__) window.__nav = navigationRef;

export function navegar(nome, params) {
  if (navigationRef.isReady()) navigationRef.navigate(nome, params);
}
