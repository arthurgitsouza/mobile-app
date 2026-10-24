import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { criarApi } from '../services/api/index.js';
import { criarCliente } from '../services/api/client.js';
import { preservarFotos } from '../services/api/arquivos.js';
import { env } from '../config/env.js';
import { loadState, persistState, flushPersist } from './persistence.js';
import { estadoServidorVazio } from './apiState.js';
import { sessaoSegura } from './tokenStorage.js';
import { gerarSeed } from '../data/seed.js';
import { uid } from '../utils/format.js';

const AppContext = createContext(null);

function sessaoInicial() {
  return { userId: null, ultimoUserId: null, manter: false, biometria: {}, termosAceitos: {}, deviceId: uid('dev') };
}

export function AppProvider({ children }) {
  const [state, setState] = useState(null);
  const ref = useRef(null);
  const net = useNetInfo();
  const rede = useRef(true);
  useEffect(() => {
    rede.current = net.isConnected !== false && net.isInternetReachable !== false;
  }, [net.isConnected, net.isInternetReachable]);

  const commit = useCallback((next) => {
    const prev = ref.current;
    ref.current = next;
    persistState(prev, next);
    setState(next);
  }, []);

  const actions = useMemo(() => {
    let api;
    const request = criarCliente({
      baseURL: env.API_URL,
      getToken: sessaoSegura.getToken,
      onUnauthorized: (token) => (token === sessaoSegura.getToken() ? api.sair() : undefined),
    });
    api = criarApi({
      getState: () => ref.current,
      commit,
      sessao: sessaoSegura,
      request,
      isOnline: () => rede.current && !ref.current?.settings.forceOffline,
      persistir: () => flushPersist({ strict: true }),
      preservarRdo: preservarFotos,
      onError: (erro) => {
        if (ref.current)
          commit({
            ...ref.current,
            apiError: {
              mensagem: erro.mensagem,
              codigo: erro.codigo,
              id: uid('erro'),
            },
          });
      },
    });
    return api;
  }, [commit]);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const salvo = await loadState();
      let inicial = salvo
        ? { ...salvo, session: { ...sessaoInicial(), ...salvo.session }, filaOffline: salvo.filaOffline || [] }
        : env.USE_MOCK
          ? { ...gerarSeed(), session: sessaoInicial(), filaOffline: [] }
          : estadoServidorVazio(sessaoInicial());
      inicial.session.deviceLabel =
        Platform.OS === 'android'
          ? `Android (API ${Platform.Version})`
          : `${Platform.OS} ${Platform.Version || ''}`.trim();
      try {
        const token = await sessaoSegura.restaurar();
        if (!token || !inicial.session.manter) {
          inicial = { ...inicial, session: { ...inicial.session, userId: null } };
          await sessaoSegura.limpar();
        }
      } catch {
        inicial = {
          ...inicial,
          session: { ...inicial.session, userId: null },
          apiError: {
            id: uid('erro'),
            mensagem: 'Não foi possível restaurar a sessão. Entre novamente.',
          },
        };
      }
      if (!vivo) return;
      ref.current = inicial;
      persistState(null, inicial);
      setState(inicial);
      if (!env.USE_MOCK && sessaoSegura.getToken()) {
        try {
          await actions.restaurarSessao();
        } catch {
          // O aviso global informa a falha; os dados locais continuam disponíveis.
        }
      }
    })();
    return () => {
      vivo = false;
    };
  }, [actions]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') flushPersist();
    });
    return () => sub.remove();
  }, []);

  const currentUser = state ? state.users.find((u) => u.id === state.session.userId && u.ativo) || null : null;
  const online =
    !!state && !state.settings.forceOffline && net.isConnected !== false && net.isInternetReachable !== false;
  const value = useMemo(
    () => ({ state, actions, currentUser, online, hydrated: !!state, getState: () => ref.current }),
    [state, actions, currentUser, online],
  );
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de <AppProvider>');
  return ctx;
}
