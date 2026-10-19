import React from 'react';
import { styles } from './styles';
import { PERFIL } from '../../../constants';
import { useApp } from '../../../store/AppContext';
import MasterHome from '../MasterHome';
import OperacionalHome from '../OperacionalHome';
import ClientHome from '../ClientHome';

// Painel inicial conforme perfil (seção 13).
export default function HomeScreen() {
  const { currentUser } = useApp();
  if (currentUser.perfil === PERFIL.MASTER) return <MasterHome />;
  if (currentUser.perfil === PERFIL.OPERACIONAL) return <OperacionalHome />;
  return <ClientHome />;
}
