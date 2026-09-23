import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { isEmail, maskPhone, uid } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Badge, BottomSheet, Button, Card, EmptyState, Icon, IconButton, Screen, Txt, useUI } from '../../components/ui';
import { TextField } from '../../components/form';

// Cadastro de clientes (RF-02). O vínculo do cliente com a obra é feito na obra; usuários "Cliente" pertencem a um cliente.
export default function ClientesScreen() {
  const { state, actions, currentUser } = useApp();
  const { toast } = useUI();
  const [edit, setEdit] = useState(null);
  const [erros, setErros] = useState({});

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Clientes" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" />
      </Screen>
    );
  }

  const abrir = (c) => {
    setErros({});
    setEdit(c ? { ...c } : { id: uid('cli'), nome: '', contato: '', email: '', telefone: '' });
  };

  const salvar = () => {
    const e = {};
    if (!edit.nome.trim()) e.nome = 'Informe o nome do cliente.';
    if (edit.email && !isEmail(edit.email)) e.email = 'E-mail inválido.';
    setErros(e);
    if (Object.keys(e).length) return haptic.warning();
    actions.salvarCliente({ userId: currentUser.id, cliente: { ...edit, nome: edit.nome.trim() } });
    setEdit(null);
    toast.show({ type: 'success', title: 'Cliente salvo' });
    return undefined;
  };

  return (
    <Screen title="Clientes" subtitle={`${state.clientes.length} cadastrados`} back keyboard right={<IconButton icon="plus-circle-outline" label="Novo cliente" color={colors.white} onPress={() => abrir(null)} />}>
      {state.clientes.length === 0 ? <EmptyState icon="account-tie-outline" title="Nenhum cliente" message="Cadastre o cliente antes de vincular à obra." actionLabel="Novo cliente" onAction={() => abrir(null)} /> : null}
      {state.clientes.map((c) => {
        const obras = state.obras.filter((o) => o.clienteId === c.id);
        const usuarios = state.users.filter((u) => u.clienteId === c.id);
        return (
          <Card key={c.id} onPress={() => abrir(c)} style={{ gap: 6 }}>
            <View style={styles.row}>
              <View style={styles.icone}>
                <Icon name="account-tie-outline" size={24} color={colors.navy600} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt v="bodyStrong">{c.nome}</Txt>
                <Txt v="caption" muted>
                  {c.contato} · {c.email}
                </Txt>
              </View>
            </View>
            <View style={styles.row}>
              <Badge label={`${obras.length} ${obras.length === 1 ? 'obra' : 'obras'}`} color={colors.navy700} bg={colors.blue100} size="sm" />
              <Badge label={`${usuarios.length} ${usuarios.length === 1 ? 'usuário' : 'usuários'}`} color={colors.gray} bg={colors.grayBg} size="sm" />
            </View>
          </Card>
        );
      })}
      <Button title="Novo cliente" icon="plus" variant="tonal" onPress={() => abrir(null)} />

      <BottomSheet
        visible={!!edit}
        onClose={() => setEdit(null)}
        title={edit && state.clientes.some((c) => c.id === edit.id) ? 'Editar cliente' : 'Novo cliente'}
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancelar" variant="secondary" onPress={() => setEdit(null)} style={{ flex: 1 }} />
            <Button title="Salvar" icon="check" onPress={salvar} style={{ flex: 1.3 }} />
          </View>
        }
      >
        {edit ? (
          <>
            <TextField label="Nome / razão social" required value={edit.nome} onChangeText={(t) => setEdit({ ...edit, nome: t })} error={erros.nome} autoCapitalize="words" />
            <TextField label="Contato principal" value={edit.contato} onChangeText={(t) => setEdit({ ...edit, contato: t })} autoCapitalize="words" />
            <TextField label="E-mail" value={edit.email} onChangeText={(t) => setEdit({ ...edit, email: t })} error={erros.email} keyboardType="email-address" autoCapitalize="none" prefixIcon="email-outline" />
            <TextField label="Telefone" value={edit.telefone} onChangeText={(t) => setEdit({ ...edit, telefone: maskPhone(t) })} keyboardType="phone-pad" prefixIcon="phone-outline" />
          </>
        ) : null}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  icone: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blue100, alignItems: 'center', justifyContent: 'center' },
});
