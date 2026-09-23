import React from 'react';
import { Card, Divider, EmptyState, ListRow, Screen, SectionTitle } from '../../components/ui';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';

export const CATALOGOS = {
  funcoes: { titulo: 'Funções', icone: 'account-hard-hat', desc: 'Funções da mão de obra (Pedreiro, Servente…)' },
  equipamentos: { titulo: 'Equipamentos', icone: 'excavator', desc: 'Tipos de equipamento' },
  servicos: { titulo: 'Serviços (EAP)', icone: 'hammer-wrench', desc: 'Serviços com unidade padrão' },
  materiais: { titulo: 'Materiais', icone: 'package-variant-closed', desc: 'Materiais recebidos e utilizados' },
  unidades: { titulo: 'Unidades', icone: 'ruler', desc: 'm, m², m³, kg, un…' },
  frentes: { titulo: 'Frentes e locais', icone: 'map-marker-radius-outline', desc: 'Pavimentos, eixos e frentes de serviço' },
  origensEmpresa: { titulo: 'Equipes / empresas', icone: 'domain', desc: 'Equipe própria e terceirizadas' },
};

// Cadastros (RF-02): empresa, clientes, obras, usuários e biblioteca reutilizada nos formulários do RDO.
export default function CadastrosScreen({ navigation }) {
  const { state, currentUser } = useApp();
  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Cadastros" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" message="Somente o usuário Master gerencia os cadastros." />
      </Screen>
    );
  }
  return (
    <Screen title="Cadastros" subtitle="Empresa, clientes, obras e biblioteca" back>
      <SectionTitle>Estrutura</SectionTitle>
      <Card padded={false} style={{ paddingHorizontal: 12 }}>
        <ListRow icon="domain" title="Empresa" subtitle={state.empresa.nome} onPress={() => navigation.navigate('Empresa')} />
        <Divider />
        <ListRow icon="account-tie-outline" title="Clientes" subtitle={`${state.clientes.length} cadastrados`} onPress={() => navigation.navigate('Clientes')} />
        <Divider />
        <ListRow icon="office-building-outline" title="Obras e contratos" subtitle={`${state.obras.length} obras`} onPress={() => navigation.navigate('ObrasList')} />
        <Divider />
        <ListRow icon="account-multiple-outline" title="Usuários e responsáveis" subtitle={`${state.users.length} usuários`} onPress={() => navigation.navigate('Users')} />
      </Card>

      <SectionTitle>Biblioteca de cadastros</SectionTitle>
      <Card padded={false} style={{ paddingHorizontal: 12 }}>
        {Object.entries(CATALOGOS).map(([chave, c], i) => (
          <React.Fragment key={chave}>
            {i ? <Divider /> : null}
            <ListRow icon={c.icone} title={c.titulo} subtitle={`${state.catalogos[chave].length} itens · ${c.desc}`} onPress={() => navigation.navigate('Catalog', { chave })} />
          </React.Fragment>
        ))}
      </Card>
    </Screen>
  );
}
