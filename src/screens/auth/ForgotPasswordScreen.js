import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { colors, radius } from '../../theme';
import { useApp } from '../../store/AppContext';
import { haptic } from '../../utils/feedback';
import { isEmail, mascararEmail } from '../../utils/format';
import { Banner, Button, Card, Icon, Screen, Txt } from '../../components/ui';
import { PasswordField, TextField } from '../../components/form';

// Recuperação de acesso (RF-01): e-mail → código de uso único → nova senha.
// O código é exibido na tela apenas porque o envio de e-mail é simulado no protótipo.
export default function ForgotPasswordScreen({ navigation }) {
  const { state, actions } = useApp();
  const [passo, setPasso] = useState(1);
  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [codigoGerado, setCodigoGerado] = useState(null);
  const [erroCodigo, setErroCodigo] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [espera, setEspera] = useState(0);
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const usuarioRef = useRef(null);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const gerarCodigo = () => String(Math.floor(100000 + Math.random() * 900000));

  const enviarCodigo = () => {
    const mail = email.trim().toLowerCase();
    if (!isEmail(mail)) return setErroEmail('Informe um e-mail válido.');
    setErroEmail('');
    usuarioRef.current = state.users.find((u) => u.email.toLowerCase() === mail && u.ativo) || null;
    setCodigoGerado(usuarioRef.current ? gerarCodigo() : null);
    setCodigo('');
    setErroCodigo('');
    setTentativas(0);
    setEspera(30);
    setPasso(2);
  };

  const reenviar = () => {
    if (espera > 0) return;
    if (usuarioRef.current) setCodigoGerado(gerarCodigo());
    setCodigo('');
    setErroCodigo('');
    setEspera(30);
  };

  const conferirCodigo = () => {
    if (codigo.length !== 6) return setErroCodigo('Digite os 6 dígitos do código.');
    if (codigoGerado && codigo === codigoGerado) {
      haptic.success();
      setPasso(3);
      return;
    }
    haptic.error();
    const n = tentativas + 1;
    setTentativas(n);
    if (n >= 5) {
      setPasso(1);
      setErroEmail('Muitas tentativas incorretas. Solicite um novo código.');
    } else setErroCodigo(`Código incorreto. Restam ${5 - n} tentativas.`);
  };

  const regras = [
    { ok: senha.length >= 8, texto: 'Ao menos 8 caracteres' },
    { ok: /[A-Za-z]/.test(senha) && /\d/.test(senha), texto: 'Letras e números' },
    { ok: senha.length > 0 && senha === confirma, texto: 'As duas senhas coincidem' },
  ];

  const salvarSenha = () => {
    if (!regras.every((r) => r.ok)) return setErroSenha('Confira os requisitos da senha abaixo.');
    actions.alterarSenha({ userId: usuarioRef.current.id, senha });
    haptic.success();
    setPasso(4);
  };

  return (
    <Screen
      title="Recuperar acesso"
      subtitle={passo < 4 ? `Passo ${passo} de 3` : 'Concluído'}
      back
      keyboard
      footer={
        passo === 1 ? (
          <Button title="Enviar código" icon="email-fast-outline" onPress={enviarCodigo} size="lg" />
        ) : passo === 2 ? (
          <Button title="Confirmar código" icon="check" onPress={conferirCodigo} size="lg" disabled={codigo.length !== 6} />
        ) : passo === 3 ? (
          <Button title="Salvar nova senha" icon="lock-check-outline" onPress={salvarSenha} size="lg" />
        ) : (
          <Button title="Voltar ao login" icon="login-variant" onPress={() => navigation.popToTop()} size="lg" />
        )
      }
      hideFooterOnKeyboard={false}
    >
      {passo === 1 ? (
        <>
          <Txt v="body" muted>
            Informe o e-mail cadastrado. Enviaremos um código de uso único para você redefinir a senha.
          </Txt>
          <TextField
            label="E-mail"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@empresa.com.br"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            prefixIcon="email-outline"
            error={erroEmail}
            returnKeyType="send"
            onSubmitEditing={enviarCodigo}
          />
        </>
      ) : null}

      {passo === 2 ? (
        <>
          <Txt v="body" muted>
            Se o e-mail {mascararEmail(email.trim())} estiver cadastrado, enviamos um código de 6 dígitos válido por 10 minutos.
          </Txt>
          {codigoGerado ? (
            <Card tone="gold" style={{ gap: 6 }}>
              <View style={styles.simHeader}>
                <Icon name="email-fast-outline" size={18} color={colors.goldText} />
                <Txt v="label" color={colors.goldText}>
                  E-MAIL SIMULADO (PROTÓTIPO)
                </Txt>
              </View>
              <Txt v="small" color={colors.goldText}>
                Seu código RDO Mobile é:
              </Txt>
              <Txt v="display" color={colors.goldText} style={{ letterSpacing: 6 }} accessibilityLabel={`Código ${codigoGerado.split('').join(' ')}`}>
                {codigoGerado}
              </Txt>
            </Card>
          ) : (
            <Banner tone="neutral" message="Modo demonstração: este e-mail não está cadastrado, então nenhum código foi gerado. Volte e tente master@planengen.com.br." />
          )}
          <CodeInput value={codigo} onChange={(t) => { setCodigo(t); setErroCodigo(''); }} error={erroCodigo} />
          <View style={{ alignItems: 'center' }}>
            <Pressable onPress={reenviar} disabled={espera > 0} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt v="smallStrong" color={espera > 0 ? colors.textSubtle : colors.blue500}>
                {espera > 0 ? `Reenviar código em ${espera}s` : 'Reenviar código'}
              </Txt>
            </Pressable>
            <Pressable onPress={() => setPasso(1)} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Txt v="smallStrong" color={colors.blue500}>
                Usar outro e-mail
              </Txt>
            </Pressable>
          </View>
        </>
      ) : null}

      {passo === 3 ? (
        <>
          <Txt v="body" muted>
            Crie uma nova senha para {usuarioRef.current?.nome}.
          </Txt>
          <PasswordField label="Nova senha" value={senha} onChangeText={(t) => { setSenha(t); setErroSenha(''); }} placeholder="Nova senha" required />
          <PasswordField label="Confirmar nova senha" value={confirma} onChangeText={(t) => { setConfirma(t); setErroSenha(''); }} placeholder="Repita a senha" required error={erroSenha} />
          <Card style={{ gap: 8 }}>
            {regras.map((r) => (
              <View key={r.texto} style={styles.rule}>
                <Icon name={r.ok ? 'check-circle' : 'circle-outline'} size={20} color={r.ok ? colors.success : colors.textSubtle} />
                <Txt v="small" color={r.ok ? colors.success : colors.textMuted}>
                  {r.texto}
                </Txt>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {passo === 4 ? (
        <View style={{ alignItems: 'center', gap: 10, paddingVertical: 24 }}>
          <View style={[styles.okIcon]}>
            <Icon name="check-decagram" size={40} color={colors.success} />
          </View>
          <Txt v="h2" style={{ textAlign: 'center' }}>
            Senha redefinida
          </Txt>
          <Txt v="body" muted style={{ textAlign: 'center' }}>
            Sua nova senha já está valendo. Por segurança, todas as sessões anteriores foram encerradas (simulado).
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}

// Seis caixas visuais sobre um único TextInput (melhor para colar código e para leitores de tela).
function CodeInput({ value, onChange, error }) {
  const ref = useRef(null);
  return (
    <View style={{ gap: 6 }}>
      <Pressable onPress={() => ref.current?.focus()} accessibilityRole="none" style={styles.codeRow}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.codeBox, value.length === i && styles.codeActive, !!error && { borderColor: colors.danger }]}>
            <Txt v="h1">{value[i] || ''}</Txt>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, 6))}
        keyboardType="number-pad"
        maxLength={6}
        autoFocus
        accessibilityLabel="Código de 6 dígitos"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={styles.hiddenInput}
      />
      {error ? (
        <Txt v="caption" color={colors.danger} style={{ textAlign: 'center' }}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  simHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rule: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  okIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successBg, alignItems: 'center', justifyContent: 'center' },
  codeRow: { flexDirection: 'row', gap: 8, justifyContent: 'center' },
  codeBox: {
    width: 48, height: 58, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  codeActive: { borderColor: colors.navy600, borderWidth: 2.5 },
  hiddenInput: { position: 'absolute', opacity: 0.01, height: 1, width: 1 },
});
