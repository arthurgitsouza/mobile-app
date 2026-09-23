import React, { useState } from 'react';
import { View } from 'react-native';
import { PERFIL, PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { isEmail, maskPhone, uid } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Banner, Button, Card, EmptyState, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { ChipGroup, SelectField, SwitchField, TextField } from '../../components/form';

// Cadastro de usuário: perfil, contato, cliente (quando perfil Cliente) e vínculo por obra.
export default function UserFormScreen({ route, navigation }) {
  const userId = route.params?.userId;
  const { state, actions, currentUser } = useApp();
  const { confirm, notice, toast } = useUI();
  const existente = userId ? state.users.find((u) => u.id === userId) : null;
  const proprio = existente?.id === currentUser.id;

  const [f, setF] = useState(() =>
    existente
      ? { ...existente }
      : { id: uid('u'), nome: '', email: '', telefone: '', cargo: '', perfil: PERFIL.OPERACIONAL, clienteId: state.clientes[0]?.id || '', ativo: true },
  );
  const [obraIds, setObraIds] = useState(() => (existente ? state.obras.filter((o) => (o.usuarioIds || []).includes(existente.id)).map((o) => o.id) : []));
  const [erros, setErros] = useState({});
  const set = (k) => (v) => {
    setF((d) => ({ ...d, [k]: v }));
    if (erros[k]) setErros((e) => ({ ...e, [k]: undefined }));
  };

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Usuário" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" message="Somente o usuário Master gerencia usuários." />
      </Screen>
    );
  }

  const salvar = () => {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Informe o nome.';
    if (!isEmail(f.email)) e.email = 'Informe um e-mail válido.';
    else if (state.users.some((u) => u.id !== f.id && u.email.toLowerCase() === f.email.trim().toLowerCase())) e.email = 'Já existe um usuário com este e-mail.';
    if (f.perfil === PERFIL.CLIENTE && !f.clienteId) e.clienteId = 'Selecione o cliente (empresa).';
    setErros(e);
    if (Object.keys(e).length) {
      haptic.warning();
      return;
    }
    actions.salvarUsuario({ userId: currentUser.id, usuario: { ...f, nome: f.nome.trim(), email: f.email.trim().toLowerCase() }, obraIds: f.perfil === PERFIL.MASTER ? [] : obraIds });
    haptic.success();
    toast.show({ type: 'success', title: existente ? 'Usuário atualizado' : 'Usuário cadastrado', message: existente ? undefined : 'Convite enviado por e-mail (simulado). Senha temporária: 123456.' });
    navigation.goBack();
  };

  const alternarAtivo = async (ativo) => {
    if (proprio) return notice({ title: 'Ação não permitida', message: 'Você não pode bloquear a própria conta.' });
    const ok = await confirm({ destructive: !ativo, title: ativo ? 'Reativar usuário?' : 'Bloquear usuário?', message: ativo ? 'O usuário volta a acessar o aplicativo.' : 'O usuário perde o acesso imediatamente. O histórico e as assinaturas são preservados.', confirmLabel: ativo ? 'Reativar' : 'Bloquear' });
    if (ok) {
      actions.alternarUsuarioAtivo({ id: f.id, userId: currentUser.id });
      setF((d) => ({ ...d, ativo }));
    }
    return undefined;
  };

  const redefinir = async () => {
    const ok = await confirm({ title: 'Redefinir senha?', message: 'A senha volta para a temporária (123456) e o usuário deverá alterá-la no próximo acesso (simulado).', confirmLabel: 'Redefinir' });
    if (ok) {
      actions.alterarSenha({ userId: f.id, senha: '123456' });
      toast.show({ type: 'success', title: 'Senha redefinida', message: 'Convite de redefinição enviado por e-mail (simulado).' });
    }
  };

  return (
    <Screen
      title={existente ? 'Editar usuário' : 'Novo usuário'}
      subtitle={existente?.nome}
      back
      keyboard
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title={existente ? 'Salvar' : 'Cadastrar e convidar'} icon="check" onPress={salvar} style={{ flex: 1.6 }} />
        </View>
      }
      hideFooterOnKeyboard
    >
      <TextField label="Nome completo" required value={f.nome} onChangeText={set('nome')} error={erros.nome} autoCapitalize="words" />
      <TextField label="E-mail" required value={f.email} onChangeText={set('email')} error={erros.email} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} prefixIcon="email-outline" />
      <TextField label="Telefone / WhatsApp" value={f.telefone} onChangeText={(t) => set('telefone')(maskPhone(t))} keyboardType="phone-pad" prefixIcon="phone-outline" placeholder="(98) 90000-0000" />
      <TextField label="Cargo / função" value={f.cargo} onChangeText={set('cargo')} autoCapitalize="words" placeholder="Ex.: Mestre de obras" />

      <ChipGroup
        label="Perfil de acesso"
        required
        options={Object.values(PERFIS).map((p) => ({ value: p.key, label: p.label, icone: p.icone }))}
        value={f.perfil}
        onChange={(v) => !proprio && set('perfil')(v)}
        help={proprio ? 'Você não pode alterar o próprio perfil.' : PERFIS[f.perfil].descricao}
      />
      {f.perfil === PERFIL.CLIENTE ? <SelectField label="Cliente (empresa)" required value={f.clienteId} onChange={set('clienteId')} options={state.clientes.map((c) => ({ value: c.id, label: c.nome }))} error={erros.clienteId} /> : null}

      {f.perfil === PERFIL.MASTER ? (
        <Banner tone="info" message="O perfil Master acessa todas as obras e RDOs da empresa." />
      ) : (
        <>
          <SectionTitle>Obras vinculadas</SectionTitle>
          <Card style={{ gap: 8 }}>
            {state.obras.map((o) => (
              <SwitchField key={o.id} label={o.nome} description={`${o.descricao} · ${o.contrato}`} value={obraIds.includes(o.id)} onValueChange={(v) => setObraIds((cur) => (v ? [...cur, o.id] : cur.filter((x) => x !== o.id)))} style={{ borderWidth: 0 }} />
            ))}
            <Txt v="caption" muted>
              {f.perfil === PERFIL.OPERACIONAL ? 'O operacional só cria e preenche RDOs das obras marcadas.' : 'O cliente só vê RDOs liberados das obras marcadas.'}
            </Txt>
          </Card>
        </>
      )}

      {existente ? (
        <>
          <SectionTitle>Acesso</SectionTitle>
          <SwitchField label="Usuário ativo" description={proprio ? 'Sua própria conta não pode ser bloqueada.' : 'Bloquear impede o login; o histórico é preservado.'} value={f.ativo} onValueChange={alternarAtivo} disabled={proprio} />
          <Button title="Redefinir senha" icon="lock-reset" variant="secondary" onPress={redefinir} />
        </>
      ) : (
        <Banner tone="gold" icon="email-fast-outline" message="Após cadastrar, o usuário recebe um convite por e-mail (simulado) com a senha temporária 123456." />
      )}
    </Screen>
  );
}
