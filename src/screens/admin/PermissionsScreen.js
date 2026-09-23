import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { MATRIZ_PERMISSOES, PERFIL, PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { Avatar, Badge, Button, Card, EmptyState, Icon, Screen, SegmentedTabs, Txt } from '../../components/ui';

const CELULA = {
  sim: { icon: 'check-circle', color: colors.success, label: 'Permitido' },
  nao: { icon: 'close-circle-outline', color: colors.textSubtle, label: 'Não permitido' },
  restrito: { icon: 'circle-half-full', color: colors.warning, label: 'Restrito' },
};

// Permissões por perfil (seção 4) e por obra (RF-03).
export default function PermissionsScreen({ navigation }) {
  const { state, currentUser } = useApp();
  const [aba, setAba] = useState('perfil');

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Permissões" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" />
      </Screen>
    );
  }

  return (
    <Screen title="Permissões" subtitle="Por perfil e por obra" back>
      <SegmentedTabs items={[{ key: 'perfil', label: 'Por perfil', icon: 'shield-account-outline' }, { key: 'obra', label: 'Por obra', icon: 'office-building-outline' }]} value={aba} onChange={setAba} />

      {aba === 'perfil' ? (
        <>
          <View style={styles.cabecalho}>
            <View style={{ flex: 1 }} />
            {Object.values(PERFIS).map((p) => (
              <View key={p.key} style={styles.col} accessible accessibilityLabel={p.longo}>
                <Icon name={p.icone} size={20} color={colors.navy700} />
                <Txt v="caption" muted style={{ fontSize: 10.5 }}>
                  {p.label}
                </Txt>
              </View>
            ))}
          </View>
          {MATRIZ_PERMISSOES.map((g) => (
            <Card key={g.grupo} padded={false} style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Txt v="label" color={colors.navy600} style={{ paddingTop: 8, paddingBottom: 4 }}>
                {g.grupo.toUpperCase()}
              </Txt>
              {g.itens.map((it, i) => (
                <View key={it.label} style={[styles.linha, i > 0 && styles.sep]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Txt v="small">{it.label}</Txt>
                    {it.nota ? (
                      <Txt v="caption" muted>
                        {it.nota}
                      </Txt>
                    ) : null}
                  </View>
                  {['master', 'operacional', 'cliente'].map((p) => (
                    <View key={p} style={styles.col} accessible accessibilityLabel={`${PERFIS[p].label}: ${CELULA[it[p]].label}`}>
                      <Icon name={CELULA[it[p]].icon} size={24} color={CELULA[it[p]].color} />
                    </View>
                  ))}
                </View>
              ))}
            </Card>
          ))}
          <View style={styles.legenda}>
            {Object.values(CELULA).map((c) => (
              <View key={c.label} style={styles.leg}>
                <Icon name={c.icon} size={18} color={c.color} />
                <Txt v="caption" muted>
                  {c.label}
                </Txt>
              </View>
            ))}
          </View>
          <Txt v="caption" muted>
            Princípio do menor privilégio: cada perfil recebe apenas o necessário. Segregação de funções: quem preenche, quem valida e quem acompanha têm permissões próprias.
          </Txt>
        </>
      ) : (
        state.obras.map((o) => {
          const equipe = state.users.filter((u) => (o.usuarioIds || []).includes(u.id));
          return (
            <Card key={o.id} style={{ gap: 10 }}>
              <View style={styles.topo}>
                <View style={{ flex: 1 }}>
                  <Txt v="bodyStrong">{o.nome}</Txt>
                  <Txt v="caption" muted>
                    {o.descricao} · {o.contrato}
                  </Txt>
                </View>
                <Badge label={`${equipe.length} vinculados`} color={colors.navy700} bg={colors.blue100} size="sm" />
              </View>
              {equipe.map((u) => (
                <View key={u.id} style={styles.topo}>
                  <Avatar nome={u.nome} size={32} />
                  <Txt v="small" style={{ flex: 1 }}>
                    {u.nome}
                  </Txt>
                  <Badge label={PERFIS[u.perfil].label} color={colors.gray} bg={colors.grayBg} size="sm" />
                </View>
              ))}
              <Txt v="caption" muted>
                O Master ({state.users.filter((u) => u.perfil === PERFIL.MASTER).map((u) => u.nome).join(', ')}) acessa todas as obras.
              </Txt>
              <Button title="Editar vínculos desta obra" icon="account-multiple-plus-outline" variant="tonal" size="sm" onPress={() => navigation.navigate('ObraForm', { obraId: o.id })} />
            </Card>
          );
        })
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  cabecalho: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12 },
  col: { width: 64, alignItems: 'center', gap: 2 },
  linha: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  sep: { borderTopWidth: 1, borderTopColor: colors.divider },
  legenda: { flexDirection: 'row', gap: 16, justifyContent: 'center' },
  leg: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  topo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
