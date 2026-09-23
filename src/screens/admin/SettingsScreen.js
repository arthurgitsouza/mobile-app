import React, { useState } from 'react';
import { View } from 'react-native';
import { PERFIL } from '../../constants';
import { useApp } from '../../store/AppContext';
import { autenticarBiometria, biometriaDisponivel } from '../../services/biometrics';
import { formatDateTime } from '../../utils/date';
import { haptic } from '../../utils/feedback';
import { Banner, BottomSheet, Button, Card, Divider, KeyValue, ListRow, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { ChipGroup, PasswordField, SwitchField, TimeField } from '../../components/form';

const INATIVIDADE = [
  { value: '0', label: 'Nunca' },
  { value: '5', label: '5 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
];

// Configurações: conta, segurança, notificações, lembretes (master), offline, LGPD e ferramentas de demonstração.
export default function SettingsScreen({ navigation }) {
  const { state, actions, currentUser, online } = useApp();
  const { confirm, notice, toast } = useUI();
  const s = state.settings;
  const master = currentUser.perfil === PERFIL.MASTER;
  const canais = currentUser.canais || { push: true, email: true, whatsapp: false };
  const bio = !!state.session.biometria?.[currentUser.id];
  const [senhaSheet, setSenhaSheet] = useState(false);
  const [atual, setAtual] = useState('');
  const [nova, setNova] = useState('');
  const [conf, setConf] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const pendentes = state.rdos.filter((r) => r.sync?.pendente).length;

  const alternarBiometria = async (ligar) => {
    if (!ligar) return actions.definirBiometria({ userId: currentUser.id, ativo: false });
    if (!(await biometriaDisponivel())) {
      return notice({ icon: 'fingerprint-off', title: 'Biometria indisponível', message: 'Este aparelho não tem biometria cadastrada (ou o Expo Go/iOS não suporta Face ID). Você continua entrando com e-mail e senha.' });
    }
    if (await autenticarBiometria('Confirme para ativar a biometria')) {
      actions.definirBiometria({ userId: currentUser.id, ativo: true });
      haptic.success();
    }
    return undefined;
  };

  const trocarSenha = () => {
    if (atual !== currentUser.senha) return setErroSenha('Senha atual incorreta.');
    if (nova.length < 8 || !/[A-Za-z]/.test(nova) || !/\d/.test(nova)) return setErroSenha('A nova senha precisa de 8+ caracteres, com letras e números.');
    if (nova !== conf) return setErroSenha('A confirmação não coincide.');
    actions.alterarSenha({ userId: currentUser.id, senha: nova });
    setSenhaSheet(false);
    setAtual('');
    setNova('');
    setConf('');
    setErroSenha('');
    toast.show({ type: 'success', title: 'Senha alterada' });
    return undefined;
  };

  const resetar = async () => {
    const ok = await confirm({ destructive: true, title: 'Restaurar dados de demonstração?', message: 'Todos os RDOs, notificações e cadastros voltam ao estado inicial. Rascunhos criados por você serão perdidos.', confirmLabel: 'Restaurar' });
    if (ok) {
      actions.resetarDemo();
      toast.show({ type: 'success', title: 'Dados restaurados', message: 'Cenário de demonstração recriado.' });
    }
  };

  return (
    <Screen title="Configurações" subtitle={currentUser.nome} back keyboard>
      <SectionTitle>Conta e segurança</SectionTitle>
      <Card padded={false} style={{ paddingHorizontal: 12 }}>
        <ListRow icon="lock-reset" title="Alterar senha" subtitle="Use 8+ caracteres com letras e números" onPress={() => setSenhaSheet(true)} />
      </Card>
      <SwitchField label="Entrar com biometria" description="Usa a biometria do aparelho para abrir o app. Assinaturas continuam exigindo segundo fator." value={bio} onValueChange={alternarBiometria} />
      <View style={{ gap: 6 }}>
        <ChipGroup label="Bloquear por inatividade" options={INATIVIDADE} value={String(s.inatividadeMin || 0)} onChange={(v) => actions.atualizarConfiguracoes({ patch: { inatividadeMin: Number(v) } })} required help="Encerra a sessão se o app ficar em segundo plano por este tempo." />
      </View>

      <SectionTitle>Notificações</SectionTitle>
      <SwitchField label="Push no aplicativo" description="Avisos de envio, devolução, assinatura e prazos." value={canais.push !== false} onValueChange={(v) => actions.atualizarCanais({ userId: currentUser.id, canais: { push: v } })} />
      <SwitchField label="E-mail" description="Com link seguro de acesso ao RDO." value={canais.email !== false} onValueChange={(v) => actions.atualizarCanais({ userId: currentUser.id, canais: { email: v } })} />
      <SwitchField label="WhatsApp (opcional)" description="Integração opcional, sujeita a provedor, custo e consentimento expresso." value={!!canais.whatsapp} onValueChange={(v) => actions.atualizarCanais({ userId: currentUser.id, canais: { whatsapp: v } })} />

      {master ? (
        <>
          <SectionTitle>Lembretes e escalonamento</SectionTitle>
          <Banner tone="info" message="Prazos sugeridos: lembrete ao operacional no fim do dia; ao master após 24 h sem análise; ao cliente após 24 e 48 h; escalonamento configurável." />
          <ChipGroup label="Lembrar o master após" options={[{ value: '12', label: '12 h' }, { value: '24', label: '24 h' }, { value: '48', label: '48 h' }]} value={String(s.lembretes.masterHoras)} onChange={(v) => actions.atualizarConfiguracoes({ patch: { lembretes: { masterHoras: Number(v) } } })} required />
          <ChipGroup label="Escalonar ao master após (cliente sem ciência)" options={[{ value: '48', label: '48 h' }, { value: '72', label: '72 h' }, { value: '96', label: '96 h' }, { value: '0', label: 'Desligado' }]} value={String(s.lembretes.escalonamentoHoras)} onChange={(v) => actions.atualizarConfiguracoes({ patch: { lembretes: { escalonamentoHoras: Number(v) } } })} required />
          <TimeField label="Lembrete de fim de dia ao operacional" value={s.lembretes.operacionalFimDia} onChangeText={(t) => t.length === 5 && actions.atualizarConfiguracoes({ patch: { lembretes: { operacionalFimDia: t } } })} help="Enviado se o RDO do dia ainda não foi enviado." />
        </>
      ) : null}

      <SectionTitle>Sincronização e offline</SectionTitle>
      <SwitchField label="Simular modo offline" description="Testa rascunhos, fotos e envio sem conexão. Ao desligar, o app sincroniza automaticamente." value={s.forceOffline} onValueChange={(v) => actions.atualizarConfiguracoes({ patch: { forceOffline: v } })} tone="gold" />
      <Card style={{ gap: 8 }}>
        <KeyValue inline label="Conexão" value={online ? 'Online' : 'Offline'} />
        <KeyValue inline label="Pendentes de envio" value={String(pendentes)} />
        <Button title="Abrir central de sincronização" icon="cloud-sync-outline" variant="tonal" size="sm" onPress={() => navigation.navigate('Sync')} />
      </Card>

      <SectionTitle>Privacidade (LGPD)</SectionTitle>
      <Card padded={false} style={{ paddingHorizontal: 12 }}>
        <ListRow icon="shield-lock-outline" title="Termos de uso e política de privacidade" subtitle={state.session.termosAceitos?.[currentUser.id] ? `Aceitos em ${formatDateTime(state.session.termosAceitos[currentUser.id].em)}` : undefined} onPress={() => navigation.navigate('TermsView')} />
        <Divider />
        <ListRow
          icon="database-export-outline"
          title="Solicitar cópia dos meus dados"
          subtitle="Direito de acesso e portabilidade (simulado)"
          onPress={() => notice({ icon: 'database-export-outline', title: 'Solicitação registrada', message: 'No sistema real, o encarregado de dados da empresa responderá pelo e-mail cadastrado no prazo legal.' })}
        />
      </Card>

      <SectionTitle>Demonstração</SectionTitle>
      <SwitchField label="Simular falha de e-mail no próximo envio ao cliente" description="Permite ver o aviso de falha de entrega ao master e o reenvio (seção 10). Vale para um único envio." value={s.simularFalhaEmail} onValueChange={(v) => actions.atualizarConfiguracoes({ patch: { simularFalhaEmail: v } })} />
      <Button title="Roteiro de demonstração" icon="map-marker-path" variant="secondary" onPress={() => navigation.navigate('DemoGuide')} />
      <Button title="Restaurar dados de demonstração" icon="database-refresh-outline" variant="danger" onPress={resetar} />
      <Txt v="caption" subtle style={{ textAlign: 'center' }}>
        Protótipo de interface · dados fictícios armazenados apenas neste aparelho.
      </Txt>

      <BottomSheet
        visible={senhaSheet}
        onClose={() => setSenhaSheet(false)}
        title="Alterar senha"
        footer={
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Button title="Cancelar" variant="secondary" onPress={() => setSenhaSheet(false)} style={{ flex: 1 }} />
            <Button title="Salvar" icon="check" onPress={trocarSenha} style={{ flex: 1.3 }} />
          </View>
        }
      >
        <PasswordField label="Senha atual" value={atual} onChangeText={(t) => { setAtual(t); setErroSenha(''); }} required />
        <PasswordField label="Nova senha" value={nova} onChangeText={(t) => { setNova(t); setErroSenha(''); }} required />
        <PasswordField label="Confirmar nova senha" value={conf} onChangeText={(t) => { setConf(t); setErroSenha(''); }} required error={erroSenha} />
      </BottomSheet>
    </Screen>
  );
}
