import { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useApp } from '../store/AppContext';
import { useUI } from '../components/ui';
import { criarRdoVazio, proximoNumero, rdosAtivos, reaproveitarDoAnterior } from '../domain/rdo';
import { podeEditarOperacional } from '../domain/workflow';
import { formatDate, hojeObra } from '../utils/date';
import { numeroRdo } from '../utils/format';
import { statusMeta } from '../theme';

// Cria um novo RDO (rascunho) para obra/data/turno: alerta duplicidade e oferece reaproveitar o dia anterior.
export default function useCriarRdo() {
  const nav = useNavigation();
  const { getState, actions, currentUser } = useApp();
  const { confirm } = useUI();

  return useCallback(
    async (obra, data = hojeObra(), turno = 'diurno') => {
      const state = getState();
      const existente = rdosAtivos(state.rdos).find((r) => r.obraId === obra.id && r.data === data && r.turno === turno);
      if (existente) {
        const abrir = await confirm({
          icon: 'content-copy',
          title: 'Já existe um RDO nesta data',
          message: `O RDO ${numeroRdo(existente.numero)} (${statusMeta[existente.status].label.toLowerCase()}) já cobre ${formatDate(data)} (${turno}) na ${obra.nome}. Deseja abrir o existente?`,
          confirmLabel: 'Abrir existente',
          cancelLabel: 'Criar mesmo assim',
        });
        if (abrir) {
          nav.navigate(podeEditarOperacional(existente, currentUser) ? 'RdoForm' : 'RdoDetail', { rdoId: existente.id });
          return null;
        }
      }

      let rdo = criarRdoVazio({ obra, autor: currentUser, data, turno, numero: proximoNumero(state.rdos, obra.id) });
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
        if (reusar) rdo = reaproveitarDoAnterior(rdo, anterior);
      }
      actions.criarRdo({ rdo });
      nav.navigate('RdoForm', { rdoId: rdo.id });
      return rdo;
    },
    [nav, getState, actions, currentUser, confirm],
  );
}
