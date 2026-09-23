import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { colors, radius } from '../../theme';
import { PERFIL, STATUS } from '../../constants';
import { AVISO_ASSINATURA_DESENHADA, AVISO_TEXTO_DECLARACAO, RESSALVA_EXEMPLOS, declaracaoCliente } from '../../constants/texts';
import { useApp } from '../../store/AppContext';
import { numeroFormatado } from '../../domain/rdo';
import { formatDate, nomeDiaSemana, formatDateTime } from '../../utils/date';
import { evidenciasDoAparelho } from '../../utils/device';
import { haptic } from '../../utils/feedback';
import { Banner, Button, Card, EmptyState, Icon, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { TextField } from '../../components/form';
import CheckboxField from '../../components/form/CheckboxField';
import { RdoSections, SecondFactor, SignaturePad } from '../../components/rdo';

const OPCOES = [
  { key: 'ciencia', titulo: 'Ciente, sem ressalvas', desc: 'Registro ciência/aceite do conteúdo exibido.', icone: 'check-decagram-outline', cor: colors.success },
  { key: 'ressalva', titulo: 'Ciente, com ressalva', desc: 'Registro ciência e anexo minha ressalva, que integrará o PDF final.', icone: 'alert-decagram-outline', cor: colors.warning },
  { key: 'esclarecimento', titulo: 'Solicitar esclarecimento', desc: 'Envio uma pergunta ao responsável técnico antes de manifestar minha ciência.', icone: 'help-circle-outline', cor: colors.info },
];

// Visualização e assinatura do cliente: ciência/aceite, ressalva ou pedido de esclarecimento (seção 5, etapa 6).
export default function SignClientScreen({ route, navigation }) {
  const { rdoId } = route.params;
  const { state, actions, currentUser, online } = useApp();
  const { notice, toast } = useUI();
  const rdo = state.rdos.find((r) => r.id === rdoId);
  const obra = rdo ? state.obras.find((o) => o.id === rdo.obraId) : null;

  const [tipo, setTipo] = useState('');
  const [texto, setTexto] = useState('');
  const [aceite, setAceite] = useState(false);
  const [fator, setFator] = useState(null);
  const [assin, setAssin] = useState(null);
  const [mostrar, setMostrar] = useState(false);
  const [rolagem, setRolagem] = useState(true);
  const [salvando, setSalvando] = useState(false);

  if (!rdo || !obra || currentUser.perfil !== PERFIL.CLIENTE || rdo.status !== STATUS.ENVIADO_CLIENTE) {
    return (
      <Screen title="Ciência e aceite" back>
        <EmptyState icon="lock-outline" title="Ação indisponível" message="Este RDO não está aguardando a sua manifestação." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const num = `nº ${numeroFormatado(rdo)}`;
  const exigeTexto = tipo === 'ressalva' || tipo === 'esclarecimento';
  const assina = tipo === 'ciencia' || tipo === 'ressalva';
  const textoOk = !exigeTexto || texto.trim().length >= 10;
  const pronto = tipo && textoOk && (tipo === 'esclarecimento' || (aceite && fator && assin));
  const pendente = rdo.esclarecimentoPendente;
  const pedidoAnterior = rdo.comentarios.filter((c) => c.visibilidade === 'cliente');

  const enviar = async () => {
    if (!online) {
      await notice({ icon: 'cloud-off-outline', title: 'Sem conexão', message: 'A manifestação registra data/hora e evidências no servidor e não está disponível offline.' });
      return;
    }
    setSalvando(true);
    await new Promise((r) => setTimeout(r, 700));
    if (tipo === 'esclarecimento') {
      actions.assinarComoCliente({ rdoId, userId: currentUser.id, tipo, texto });
      haptic.success();
      toast.show({ type: 'success', title: 'Pedido enviado', message: 'O responsável técnico foi notificado e responderá pelo aplicativo.' });
      navigation.goBack();
      return;
    }
    actions.assinarComoCliente({
      rdoId, userId: currentUser.id, tipo, texto,
      assinatura: { ...assin, ...evidenciasDoAparelho(state.session.deviceId, fator.metodo) },
    });
    haptic.success();
    navigation.replace('Receipt', { rdoId, quem: 'cliente', novo: true });
  };

  const rotulo = tipo === 'esclarecimento' ? 'Enviar pedido de esclarecimento' : tipo === 'ressalva' ? 'Assinar com ressalva' : 'Assinar ciência/aceite';

  return (
    <Screen
      title="Ciência e aceite"
      subtitle={`RDO ${num} · ${obra.nome}`}
      back
      keyboard
      scrollEnabled={rolagem}
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Cancelar" variant="secondary" onPress={() => navigation.goBack()} style={{ flex: 1 }} />
          <Button title={rotulo} icon={tipo === 'esclarecimento' ? 'send-outline' : 'draw-pen'} variant="accent" disabled={!pronto} loading={salvando} onPress={enviar} style={{ flex: 2 }} />
        </View>
      }
    >
      <Banner tone="info" icon="account-tie-outline" title={`${formatDate(rdo.data)} · ${nomeDiaSemana(rdo.data)}`} message={`RDO ${num} (versão ${rdo.versao}) validado e assinado pelo responsável técnico em ${formatDateTime(rdo.assinaturas.master?.dataHora)}. Leia o conteúdo e manifeste-se.`} />
      {pendente ? <Banner tone="warning" icon="help-circle-outline" title="Pedido de esclarecimento em aberto" message="Você já solicitou esclarecimento. Aguarde a resposta do responsável técnico (aparece em Comentários) ou registre sua ciência agora." /> : null}

      <Button title={mostrar ? 'Ocultar conteúdo do RDO' : 'Ler o conteúdo completo do RDO'} icon={mostrar ? 'chevron-up' : 'file-document-outline'} variant="tonal" onPress={() => setMostrar((m) => !m)} />
      {mostrar ? <RdoSections rdo={rdo} obra={obra} rdos={state.rdos} nomeDe={(id) => state.users.find((u) => u.id === id)?.nome || ''} comentarios={rdo.comentarios.filter((c) => c.visibilidade === 'cliente')} onVerAssinatura={(q) => navigation.navigate('Receipt', { rdoId, quem: q })} /> : null}
      {pedidoAnterior.length ? <Txt v="caption" muted>Há {pedidoAnterior.length} mensagem(ns) na aba Comentários deste RDO.</Txt> : null}

      <SectionTitle>1 · Sua manifestação</SectionTitle>
      {OPCOES.map((o) => {
        const ativo = tipo === o.key;
        return (
          <Pressable
            key={o.key}
            onPress={() => { setTipo(o.key); setAceite(false); }}
            accessibilityRole="radio"
            accessibilityState={{ selected: ativo }}
            accessibilityLabel={`${o.titulo}. ${o.desc}`}
            style={[styles.opcao, ativo && { borderColor: o.cor, backgroundColor: colors.white, borderWidth: 2 }]}
          >
            <View style={[styles.opIcon, { backgroundColor: ativo ? o.cor : colors.grayBg }]}>
              <Icon name={o.icone} size={24} color={ativo ? colors.white : colors.textMuted} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Txt v="bodyStrong">{o.titulo}</Txt>
              <Txt v="small" muted>{o.desc}</Txt>
            </View>
            <Icon name={ativo ? 'radiobox-marked' : 'radiobox-blank'} size={24} color={ativo ? o.cor : colors.borderStrong} />
          </Pressable>
        );
      })}

      {exigeTexto ? (
        <View style={{ gap: 8 }}>
          <TextField
            label={tipo === 'ressalva' ? 'Sua ressalva' : 'Sua dúvida'}
            required
            multiline
            value={texto}
            onChangeText={setTexto}
            maxLength={600}
            placeholder={tipo === 'ressalva' ? 'Descreva a ressalva de forma objetiva.' : 'Qual ponto precisa de esclarecimento?'}
            help={tipo === 'ressalva' ? 'A ressalva integrará o PDF final e ficará visível ao responsável técnico.' : undefined}
            error={texto && texto.trim().length < 10 ? 'Descreva com ao menos 10 caracteres.' : undefined}
          />
          {tipo === 'ressalva' ? (
            <View style={{ gap: 6 }}>
              <Txt v="caption" muted>Exemplos (toque para usar):</Txt>
              {RESSALVA_EXEMPLOS.map((e) => (
                <Pressable key={e} onPress={() => setTexto(e)} accessibilityRole="button" accessibilityLabel={`Usar exemplo: ${e}`} style={styles.exemplo}>
                  <Txt v="small" color={colors.navy600}>{e}</Txt>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {assina ? (
        <>
          <SectionTitle>2 · Declaração</SectionTitle>
          <Card tone="gold" style={{ gap: 10 }}>
            <Txt v="body" color={colors.goldText}>{declaracaoCliente(tipo, num, rdo.versao)}</Txt>
            {tipo === 'ressalva' && texto.trim() ? <Txt v="small" color={colors.goldText}>Ressalva: “{texto.trim()}”</Txt> : null}
            <Txt v="caption" color={colors.goldText}>{AVISO_TEXTO_DECLARACAO}</Txt>
          </Card>
          <CheckboxField label="Li o conteúdo e aceito a declaração acima" required value={aceite} onValueChange={setAceite} />

          <SectionTitle>3 · Confirme sua identidade</SectionTitle>
          <SecondFactor usuario={currentUser} verificado={fator} onVerificado={setFator} />

          <SectionTitle>4 · Assinatura</SectionTitle>
          <SignaturePad value={assin} onChange={setAssin} onDrawingChange={(d) => setRolagem(!d)} />
          <Banner tone="neutral" icon="information-outline" message={AVISO_ASSINATURA_DESENHADA} />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  opcao: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.white, minHeight: 72 },
  opIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  exemplo: { padding: 10, borderRadius: radius.md, backgroundColor: colors.blue50, borderWidth: 1, borderColor: colors.blue100 },
});
