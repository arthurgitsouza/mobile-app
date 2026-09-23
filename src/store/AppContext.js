import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import { ACTIONS } from './actions.js';
import { loadState, persistState, flushPersist } from './persistence.js';
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

  useEffect(() => {
    let vivo = true;
    (async () => {
      const salvo = await loadState();
      const inicial = salvo
        ? { ...salvo, session: { ...sessaoInicial(), ...salvo.session } }
        : { ...gerarSeed(), session: sessaoInicial() };
      ref.current = inicial;
      if (!salvo) persistState(null, inicial);
      if (vivo) setState(inicial);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  // Garante que nada fique sem gravar quando o app vai para segundo plano (ex.: abrir a câmera).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s) => {
      if (s !== 'active') flushPersist();
    });
    return () => sub.remove();
  }, []);

  const commit = useCallback((next) => {
    const prev = ref.current;
    ref.current = next;
    persistState(prev, next);
    setState(next);
  }, []);

  // actions.<nome>(args) aplica a transformação pura sobre o estado mais recente e devolve o novo estado.
  const actions = useMemo(() => {
    const out = {};
    Object.entries(ACTIONS).forEach(([name, fn]) => {
      out[name] = (args = {}) => {
        const next = fn(ref.current, args);
        if (next !== ref.current) commit(next);
        return ref.current;
      };
    });
    return out;
  }, [commit]);

  const currentUser = state ? state.users.find((u) => u.id === state.session.userId && u.ativo) || null : null;
  const realOnline = net.isConnected !== false && net.isInternetReachable !== false;
  const online = !!state && !state.settings.forceOffline && realOnline;

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
