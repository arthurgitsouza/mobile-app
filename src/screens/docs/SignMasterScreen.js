import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme';
import { PERFIL, STATUS } from '../../constants';
import { AVISO_ASSINATURA_DESENHADA, AVISO_TEXTO_DECLARACAO, declaracaoMaster } from '../../constants/texts';
import { useApp } from '../../store/AppContext';
import { conteudoTecnico, numeroFormatado, resumoEquipamentos, totalHomemHora, totalTrabalhadores } from '../../domain/rdo';
import { hashOf } from '../../utils/object';
import { formatDate, nomeDiaSemana } from '../../utils/date';
import { formatNumber } from '../../utils/format';
import { evidenciasDoAparelho } from '../../utils/device';
import { haptic } from '../../utils/feedback';
import { Banner, Button, Card, EmptyState, KeyValue, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { SwitchField } from '../../components/form';
import CheckboxField from '../../components/form/CheckboxField';
import { RdoSections, SecondFactor, SignaturePad } from '../../components/rdo';

// Validação, chancela e assinatura do master (seção 5, etapa 4; seção 11).
export default function SignMasterScreen({ route, navigation }) {
  const { rdoId } = route.params;
  const { state, actions, currentUser, online } = useApp();
  const { notice } = useUI();
  const rdo = state.rdos.find((r) => r.id === rdoId);
  const obra = rdo ? state.obras.find((o) => o.id === rdo.obraId) : null;

  const [aceite, setAceite] = useState(false);
  const [fator, setFator] = useState(null);
  const [assin, setAssin] = useState(null);
  const [enviarAgora, setEnviarAgora] = useState(true);
  const [email, setEmail] = useState(true);
  const [whats, setWhats] = useState(false);
  const [mostrar, setMostrar] = useState(false);
  const [rolagem, setRolagem] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const hashPrevio = useMemo(() => (rdo ? hashOf(conteudoTecnico(rdo)) : ''), [rdo]);

  if (!rdo || !obra || currentUser.perfil !== PERFIL.MASTER || ![STATUS.SUBMETIDO, STATUS.EM_ANALISE].includes(rdo.status)) {
    return (
      <Screen title="Validar e assinar" back>
        <EmptyState icon="lock-outline" title="Ação indisponível" message="Este RDO não está aguardando validação do master." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const clientes = state.users.filter((u) => u.perfil === PERFIL.CLIENTE && u.ativo && (obra.usuarioIds || []).includes(u.id));
  const temWhats = clientes.some((c) => c.canais?.whatsapp);
  const num = `nº ${numeroFormatado(rdo)}`;
  const pronto = aceite && fator && assin;
  const eq = resumoEquipamentos(rdo);

  const assinar = async () => {
    if (!online) {
      await notice({ icon: 'cloud-off-outline', title: 'Sem conexão', message: 'A assinatura registra data/hora e evidências no servidor e não está disponível offline.' });
      return;
    }
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 700));
    const canais = ['app', ...(email ? ['email'] : []), ...(whats && temWhats ? ['whatsapp'] : [])];
    actions.validarEAssinar({
      rdoId, userId: currentUser.id, enviarAgora, canais,
      assinatura: { ...assin, ...evidenciasDoAparelho(state.session.deviceId, fator.metodo) },
    });
    haptic.success();
    navigation.replace('Receipt', { rdoId, quem: 'master', novo: true });
  };

  return (
    <Screen
      title="Validar e assinar"
      subtitle={`RDO ${num} · ${obra.nome}`}
      back
      keyboard
      scrollEnabled={rolagem}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title="Assinar e validar" icon="check-decagram-outline" variant="accent" disabled={!pronto} loading={salvando} onPress={assinar} style={{ flex: 1.7 }} />
        </View>
      }
    >
      <Banner tone="gold" icon="lock-check-outline" title="Você fechará a versão técnica" message="Após a assinatura, o conteúdo fica bloqueado e qualquer correção gerará retificação vinculada, com histórico preservado." />

      <SectionTitle>1 · O que você está assinando</SectionTitle>
      <Card style={{ gap: 8 }}>
        <KeyValue inline label="RDO / versão" value={`${num} · v${rdo.versao}`} />
        <KeyValue inline label="Obra" value={obra.nome} />
        <KeyValue inline label="Data" value={`${formatDate(rdo.data)} · ${nomeDiaSemana(rdo.data)}`} />
        <KeyValue inline label="Efetivo / homem-hora" value={`${totalTrabalhadores(rdo)} · ${formatNumber(totalHomemHora(rdo), 0)} h`} />
        <KeyValue inline label="Equipamentos / atividades" value={`${eq.unidades} · ${rdo.atividades.length}`} />
        <KeyValue inline label="Fotos / ocorrências" value={`${rdo.fotos.length} · ${rdo.ocorrencias.length}`} />
        <Button title={mostrar ? 'Ocultar conteúdo completo' : 'Ler o conteúdo completo antes de assinar'} icon={mostrar ? 'chevron-up' : 'file-document-outline'} variant="tonal" size="sm" onPress={() => setMostrar((m) => !m)} />
      </Card>
      {mostrar ? <RdoSections rdo={rdo} obra={obra} rdos={state.rdos} nomeDe={(id) => state.users.find((u) => u.id === id)?.nome || ''} comentarios={rdo.comentarios} /> : null}

      <Card tone="soft" style={{ gap: 4 }}>
        <Txt v="label" color={colors.navy600}>
          IMPRESSÃO DIGITAL (SHA-256) DO CONTEÚDO
        </Txt>
        <Txt v="small" mono selectable style={{ lineHeight: 18 }}>
          {hashPrevio}
        </Txt>
        <Txt v="caption" muted>
          Este hash será gravado na assinatura. Qualquer alteração posterior do conteúdo mudaria este valor e seria detectada.
        </Txt>
      </Card>

      <SectionTitle>2 · Declaração</SectionTitle>
      <Card tone="gold" style={{ gap: 10 }}>
        <Txt v="body" color={colors.goldText}>
          {declaracaoMaster(num, rdo.versao)}
        </Txt>
        <Txt v="caption" color={colors.goldText}>
          {AVISO_TEXTO_DECLARACAO}
        </Txt>
      </Card>
      <CheckboxField label="Li o conteúdo e aceito a declaração acima" required value={aceite} onValueChange={setAceite} />

      <SectionTitle>3 · Confirme sua identidade</SectionTitle>
      <SecondFactor usuario={currentUser} verificado={fator} onVerificado={setFator} />

      <SectionTitle>4 · Assinatura</SectionTitle>
      <SignaturePad value={assin} onChange={setAssin} onDrawingChange={(d) => setRolagem(!d)} />
      <Banner tone="neutral" icon="information-outline" message={AVISO_ASSINATURA_DESENHADA} />

      <SectionTitle>5 · Após assinar</SectionTitle>
      <SwitchField label="Enviar ao cliente agora" description="O sistema fecha a versão e notifica o cliente para ciência/aceite. Desligue para enviar depois." value={enviarAgora} onValueChange={setEnviarAgora} />
      {enviarAgora ? (
        <Card style={{ gap: 10 }}>
          <Txt v="smallStrong">Destinatários</Txt>
          {clientes.length ? (
            clientes.map((c) => (
              <Txt key={c.id} v="small" muted>
                {c.nome} · {c.email}
              </Txt>
            ))
          ) : (
            <Banner tone="warning" message="Nenhum cliente vinculado a esta obra: o RDO ficará como “Validado” até você vincular e enviar." />
          )}
          <CheckboxField label="E-mail com link seguro" value={email} onValueChange={setEmail} plain />
          <CheckboxField label="WhatsApp (opcional)" description={temWhats ? 'Integração opcional, sujeita a provedor, custo e consentimento.' : 'Sem consentimento dos destinatários.'} value={whats && temWhats} onValueChange={setWhats} disabled={!temWhats} plain />
        </Card>
      ) : null}
      {!pronto ? (
        <Txt v="caption" muted style={{ textAlign: 'center' }}>
          Para assinar: aceite a declaração, confirme o segundo fator e desenhe a assinatura.
        </Txt>
      ) : null}
    </Screen>
  );
}
