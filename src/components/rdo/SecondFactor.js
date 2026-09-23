import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../../theme';
import { autenticarBiometria, biometriaDisponivel } from '../../services/biometrics';
import { haptic } from '../../utils/feedback';
import { mascararEmail } from '../../utils/format';
import { formatTime, nowISO } from '../../utils/date';
import { Banner, Button, Card, Icon, Txt } from '../ui';

const MAX_TENTATIVAS = 5;

/**
 * Segundo fator para atos críticos (seção 11): código de uso único (e-mail simulado) ou biometria do aparelho.
 * onVerificado(metodo) é chamado uma vez; `verificado` mantém o estado no pai.
 */
export default function SecondFactor({ usuario, verificado, onVerificado }) {
  const [codigo, setCodigo] = useState(null);
  const [digitado, setDigitado] = useState('');
  const [erro, setErro] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [espera, setEspera] = useState(0);
  const [bio, setBio] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    biometriaDisponivel().then(setBio);
  }, []);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const enviar = () => {
    setCodigo(String(Math.floor(100000 + Math.random() * 900000)));
    setDigitado('');
    setErro('');
    setEspera(30);
    haptic.tap();
  };

  const conferir = () => {
    if (digitado === codigo) {
      haptic.success();
      onVerificado({ metodo: 'otp', em: nowISO() });
      return;
    }
    haptic.error();
    const n = tentativas + 1;
    setTentativas(n);
    if (n >= MAX_TENTATIVAS) {
      setCodigo(null);
      setTentativas(0);
      setErro('Muitas tentativas incorretas. Solicite um novo código.');
    } else setErro(`Código incorreto. Restam ${MAX_TENTATIVAS - n} tentativas.`);
  };

  const usarBiometria = async () => {
    const ok = await autenticarBiometria('Confirme sua identidade para assinar');
    if (ok) {
      haptic.success();
      onVerificado({ metodo: 'biometria', em: nowISO() });
    } else setErro('Não foi possível confirmar a biometria. Use o código de uso único.');
  };

  if (verificado) {
    return (
      <Card tone="success" style={styles.ok}>
        <Icon name="shield-check" size={26} color={colors.success} />
        <View style={{ flex: 1 }}>
          <Txt v="bodyStrong" color={colors.success}>
            Identidade confirmada
          </Txt>
          <Txt v="small" color={colors.success}>
            {verificado.metodo === 'biometria' ? 'Biometria do aparelho' : 'Código de uso único'} às {formatTime(verificado.em)}
          </Txt>
        </View>
      </Card>
    );
  }

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.head}>
        <Icon name="shield-key-outline" size={22} color={colors.navy600} />
        <Txt v="bodyStrong" style={{ flex: 1 }}>
          Segundo fator de autenticação
        </Txt>
      </View>
      <Txt v="small" muted>
        Assinaturas são atos críticos: além da sessão autenticada, confirme sua identidade com um código de uso único
        {bio ? ' ou com a biometria do aparelho' : ''}.
      </Txt>

      {codigo ? (
        <>
          <Card tone="gold" style={{ gap: 4 }}>
            <Txt v="label" color={colors.goldText}>
              E-MAIL SIMULADO PARA {mascararEmail(usuario.email).toUpperCase()}
            </Txt>
            <Txt v="small" color={colors.goldText}>
              Seu código de assinatura RDO Mobile (válido por 5 minutos):
            </Txt>
            <Txt v="display" color={colors.goldText} style={{ letterSpacing: 6 }} accessibilityLabel={`Código ${codigo.split('').join(' ')}`}>
              {codigo}
            </Txt>
          </Card>
          <TextInput
            ref={ref}
            value={digitado}
            onChangeText={(t) => {
              setDigitado(t.replace(/\D/g, '').slice(0, 6));
              setErro('');
            }}
            placeholder="Digite os 6 dígitos"
            placeholderTextColor={colors.textSubtle}
            keyboardType="number-pad"
            maxLength={6}
            accessibilityLabel="Código de 6 dígitos"
            style={styles.input}
          />
          {erro ? (
            <Txt v="caption" color={colors.danger}>
              {erro}
            </Txt>
          ) : null}
          <Button title="Confirmar código" icon="check" onPress={conferir} disabled={digitado.length !== 6} />
          <Button title={espera > 0 ? `Reenviar código em ${espera}s` : 'Reenviar código'} variant="ghost" size="sm" disabled={espera > 0} onPress={enviar} />
        </>
      ) : (
        <>
          {erro ? <Banner tone="danger" message={erro} /> : null}
          <Button title="Enviar código por e-mail" icon="email-fast-outline" onPress={enviar} />
        </>
      )}
      {bio ? <Button title="Usar biometria do aparelho" icon="fingerprint" variant="secondary" onPress={usarBiometria} /> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ok: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  input: {
    borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.md, minHeight: 54, fontSize: 24, fontWeight: '800', letterSpacing: 8, textAlign: 'center', color: colors.text, backgroundColor: colors.white,
  },
});
