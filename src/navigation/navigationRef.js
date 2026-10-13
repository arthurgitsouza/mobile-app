import { createNavigationContainerRef } from '@react-navigation/native';

// Permite navegar a partir de fora das telas (ex.: toque em uma notificação "push" simulada).
export const navigationRef = createNavigationContainerRef();

export function navegar(nome, params) {
  if (navigationRef.isReady()) navigationRef.navigate(nome, params);
}
