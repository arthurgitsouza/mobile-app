import React, { useState } from 'react';
import { View } from 'react-native';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { isEmail, maskPhone } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Banner, Button, EmptyState, Screen, useUI } from '../../components/ui';
import { TextField } from '../../components/form';

// Cadastro da empresa executora (RF-02). O protótipo tem uma empresa; o modelo já prevê várias (RNF-07).
export default function EmpresaScreen({ navigation }) {
  const { state, actions, currentUser } = useApp();
  const { toast } = useUI();
  const [f, setF] = useState({ ...state.empresa });
  const [erros, setErros] = useState({});
  const set = (k) => (v) => {
    setF((d) => ({ ...d, [k]: v }));
    setErros((e) => ({ ...e, [k]: undefined }));
  };

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Empresa" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" />
      </Screen>
    );
  }

  const salvar = () => {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Informe a razão social.';
    if (f.email && !isEmail(f.email)) e.email = 'E-mail inválido.';
    setErros(e);
    if (Object.keys(e).length) return haptic.warning();
    actions.salvarEmpresa({ userId: currentUser.id, empresa: f });
    toast.show({ type: 'success', title: 'Empresa atualizada' });
    navigation.goBack();
    return undefined;
  };

  return (
    <Screen
      title="Empresa"
      subtitle="Dados da empresa executora"
      back
      keyboard
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Salvar" icon="check" onPress={salvar} style={{ flex: 1.4 }} />
        </View>
      }
      hideFooterOnKeyboard
    >
      <Banner tone="info" message="Estes dados identificam a empresa em RDOs, PDFs e notificações. A segregação por empresa prepara a arquitetura para múltiplas empresas." />
      <TextField label="Razão social" required value={f.nome} onChangeText={set('nome')} error={erros.nome} autoCapitalize="words" />
      <TextField label="CNPJ" value={f.cnpj} onChangeText={set('cnpj')} keyboardType="number-pad" placeholder="00.000.000/0000-00" />
      <TextField label="Cidade / UF" value={f.cidade} onChangeText={set('cidade')} autoCapitalize="words" />
      <TextField label="E-mail institucional" value={f.email} onChangeText={set('email')} error={erros.email} keyboardType="email-address" autoCapitalize="none" prefixIcon="email-outline" />
      <TextField label="Telefone" value={f.telefone} onChangeText={(t) => set('telefone')(maskPhone(t))} keyboardType="phone-pad" prefixIcon="phone-outline" />
      <TextField label="Responsável" value={f.responsavel} onChangeText={set('responsavel')} autoCapitalize="words" />
    </Screen>
  );
}
