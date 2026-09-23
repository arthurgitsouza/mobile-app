import React from 'react';
import { useNavigationState } from '@react-navigation/native';
import { EmptyState, Screen } from '../components/ui';

// Tela provisória usada durante o desenvolvimento para rotas ainda não implementadas.
export default function Placeholder({ route }) {
  const isTab = useNavigationState((s) => s.type === 'tab');
  return (
    <Screen title={route.name} back={!isTab} tab={isTab} bell={isTab}>
      <EmptyState icon="hammer-wrench" title="Em construção" message={`A tela "${route.name}" ainda será implementada.`} />
    </Screen>
  );
}
