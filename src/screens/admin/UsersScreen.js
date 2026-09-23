import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { PERFIL, PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { normalizar } from '../../utils/format';
import { Avatar, Badge, Button, Card, Chip, EmptyState, Icon, IconButton, Screen, Txt } from '../../components/ui';
import { SearchBar } from '../../components/form';

// Usuários e permissões (seção 13): cadastro por perfil e vínculo por obra (RF-02, RF-03).
export default function UsersScreen() {
  const nav = useNavigation();
  const { state, currentUser } = useApp();
  const [busca, setBusca] = useState('');
  const [perfil, setPerfil] = useState('');

  const lista = useMemo(() => {
    const q = normalizar(busca);
    return state.users
      .filter((u) => (perfil ? u.perfil === perfil : true))
      .filter((u) => !q || normalizar(`${u.nome} ${u.email} ${u.cargo}`).includes(q))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [state.users, busca, perfil]);

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Usuários" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" message="Somente o usuário Master gerencia usuários." />
      </Screen>
    );
  }

  return (
    <Screen
      title="Usuários e permissões"
      subtitle={`${state.users.length} usuários`}
      back
      right={
        <>
          <IconButton icon="shield-key-outline" label="Matriz de permissões" color={colors.white} onPress={() => nav.navigate('Permissions')} />
          <IconButton icon="account-plus-outline" label="Novo usuário" color={colors.white} onPress={() => nav.navigate('UserForm')} />
        </>
      }
      headerExtra={<SearchBar onDark value={busca} onChangeText={setBusca} placeholder="Buscar nome, e-mail ou cargo" style={{ marginTop: 8 }} />}
    >
      <View style={styles.chips}>
        <Chip label="Todos" selected={!perfil} onPress={() => setPerfil('')} count={state.users.length} />
        {Object.values(PERFIS).map((p) => (
          <Chip key={p.key} label={p.label} icon={p.icone} selected={perfil === p.key} onPress={() => setPerfil(perfil === p.key ? '' : p.key)} count={state.users.filter((u) => u.perfil === p.key).length} />
        ))}
      </View>

      {lista.length === 0 ? <EmptyState icon="account-search-outline" title="Nenhum usuário encontrado" /> : null}
      {lista.map((u) => {
        const obras = state.obras.filter((o) => (o.usuarioIds || []).includes(u.id));
        return (
          <Card key={u.id} onPress={() => nav.navigate('UserForm', { userId: u.id })} style={styles.row} accessibilityLabel={`${u.nome}, ${PERFIS[u.perfil].label}${u.ativo ? '' : ', bloqueado'}`}>
            <Avatar nome={u.nome} size={46} />
            <View style={{ flex: 1, gap: 3 }}>
              <Txt v="bodyStrong" numberOfLines={1}>
                {u.nome}
              </Txt>
              <Txt v="caption" muted numberOfLines={1}>
                {u.email}
              </Txt>
              <View style={styles.tags}>
                <Badge label={PERFIS[u.perfil].label} icon={PERFIS[u.perfil].icone} color={colors.navy700} bg={colors.blue100} size="sm" />
                {u.perfil === PERFIL.MASTER ? <Badge label="Todas as obras" color={colors.gray} bg={colors.grayBg} size="sm" /> : <Badge label={`${obras.length} ${obras.length === 1 ? 'obra' : 'obras'}`} color={colors.gray} bg={colors.grayBg} size="sm" />}
                {!u.ativo ? <Badge label="Bloqueado" color={colors.danger} bg={colors.dangerBg} icon="lock-outline" size="sm" /> : null}
              </View>
            </View>
            <Icon name="chevron-right" size={22} color={colors.textSubtle} />
          </Card>
        );
      })}
      <Button title="Novo usuário" icon="account-plus-outline" variant="tonal" onPress={() => nav.navigate('UserForm')} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
});
