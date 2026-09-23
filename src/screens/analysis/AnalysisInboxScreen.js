import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { useApp } from '../../store/AppContext';
import { useNow } from '../../hooks/useNow';
import { rdosAguardandoAnalise } from '../../domain/selectors';
import { Banner, EmptyState, Screen, SyncBanner, Txt } from '../../components/ui';
import { RdoCard } from '../../components/rdo';

// Caixa de análise do master (seção 13): o que exige ação agora, do mais antigo ao mais recente.
export default function AnalysisInboxScreen() {
  const nav = useNavigation();
  const { state } = useApp();
  const now = useNow();
  const cfg = state.settings.lembretes;

  const grupos = useMemo(() => {
    const porData = (a, b) => (a.data < b.data ? 1 : -1);
    const comCliente = state.rdos.filter((r) => r.status === 'enviado_cliente');
    return [
      { key: 'analise', titulo: 'Aguardando análise', ajuda: 'Abra, comente e devolva ou valide e assine.', lista: rdosAguardandoAnalise(state), tone: 'info' },
      { key: 'esclarecimento', titulo: 'Esclarecimentos do cliente', ajuda: 'O cliente pediu esclarecimento antes de dar ciência.', lista: comCliente.filter((r) => r.esclarecimentoPendente), tone: 'warning' },
      { key: 'validado', titulo: 'Validados — enviar ao cliente', ajuda: 'Versão técnica fechada; falta liberar ao cliente.', lista: state.rdos.filter((r) => r.status === 'validado').sort(porData), tone: 'info' },
      { key: 'devolvido', titulo: 'Devolvidos — com o operacional', ajuda: 'Aguardando correção e reenvio.', lista: state.rdos.filter((r) => r.status === 'devolvido').sort(porData), tone: 'neutral' },
      { key: 'cliente', titulo: 'Com o cliente — aguardando ciência', ajuda: 'Lembretes automáticos em 24 h e 48 h.', lista: comCliente.filter((r) => !r.esclarecimentoPendente).sort(porData), tone: 'neutral' },
    ].filter((g) => g.lista.length);
  }, [state]);

  const total = grupos.reduce((n, g) => n + g.lista.length, 0);
  const obraDe = (r) => state.obras.find((o) => o.id === r.obraId);
  const nomeAutor = (r) => state.users.find((u) => u.id === r.autorId)?.nome;

  return (
    <Screen title="Caixa de análise" subtitle="Master" tab bell>
      <SyncBanner />
      {total === 0 ? (
        <EmptyState icon="check-decagram-outline" title="Nada pendente" message="Quando um operacional enviar um RDO, ele aparecerá aqui para análise, comentário, devolução ou validação." />
      ) : null}
      {grupos.map((g) => (
        <View key={g.key} style={{ gap: 10 }}>
          <View style={{ gap: 2 }}>
            <Txt v="h3">
              {g.titulo}{' '}
              <Txt v="h3" color={colors.textSubtle}>
                ({g.lista.length})
              </Txt>
            </Txt>
            <Txt v="small" muted>
              {g.ajuda}
            </Txt>
          </View>
          {g.lista.map((r) => (
            <RdoCard key={r.id} rdo={r} obra={obraDe(r)} agora={now} config={cfg} autorNome={nomeAutor(r)} onPress={() => nav.navigate('RdoDetail', { rdoId: r.id })} />
          ))}
        </View>
      ))}
      {total > 0 ? <Banner tone="info" message={`Prazos sugeridos: análise em até ${cfg.masterHoras} h. O sistema envia lembretes e escalonamento configuráveis em Mais → Configurações.`} /> : null}
    </Screen>
  );
}
