import React, { useState } from 'react';
import { View } from 'react-native';
import { colors } from '../../theme';
import { POLITICA_PRIVACIDADE, TERMOS_USO } from '../../constants/texts';
import { useApp } from '../../store/AppContext';
import { haptic } from '../../utils/feedback';
import { primeiroNome } from '../../utils/format';
import { Banner, Button, Card, Icon, Screen, SegmentedTabs, SectionTitle, Txt } from '../../components/ui';
import CheckboxField from '../../components/form/CheckboxField';

// Aceite de termos e LGPD (seção 13 — "Login, recuperação de acesso e aceite de termos").
// Também serve como consulta (readOnly) a partir de Configurações.
export default function TermsScreen({ route, navigation }) {
  const readOnly = route?.params?.readOnly;
  const { currentUser, actions } = useApp();
  const [aba, setAba] = useState('termos');
  const [termos, setTermos] = useState(false);
  const [privacidade, setPrivacidade] = useState(false);
  const [localizacao, setLocalizacao] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [tocou, setTocou] = useState(false);

  const conteudo = aba === 'termos' ? TERMOS_USO : POLITICA_PRIVACIDADE;

  const aceitar = () => {
    setTocou(true);
    if (!termos || !privacidade) {
      haptic.warning();
      return;
    }
    if (whatsapp) actions.atualizarCanais({ userId: currentUser.id, canais: { whatsapp: true } });
    actions.aceitarTermos({ userId: currentUser.id, opcoes: { localizacao, whatsapp } });
    haptic.success();
  };

  return (
    <Screen
      title={readOnly ? 'Termos e privacidade' : 'Termos de uso e privacidade'}
      subtitle={readOnly ? 'Consulta' : `Olá, ${primeiroNome(currentUser?.nome || '')} — antes de continuar`}
      back={readOnly}
      footer={
        readOnly ? undefined : (
          <>
            <Button title="Aceitar e continuar" icon="check-decagram-outline" onPress={aceitar} size="lg" />
            <Button title="Recusar e sair" variant="ghost" size="sm" onPress={() => actions.sair()} />
          </>
        )
      }
    >
      {!readOnly ? <Banner tone="info" message="Para usar o RDO Mobile você precisa ler e aceitar os termos abaixo. O aceite fica registrado com data e hora." /> : null}
      <SegmentedTabs
        items={[
          { key: 'termos', label: 'Termos de uso', icon: 'file-document-outline' },
          { key: 'privacidade', label: 'Privacidade (LGPD)', icon: 'shield-lock-outline' },
        ]}
        value={aba}
        onChange={setAba}
      />
      <Card style={{ gap: 14 }}>
        {conteudo.map((s) => (
          <View key={s.titulo} style={{ gap: 4 }}>
            <Txt v="h3" color={colors.navy600}>
              {s.titulo}
            </Txt>
            <Txt v="body" muted>
              {s.texto}
            </Txt>
          </View>
        ))}
      </Card>

      {!readOnly ? (
        <>
          <SectionTitle>Seus aceites</SectionTitle>
          <CheckboxField
            label="Li e aceito os Termos de uso"
            required
            value={termos}
            onValueChange={setTermos}
            error={tocou && !termos ? 'Aceite obrigatório para continuar.' : undefined}
          />
          <CheckboxField
            label="Li e aceito a Política de privacidade"
            required
            value={privacidade}
            onValueChange={setPrivacidade}
            error={tocou && !privacidade ? 'Aceite obrigatório para continuar.' : undefined}
          />
          <CheckboxField
            label="Permitir localização nas fotos (opcional)"
            description="Só é registrada quando você ativa foto a foto. Você pode mudar isso depois."
            value={localizacao}
            onValueChange={setLocalizacao}
          />
          <CheckboxField
            label="Receber avisos por WhatsApp (opcional)"
            description="Canal adicional sujeito a provedor e custo. Push e e-mail já estão ativos."
            value={whatsapp}
            onValueChange={setWhatsapp}
          />
        </>
      ) : (
        <Card tone="soft" style={{ flexDirection: 'row', gap: 10 }}>
          <Icon name="information-outline" size={20} color={colors.navy600} />
          <Txt v="small" muted style={{ flex: 1 }}>
            Este é um texto de exemplo para o protótipo. Termos e base legal definitivos devem ser validados pelo controlador dos dados (empresa).
          </Txt>
        </Card>
      )}
    </Screen>
  );
}
