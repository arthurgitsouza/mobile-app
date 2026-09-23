import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { PERFIL, PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { Avatar, Badge, BottomSheet, Card, Divider, Icon, ListRow, Screen, SectionTitle, Txt, useUI } from '../../components/ui';

// Menu "Mais": cadastros, relatórios, configurações e (em modo demonstração) troca rápida de perfil.
export default function MoreScreen() {
  const nav = useNavigation();
  const { state, actions, currentUser, online } = useApp();
  const { confirm } = useUI();
  const [trocar, setTrocar] = useState(false);
  const perfil = currentUser.perfil;
  const pendentes = state.rdos.filter((r) => r.sync?.pendente).length;

  const sair = async () => {
    const ok = await confirm({ icon: 'logout', title: 'Encerrar sessão?', message: 'Rascunhos e RDOs salvos no aparelho continuam guardados.', confirmLabel: 'Sair' });
    if (ok) actions.sair();
  };

  const item = (icon, title, subtitle, onPress, extra = {}) => <ListRow icon={icon} title={title} subtitle={subtitle} onPress={onPress} {...extra} />;

  return (
    <Screen title="Mais" subtitle={PERFIS[perfil].longo} tab bell>
      <Card style={styles.perfil}>
        <Avatar nome={currentUser.nome} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h3">{currentUser.nome}</Txt>
          <Txt v="small" muted>
            {currentUser.cargo}
          </Txt>
          <Txt v="caption" muted numberOfLines={1}>
            {currentUser.email}
          </Txt>
        </View>
        <Badge label={PERFIS[perfil].label} icon={PERFIS[perfil].icone} color={colors.navy700} bg={colors.blue100} size="sm" />
      </Card>

      {perfil === PERFIL.MASTER ? (
        <>
          <SectionTitle>Gestão</SectionTitle>
          <Card padded={false} style={styles.lista}>
            {item('chart-box-outline', 'Relatórios e indicadores', 'Efetivo, homem-hora, equipamentos, clima, qualidade e exportação', () => nav.navigate('Reports'))}
            <Divider />
            {item('account-multiple-outline', 'Usuários e permissões', `${state.users.length} usuários · perfis e vínculos por obra`, () => nav.navigate('Users'))}
            <Divider />
            {item('database-cog-outline', 'Cadastros', 'Empresa, clientes, obras e biblioteca (funções, equipamentos…)', () => nav.navigate('Cadastros'))}
            <Divider />
            {item('school-outline', 'Módulo acadêmico', 'Entregas dos grupos, critérios, notas e versões (opcional)', () => nav.navigate('Academic'))}
            <Divider />
            {item('shield-search', 'Auditoria geral', 'Trilha de eventos protegida contra alteração', () => nav.navigate('Audit'))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Documentos e dados</SectionTitle>
      <Card padded={false} style={styles.lista}>
        {perfil !== PERFIL.CLIENTE ? (
          <>
            {item('folder-outline', 'Central de arquivos', 'PDFs finais dos RDOs e exportações', () => nav.navigate('Files'))}
            <Divider />
          </>
        ) : null}
        {item(online ? 'cloud-sync-outline' : 'cloud-off-outline', 'Sincronização e modo offline', pendentes ? `${pendentes} RDO(s) aguardando envio` : online ? 'Tudo sincronizado' : 'Sem conexão — dados salvos no aparelho', () => nav.navigate('Sync'), {
          badge: pendentes ? <Badge label={String(pendentes)} color={colors.warning} bg={colors.warningBg} size="sm" /> : undefined,
        })}
        <Divider />
        {item('bell-cog-outline', 'Configurações', 'Conta, segurança, notificações, LGPD e demonstração', () => nav.navigate('Settings'))}
      </Card>

      <SectionTitle>Demonstração</SectionTitle>
      <Card padded={false} style={styles.lista}>
        {item('account-switch-outline', 'Trocar de perfil', 'Alterna entre Master, Operacional e Cliente sem digitar senha', () => setTrocar(true))}
        <Divider />
        {item('map-marker-path', 'Roteiro de demonstração', 'Passo a passo do cenário principal (seção 21)', () => nav.navigate('DemoGuide'))}
      </Card>

      <Card padded={false} style={styles.lista}>
        {item('logout', 'Encerrar sessão', undefined, sair, { danger: true, chevron: false })}
      </Card>
      <Txt v="caption" subtle style={{ textAlign: 'center' }}>
        RDO Mobile v1.0.0 · protótipo de interface (sem back-end)
      </Txt>

      <BottomSheet visible={trocar} onClose={() => setTrocar(false)} title="Trocar de perfil" subtitle="Modo demonstração — apenas para testes.">
        {state.users
          .filter((u) => u.ativo)
          .map((u) => (
            <ListRow
              key={u.id}
              title={u.nome}
              subtitle={`${PERFIS[u.perfil].longo} · ${u.cargo}`}
              icon={PERFIS[u.perfil].icone}
              onPress={() => {
                setTrocar(false);
                actions.entrar({ userId: u.id, manter: state.session.manter });
              }}
              right={u.id === currentUser.id ? <Icon name="check-circle" size={22} color={colors.success} /> : undefined}
              chevron={false}
            />
          ))}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  perfil: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lista: { paddingHorizontal: 12 },
});
