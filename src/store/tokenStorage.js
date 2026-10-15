import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { criarSessaoSegura } from './session.js';
import { env } from '../config/env.js';

const chave = env.USE_MOCK ? '.mock' : '.real';
const memoria = {
  getItemAsync: async () => null,
  setItemAsync: async () => {},
  deleteItemAsync: async () => {},
};

// No navegador, a sessão dura até fechar ou recarregar a página.
const storage =
  Platform.OS === 'web'
    ? memoria
    : {
        getItemAsync: (key) => SecureStore.getItemAsync(key + chave),
        setItemAsync: (key, value) => SecureStore.setItemAsync(key + chave, value),
        deleteItemAsync: (key) => SecureStore.deleteItemAsync(key + chave),
      };

export const sessaoSegura = criarSessaoSegura(storage);
