import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useApp } from './AppContext';
import { useUI } from '../components/ui';
import { notificacoesDe } from '../domain/selectors';
import { TIPOS_NOTIFICACAO } from '../domain/notificacoes';
import { contar } from '../utils/format';
import { navegar } from '../navigation/navigationRef';

// Observadores globais (sem UI): sincronização ao reconectar, lembretes e "push simulado".
export default function AppWatchers() {
  const { state, actions, online, currentUser } = useApp();
  const { toast } = useUI();

  // 1. Sincronização: ao ficar online com RDOs pendentes, envia (progresso simulado de ~1,8 s).
  const pendentes = state ? state.rdos.filter((r) => r.sync?.pendente).length : 0;
  useEffect(() => {
    if (!online || pendentes === 0) return undefined;
    const t = setTimeout(() => {
      actions.sincronizarPendentes();
      toast.show({ type: 'success', title: 'Conexão restabelecida', message: `${contar(pendentes, 'RDO')} sincronizado${pendentes > 1 ? 's' : ''} com o servidor.` });
    }, 1800);
    return () => clearTimeout(t);
  }, [online, pendentes, actions, toast]);

  // 2. Lembretes e escalonamento (seção 5): ao abrir, a cada minuto e ao voltar ao primeiro plano.
  useEffect(() => {
    actions.processarLembretes();
    const i = setInterval(() => actions.processarLembretes(), 60000);
    const sub = AppState.addEventListener('change', (s) => s === 'active' && actions.processarLembretes());
    return () => {
      clearInterval(i);
      sub.remove();
    };
  }, [actions]);

  // 3. Push simulado: avisa (toast) quando chega notificação nova para o usuário logado.
  const vistas = useRef(null);
  const userId = currentUser?.id;
  const termosOk = !!(state && currentUser && state.session.termosAceitos?.[currentUser.id]);
  useEffect(() => {
    // Só avisa depois do login completo (termos aceitos), quando a central de notificações já está acessível.
    if (!state || !currentUser || !termosOk) {
      vistas.current = null;
      return;
    }
    const minhas = notificacoesDe(state, currentUser);
    if (vistas.current === null) {
      vistas.current = new Set(minhas.map((n) => n.id));
      const naoLidas = minhas.filter((n) => !n.lida).length;
      if (naoLidas > 0) {
        toast.show({
          type: 'push', icon: 'bell-ring-outline', title: `Você tem ${contar(naoLidas, 'notificação', 'notificações')} não lida${naoLidas > 1 ? 's' : ''}`,
          message: minhas.find((n) => !n.lida)?.titulo, onPress: () => navegar('Notifications'),
        });
      }
      return;
    }
    const novas = minhas.filter((n) => !vistas.current.has(n.id));
    novas.forEach((n) => vistas.current.add(n.id));
    if (novas.length) {
      const n = novas[0];
      toast.show({
        type: 'push', icon: TIPOS_NOTIFICACAO[n.tipo]?.icone, title: n.titulo, message: n.mensagem,
        onPress: () => (n.rdoId ? navegar('RdoDetail', { rdoId: n.rdoId }) : navegar('Notifications')),
      });
    }
  }, [state?.notifications, userId, termosOk]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
