import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme';
import { PERFIL, PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { addDays, hojeObra, nomesDiasCurtos } from '../../utils/date';
import { toNumber, uid } from '../../utils/format';
import { haptic } from '../../utils/feedback';
import { Banner, Button, Card, EmptyState, LinkButton, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { ChipGroup, DateField, NumberField, SelectField, SwitchField, TextField } from '../../components/form';

const STATUS_OPCOES = [
  { value: 'ativa', label: 'Ativa' },
  { value: 'paralisada', label: 'Paralisada' },
  { value: 'concluida', label: 'Concluída' },
];

// Cadastro de obra (RF-02): contrato/OS, cliente, RT, período, dias úteis e vínculo de usuários por obra (RF-03).
export default function ObraFormScreen({ route, navigation }) {
  const obraId = route.params?.obraId;
  const { state, actions, currentUser } = useApp();
  const { toast } = useUI();
  const existente = obraId ? state.obras.find((o) => o.id === obraId) : null;

  const [f, setF] = useState(() =>
    existente
      ? { ...existente, avancoFisico: String(existente.avancoFisico ?? 0), avancoPrevisto: String(existente.avancoPrevisto ?? 0) }
      : {
          id: uid('obra'), nome: '', descricao: '', contrato: '', os: '', clienteId: state.clientes[0]?.id || '', endereco: '', inicio: hojeObra(), inicioRegistro: hojeObra(), fim: addDays(hojeObra(), 180),
          engenheiroRTId: currentUser.id, diasUteis: [1, 2, 3, 4, 5, 6], exigeAssinaturaOperacional: false, status: 'ativa', avancoFisico: '0', avancoPrevisto: '0', usuarioIds: [],
        },
  );
  const [erros, setErros] = useState({});
  const set = (k) => (v) => {
    setF((d) => ({ ...d, [k]: v }));
    if (erros[k]) setErros((e) => ({ ...e, [k]: undefined }));
  };

  const masters = state.users.filter((u) => u.perfil === PERFIL.MASTER && u.ativo);
  const vinculaveis = useMemo(() => state.users.filter((u) => u.perfil !== PERFIL.MASTER && u.ativo), [state.users]);

  if (currentUser.perfil !== PERFIL.MASTER) {
    return (
      <Screen title="Obra" back>
        <EmptyState icon="lock-outline" title="Acesso restrito" message="Somente o usuário Master cadastra e edita obras." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const salvar = () => {
    const e = {};
    if (!f.nome.trim()) e.nome = 'Informe o nome da obra.';
    if (!f.contrato.trim()) e.contrato = 'Informe o contrato.';
    if (!f.clienteId) e.clienteId = 'Selecione o cliente.';
    if (!f.endereco.trim()) e.endereco = 'Informe o endereço.';
    if (!f.inicio || !f.fim || f.fim < f.inicio) e.fim = 'O fim do contrato deve ser posterior ao início.';
    if (!f.diasUteis.length) e.diasUteis = 'Selecione ao menos um dia útil.';
    setErros(e);
    if (Object.keys(e).length) {
      haptic.warning();
      return;
    }
    actions.salvarObra({
      userId: currentUser.id,
      obra: { ...f, nome: f.nome.trim(), avancoFisico: Math.max(0, Math.min(100, toNumber(f.avancoFisico))), avancoPrevisto: Math.max(0, Math.min(100, toNumber(f.avancoPrevisto))) },
    });
    haptic.success();
    toast.show({ type: 'success', title: existente ? 'Obra atualizada' : 'Obra cadastrada', message: `${f.nome.trim()} · ${f.usuarioIds.length} usuário(s) vinculado(s).` });
    navigation.goBack();
  };

  return (
    <Screen
      title={existente ? 'Editar obra' : 'Nova obra'}
      subtitle={existente ? existente.nome : 'Cadastro de obra e vínculos'}
      back
      keyboard
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title={existente ? 'Salvar alterações' : 'Cadastrar obra'} icon="check" onPress={salvar} style={{ flex: 1.6 }} />
        </View>
      }
      hideFooterOnKeyboard
    >
      <Txt v="caption" subtle>
        Campos com * são obrigatórios.
      </Txt>
      <SectionTitle>Identificação</SectionTitle>
      <TextField label="Nome da obra" required value={f.nome} onChangeText={set('nome')} error={erros.nome} placeholder="Ex.: Obra Alfa" autoCapitalize="words" />
      <TextField label="Descrição" value={f.descricao} onChangeText={set('descricao')} placeholder="Ex.: Residencial Alfa — Bloco A" />
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <TextField label="Contrato" required value={f.contrato} onChangeText={set('contrato')} error={erros.contrato} placeholder="CT-014" autoCapitalize="characters" />
        </View>
        <View style={{ flex: 1 }}>
          <TextField label="OS" value={f.os} onChangeText={set('os')} placeholder="OS 021/2026" autoCapitalize="characters" />
        </View>
      </View>
      <SelectField
        label="Cliente"
        required
        value={f.clienteId}
        onChange={set('clienteId')}
        options={state.clientes.map((c) => ({ value: c.id, label: c.nome }))}
        error={erros.clienteId}
        help="Cadastre novos clientes em Mais → Cadastros → Clientes."
      />
      <TextField label="Endereço" required value={f.endereco} onChangeText={set('endereco')} error={erros.endereco} multiline placeholder="Rua, número, bairro, cidade/UF" />

      <SectionTitle>Prazo e responsável</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <DateField label="Início" required value={f.inicio} onChange={set('inicio')} />
        </View>
        <View style={{ flex: 1 }}>
          <DateField label="Fim previsto" required value={f.fim} onChange={set('fim')} error={erros.fim} />
        </View>
      </View>
      <DateField label="Registro digital a partir de" value={f.inicioRegistro || f.inicio} onChange={set('inicioRegistro')} help="Primeiro dia em que o RDO passa a ser exigido no aplicativo (base do cálculo de RDOs previstos e atrasados)." />
      <SelectField label="Engenheiro / RT" required value={f.engenheiroRTId} onChange={set('engenheiroRTId')} options={masters.map((m) => ({ value: m.id, label: m.nome }))} />
      <ChipGroup
        label="Dias úteis da obra"
        required
        multi
        options={[1, 2, 3, 4, 5, 6, 0].map((d) => ({ value: d, label: nomesDiasCurtos[d] }))}
        value={f.diasUteis}
        onChange={set('diasUteis')}
        error={erros.diasUteis}
        help="Define os dias em que se espera um RDO (cálculo de atrasos)."
      />
      <ChipGroup label="Situação da obra" required options={STATUS_OPCOES} value={f.status} onChange={set('status')} />

      <SectionTitle>Avanço (opcional)</SectionTitle>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <View style={{ flex: 1 }}>
          <NumberField label="Físico" value={f.avancoFisico} onChangeText={set('avancoFisico')} suffix="%" />
        </View>
        <View style={{ flex: 1 }}>
          <NumberField label="Previsto" value={f.avancoPrevisto} onChangeText={set('avancoPrevisto')} suffix="%" />
        </View>
      </View>

      <SectionTitle>Regras de assinatura</SectionTitle>
      <SwitchField label="Exigir assinatura do operacional" description="O responsável pelo preenchimento assina o RDO na revisão antes do envio ao master." value={f.exigeAssinaturaOperacional} onValueChange={set('exigeAssinaturaOperacional')} />

      <SectionTitle>Usuários vinculados (permissão por obra)</SectionTitle>
      <Banner tone="info" message="Operacionais preenchem os RDOs desta obra; clientes visualizam e assinam apenas os RDOs liberados. O Master acessa todas as obras." />
      <Card style={{ gap: 4 }}>
        {vinculaveis.map((u) => {
          const on = f.usuarioIds.includes(u.id);
          return (
            <View key={u.id} style={{ paddingVertical: 2 }}>
              <SwitchField
                label={u.nome}
                description={`${PERFIS[u.perfil].label} · ${u.cargo}`}
                value={on}
                onValueChange={(v) => set('usuarioIds')(v ? [...f.usuarioIds, u.id] : f.usuarioIds.filter((x) => x !== u.id))}
                style={{ borderWidth: 0, backgroundColor: on ? colors.blue50 : colors.white }}
              />
            </View>
          );
        })}
        <LinkButton title="Cadastrar novo usuário" icon="account-plus-outline" onPress={() => navigation.navigate('UserForm')} />
      </Card>
    </Screen>
  );
}
