import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { useApp } from '../../store/AppContext';
import { numeroFormatado } from '../../domain/rdo';
import { formatDateTime, tempoRelativo } from '../../utils/date';
import { Banner, Button, Card, EmptyState, Icon, Screen, StatusBadge, SectionTitle, Txt, useUI } from '../../components/ui';
import { SwitchField } from '../../components/form';

// Central de sincronização (RNF-03): mostra claramente o que ainda não foi enviado e permite sincronizar.
export default function SyncScreen({ navigation }) {
  const { state, actions, currentUser, online } = useApp();
  const { toast } = useUI();
  const [sincronizando, setSincronizando] = useState(false);
  const pendentes = state.rdos.filter((r) => r.sync?.pendente && (currentUser.perfil === 'master' || r.autorId === currentUser.id));
  const fotosLocais = state.rdos.flatMap((r) => (r.autorId === currentUser.id ? r.fotos.filter((f) => f.envio === 'local').map((f) => ({ f, r })) : []));
  const rascunhos = state.rdos.filter((r) => r.status === 'rascunho' && r.autorId === currentUser.id);
  const ultimo = state.rdos.map((r) => r.sync?.ultimoEm).filter(Boolean).sort().pop();

  const sincronizar = async () => {
    setSincronizando(true);
    await new Promise((r) => setTimeout(r, 1200));
    actions.sincronizarPendentes();
    setSincronizando(false);
    toast.show({ type: 'success', title: 'Sincronização concluída', message: pendentes.length ? `${pendentes.length} RDO(s) enviado(s) ao master.` : 'Nada pendente.' });
  };

  return (
    <Screen title="Sincronização" subtitle={online ? 'Online' : 'Offline'} back>
      <Card tone={online ? 'success' : 'warning'} style={styles.status}>
        <View style={[styles.iconeStatus, { backgroundColor: online ? colors.success : colors.warning }]}>
          <Icon name={online ? 'cloud-check-outline' : 'cloud-off-outline'} size={28} color={colors.white} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Txt v="h3" color={online ? colors.success : colors.warning}>
            {online ? 'Conectado' : 'Sem conexão'}
          </Txt>
          <Txt v="small" color={online ? colors.success : colors.warning}>
            {online ? (pendentes.length ? 'Há itens aguardando envio.' : 'Tudo sincronizado.') : 'Você pode continuar preenchendo. Rascunhos, fotos e envios ficam salvos no aparelho.'}
          </Txt>
        </View>
      </Card>

      <SwitchField label="Simular modo offline" description="Para testar o comportamento sem rede (RF-05)." value={state.settings.forceOffline} onValueChange={(v) => actions.atualizarConfiguracoes({ patch: { forceOffline: v } })} tone="gold" />

      <SectionTitle>Aguardando envio ({pendentes.length})</SectionTitle>
      {pendentes.length ? (
        pendentes.map((r) => (
          <Card key={r.id} onPress={() => navigation.navigate('RdoDetail', { rdoId: r.id })} style={{ gap: 6 }}>
            <View style={styles.row}>
              <Icon name="cloud-upload-outline" size={22} color={colors.warning} />
              <Txt v="bodyStrong" style={{ flex: 1 }}>
                RDO nº {numeroFormatado(r)} · {state.obras.find((o) => o.id === r.obraId)?.nome}
              </Txt>
              <StatusBadge status={r.status} size="sm" />
            </View>
            <Txt v="caption" muted>
              Enviado no aparelho {tempoRelativo(r.submetidoEm)} · {r.fotos.length} fotos ({r.fotos.filter((f) => f.envio === 'local').length} ainda locais)
            </Txt>
          </Card>
        ))
      ) : (
        <EmptyState icon="cloud-check-outline" title="Nada pendente" message="Todos os RDOs enviados já chegaram ao servidor." />
      )}

      {rascunhos.length ? (
        <>
          <SectionTitle>Rascunhos no aparelho ({rascunhos.length})</SectionTitle>
          {rascunhos.map((r) => (
            <Card key={r.id} onPress={() => navigation.navigate('RdoForm', { rdoId: r.id })} style={styles.row}>
              <Icon name="content-save-outline" size={22} color={colors.navy600} />
              <Txt v="small" style={{ flex: 1 }}>
                RDO nº {numeroFormatado(r)} — salvo às {formatDateTime(r.atualizadoEm)}
              </Txt>
            </Card>
          ))}
        </>
      ) : null}

      {fotosLocais.length ? <Banner tone="info" icon="image-multiple-outline" message={`${fotosLocais.length} foto(s) só estão no aparelho e serão enviadas com o RDO.`} /> : null}
      <Txt v="caption" muted style={{ textAlign: 'center' }}>
        Última sincronização: {ultimo ? formatDateTime(ultimo) : '—'}
      </Txt>
      <Button title="Sincronizar agora" icon="sync" onPress={sincronizar} loading={sincronizando} disabled={!online || pendentes.length === 0} />
      {!online ? (
        <Txt v="caption" muted style={{ textAlign: 'center' }}>
          Reconecte-se para sincronizar. O app envia automaticamente quando a rede voltar.
        </Txt>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  status: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconeStatus: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
});
