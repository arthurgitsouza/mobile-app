import { useCallback, useRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../store/AppContext';
import { useUI } from '../components/ui';
import { rdosAtivos } from '../domain/rdo';
import { podeEditarOperacional } from '../domain/workflow';
import { formatDate, hojeObra } from '../utils/date';
import { numeroRdo } from '../utils/format';
import { statusMeta } from '../theme';

// Cria um novo RDO (rascunho) para obra/data/turno: alerta duplicidade e oferece reaproveitar o dia anterior.
export default function useCriarRdo() {
  const nav = useNavigation();
  const { getState, actions, currentUser } = useApp();
  const { confirm, notice } = useUI();
  const criando = useRef(false);

  return useCallback(
    async (obra, data = hojeObra(), turno = 'diurno') => {
      if (criando.current) return null;
      criando.current = true;
      try {
        const state = getState();
        const existente = rdosAtivos(state.rdos).find(
          (r) => r.obraId === obra.id && r.data === data && r.turno === turno,
        );
        if (existente) {
          const abrir = await confirm({
            icon: 'content-copy',
            title: 'Já existe um RDO nesta data',
            message: `O RDO ${numeroRdo(existente.numero)} (${statusMeta[existente.status].label.toLowerCase()}) já cobre ${formatDate(data)} (${turno}) na ${obra.nome}. Deseja abrir o existente?`,
            confirmLabel: 'Abrir existente',
            cancelLabel: 'Criar mesmo assim',
          });
          if (abrir) {
            nav.navigate(podeEditarOperacional(existente, currentUser) ? 'RdoForm' : 'RdoDetail', {
              rdoId: existente.id,
            });
            return null;
          }
        }

        let reaproveitarDe;
        // Prefere o último RDO já enviado (completo); só usa rascunho se não houver outro.
        const candidatos = rdosAtivos(state.rdos)
          .filter((r) => r.obraId === obra.id && r.data < data)
          .sort((a, b) => (a.data < b.data ? 1 : -1));
        const anterior = candidatos.find((r) => r.status !== 'rascunho') || candidatos[0];
        if (anterior) {
          const reusar = await confirm({
            icon: 'content-copy',
            title: 'Reaproveitar o dia anterior?',
            message: `Copiar equipe, equipamentos, atividades e pendências abertas do RDO ${numeroRdo(anterior.numero)} (${formatDate(anterior.data)}). As quantidades do dia precisam ser informadas.`,
            confirmLabel: 'Reaproveitar',
            cancelLabel: 'Começar em branco',
          });
          if (reusar) reaproveitarDe = anterior.id;
        }
        let atualizado;
        try {
          atualizado = await actions.criarRdo({ obraId: obra.id, data, turno, reaproveitarDe });
        } catch (erro) {
          await notice({ title: 'Não foi possível criar o RDO', message: erro.mensagem || erro.message });
          return null;
        }
        const rdo = atualizado.rdos.find(
          (r) => r.obraId === obra.id && !state.rdos.some((antigo) => antigo.id === r.id),
        );
        if (!rdo) return null;
        nav.navigate('RdoForm', { rdoId: rdo.id });
        return rdo;
      } finally {
        criando.current = false;
      }
    },
    [nav, getState, actions, currentUser, confirm, notice],
  );
}
