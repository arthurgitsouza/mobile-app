import React, { useState } from 'react';
import { View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../../theme';
import { TIPOS_CIENCIA } from '../../constants';
import { useApp } from '../../store/AppContext';
import { hashCurto, payloadVerificacao, verificarIntegridade } from '../../domain/integridade';
import { numeroFormatado } from '../../domain/rdo';
import { formatDateTime, FUSO_OBRA_LABEL } from '../../utils/date';
import { Badge, Banner, Button, Card, EmptyState, Icon, KeyValue, Screen, SectionTitle, Txt, useUI } from '../../components/ui';
import { QRCodeView, SignatureView } from '../../components/rdo';

// Comprovante de assinatura: identidade, data/hora, versão, IP, dispositivo, 2º fator, hash e QR de verificação.
export default function ReceiptScreen({ route, navigation }) {
  const { rdoId, quem = 'master', novo } = route.params;
  const { state } = useApp();
  const { toast } = useUI();
  const [check, setCheck] = useState(null);
  const rdo = state.rdos.find((r) => r.id === rdoId);
  const obra = rdo ? state.obras.find((o) => o.id === rdo.obraId) : null;
  const assin = rdo?.assinaturas?.[quem];

  if (!rdo || !assin) {
    return (
      <Screen title="Comprovante" back>
        <EmptyState icon="file-sign" title="Sem assinatura" message="Este RDO ainda não possui esta assinatura." actionLabel="Voltar" onAction={() => navigation.goBack()} />
      </Screen>
    );
  }

  const cliente = quem === 'cliente';
  const tipo = cliente ? TIPOS_CIENCIA[assin.tipo] : null;
  const hashMostrado = cliente && rdo.hashFinal ? rdo.hashFinal : rdo.hashTecnico;

  const copiar = async () => {
    try {
      await Clipboard.setStringAsync(hashMostrado);
      toast.show({ type: 'success', title: 'Hash copiado', message: 'SHA-256 copiado para a área de transferência.' });
    } catch (e) {
      toast.show({ type: 'info', title: 'Não foi possível copiar', message: hashMostrado });
    }
  };

  return (
    <Screen
      title="Comprovante de assinatura"
      subtitle={`RDO nº ${numeroFormatado(rdo)} · ${obra?.nome}`}
      back
      footer={
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Ver PDF" icon="file-pdf-box" variant="secondary" onPress={() => navigation.navigate('PdfViewer', { rdoId })} style={{ flex: 1 }} />
          <Button title={novo ? 'Concluir' : 'Voltar'} icon="check" onPress={() => (novo ? navigation.replace('RdoDetail', { rdoId }) : navigation.goBack())} style={{ flex: 1 }} />
        </View>
      }
    >
      {novo ? (
        <View style={{ alignItems: 'center', gap: 6, paddingVertical: 6 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="check-decagram" size={40} color={colors.success} />
          </View>
          <Txt v="h2" style={{ textAlign: 'center' }}>
            {cliente ? (assin.tipo === 'ressalva' ? 'Ciência registrada com ressalva' : 'Ciência/aceite registrado') : 'RDO validado e assinado'}
          </Txt>
          <Txt v="small" muted style={{ textAlign: 'center' }}>
            {cliente
              ? 'O RDO foi finalizado e o PDF final com a sua manifestação está disponível.'
              : rdo.status === 'enviado_cliente'
                ? 'A versão técnica foi fechada e o cliente foi notificado para ciência/aceite.'
                : 'A versão técnica foi fechada. Envie ao cliente quando quiser.'}
          </Txt>
        </View>
      ) : null}

      <Card style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt v="label" color={colors.navy600} style={{ flex: 1 }}>
            {cliente ? 'CIÊNCIA/ACEITE DO CLIENTE' : 'VALIDAÇÃO E CHANCELA DO MASTER'}
          </Txt>
          {tipo ? <Badge label={tipo.curto} icon={tipo.icone} color={assin.tipo === 'ressalva' ? colors.warning : colors.success} bg={assin.tipo === 'ressalva' ? colors.warningBg : colors.successBg} size="sm" /> : null}
        </View>
        <SignatureView dados={assin} height={84} />
        <KeyValue inline label="Signatário" value={assin.nome} />
        <KeyValue inline label="Perfil" value={cliente ? 'Cliente' : 'Master'} />
        <KeyValue inline label="Data e hora" value={formatDateTime(assin.dataHora)} />
        <KeyValue inline label="Fuso" value={FUSO_OBRA_LABEL} />
        <KeyValue inline label="Versão do RDO" value={`v${assin.versao}`} />
        <KeyValue inline label="Segundo fator" value={assin.metodo2fa === 'biometria' ? 'Biometria do aparelho' : 'Código de uso único'} />
        <KeyValue inline label="IP" value={assin.ip} />
        <KeyValue inline label="Dispositivo" value={assin.dispositivo} />
        {assin.texto ? <Banner tone="gold" icon="alert-decagram-outline" title="Ressalva registrada" message={assin.texto} /> : null}
      </Card>

      <SectionTitle>Declaração aceita (texto exato)</SectionTitle>
      <Card tone="gold">
        <Txt v="small" color={colors.goldText}>
          {assin.declaracao}
        </Txt>
      </Card>

      <SectionTitle>Verificação de integridade</SectionTitle>
      <Card style={{ gap: 12, alignItems: 'center' }}>
        <QRCodeView value={payloadVerificacao(rdo)} size={148} />
        <Txt v="caption" muted style={{ textAlign: 'center' }}>
          {cliente && rdo.hashFinal ? 'Hash final do documento (conteúdo + assinaturas)' : 'Hash do conteúdo técnico fechado na assinatura'}
        </Txt>
        <Txt v="small" mono selectable style={{ textAlign: 'center' }}>
          {hashMostrado}
        </Txt>
        <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
          <Button title="Copiar hash" icon="content-copy" variant="secondary" size="sm" onPress={copiar} style={{ flex: 1 }} />
          <Button title="Verificar agora" icon="shield-search" variant="tonal" size="sm" onPress={() => setCheck(verificarIntegridade(rdo))} style={{ flex: 1 }} />
        </View>
        {check ? (
          check.ok ? (
            <Banner tone="success" icon="shield-check" title="Documento íntegro" message={`O hash recalculado (${hashCurto(check.calculado, 12)}) confere com o registrado na assinatura.`} style={{ alignSelf: 'stretch' }} />
          ) : (
            <Banner tone="danger" icon="shield-alert" title="Divergência detectada" message="O conteúdo não corresponde ao hash assinado." style={{ alignSelf: 'stretch' }} />
          )
        ) : null}
      </Card>

      <Banner tone="neutral" icon="information-outline" message="O desenho é apenas a representação visual da assinatura. A validade do ato decorre da sessão autenticada, do segundo fator e destas evidências." />
    </Screen>
  );
}
