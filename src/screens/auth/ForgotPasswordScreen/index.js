import { styles } from './styles';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { colors } from '../../../theme';
import { useApp } from '../../../store/AppContext';
import useAcao from '../../../hooks/useAcao';
import { env } from '../../../config/env';
import { haptic } from '../../../utils/feedback';
import { isEmail, mascararEmail } from '../../../utils/format';
import { Banner, Button, Card, Icon, Screen, Txt } from '../../../components/ui';
import { PasswordField, TextField } from '../../../components/form';

// Recuperação de acesso (RF-01): e-mail → código de uso único → nova senha.
// O código é exibido na tela apenas porque o envio de e-mail é simulado no protótipo.
export default function ForgotPasswordScreen({ navigation }) {
  const { actions } = useApp();
  const [passo, setPasso] = useState(1);
  const [email, setEmail] = useState('');
  const [erroEmail, setErroEmail] = useState('');
  const [codigo, setCodigo] = useState('');
  const [recuperacao, setRecuperacao] = useState(null);
  const [verificacao, setVerificacao] = useState(null);
  const [erroCodigo, setErroCodigo] = useState('');
  const [espera, setEspera] = useState(0);
  const [senha, setSenha] = useState('');
  const [confirma, setConfirma] = useState('');
  const [erroSenha, setErroSenha] = useState('');
  const solicitar = useAcao(actions.solicitarRecuperacao);
  const verificar = useAcao(actions.verificarCodigo);
  const redefinir = useAcao(actions.redefinirSenha);
  const carregando = solicitar.carregando || verificar.carregando || redefinir.carregando;
  const codigoGerado = env.USE_MOCK && env.DEMO ? recuperacao?.codigoDemo : null;
  const erroAcao = passo === 1 ? solicitar.erro : passo === 2 ? verificar.erro || solicitar.erro : redefinir.erro;

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((e) => e - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  const enviarCodigo = async () => {
    if (carregando) return;
    const mail = email.trim().toLowerCase();
    if (!isEmail(mail)) return setErroEmail('Informe um e-mail válido.');
    setErroEmail('');
    const resultado = await solicitar.executar({ email: mail });
    if (!resultado) return;
    setRecuperacao({ ...resultado, email: mail });
    setVerificacao(null);
    setCodigo('');
    setErroCodigo('');
    setEspera(30);
    setPasso(2);
  };

  const reenviar = async () => {
    if (espera > 0 || carregando) return;
    await enviarCodigo();
  };

  const conferirCodigo = async () => {
    if (carregando) return;
    if (codigo.length !== 6) return setErroCodigo('Digite os 6 dígitos do código.');
    const resultado = await verificar.executar({
      solicitacaoId: recuperacao?.solicitacaoId,
      email: recuperacao?.email,
      codigo,
    });
    if (!resultado) return;
    setVerificacao(resultado);
    setPasso(3);
  };

  const regras = [
    { ok: senha.length >= 8, texto: 'Ao menos 8 caracteres' },
    { ok: /[A-Za-z]/.test(senha) && /\d/.test(senha), texto: 'Letras e números' },
    { ok: senha.length > 0 && senha === confirma, texto: 'As duas senhas coincidem' },
  ];

  const salvarSenha = async () => {
    if (carregando || !verificacao) return;
    if (!regras.every((r) => r.ok)) return setErroSenha('Confira os requisitos da senha abaixo.');
    const resultado = await redefinir.executar({
      solicitacaoId: recuperacao?.solicitacaoId,
      resetToken: verificacao.resetToken,
      email: recuperacao?.email,
      codigo,
      senha,
    });
    if (!resultado) return;
    haptic.success();
    setSenha('');
    setConfirma('');
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
          <Button
            title="Enviar código"
            icon="email-fast-outline"
            onPress={enviarCodigo}
            size="lg"
            loading={solicitar.carregando}
          />
        ) : passo === 2 ? (
          <Button
            title={env.USE_MOCK ? 'Confirmar código' : 'Continuar'}
            icon="check"
            onPress={conferirCodigo}
            size="lg"
            disabled={codigo.length !== 6 || carregando}
            loading={verificar.carregando}
          />
        ) : passo === 3 ? (
          <Button
            title="Salvar nova senha"
            icon="lock-check-outline"
            onPress={salvarSenha}
            size="lg"
            loading={redefinir.carregando}
          />
        ) : (
          <Button title="Voltar ao login" icon="login-variant" onPress={() => navigation.popToTop()} size="lg" />
        )
      }
      hideFooterOnKeyboard={false}
    >
      {erroAcao ? <Banner tone="danger" message={erroAcao.mensagem} /> : null}
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
            editable={!carregando}
          />
        </>
      ) : null}

      {passo === 2 ? (
        <>
          <Txt v="body" muted>
            Se o e-mail {mascararEmail(recuperacao?.email || email.trim())} estiver cadastrado, enviaremos um código
            para redefinir a senha.
          </Txt>
          {codigoGerado ? (
            <Card tone="gold" style={styles.gap6}>
              <View style={styles.simHeader}>
                <Icon name="email-fast-outline" size={18} color={colors.goldText} />
                <Txt v="label" color={colors.goldText}>
                  E-MAIL SIMULADO (PROTÓTIPO)
                </Txt>
              </View>
              <Txt v="small" color={colors.goldText}>
                Seu código RDO Mobile é:
              </Txt>
              <Txt
                v="display"
                color={colors.goldText}
                style={styles.codigoTexto}
                accessibilityLabel={`Código ${codigoGerado.split('').join(' ')}`}
              >
                {codigoGerado}
              </Txt>
            </Card>
          ) : env.USE_MOCK && env.DEMO ? (
            <Banner
              tone="neutral"
              message="Modo demonstração: este e-mail não está cadastrado, então nenhum código foi gerado. Volte e tente master@planengen.com.br."
            />
          ) : null}
          <CodeInput
            value={codigo}
            onChange={(t) => {
              setCodigo(t);
              setErroCodigo('');
            }}
            error={erroCodigo}
            disabled={carregando}
          />
          <View style={styles.centralizado}>
            <Pressable
              onPress={reenviar}
              disabled={espera > 0 || carregando}
              accessibilityRole="button"
              style={styles.link}
            >
              <Txt v="smallStrong" color={espera > 0 ? colors.textSubtle : colors.blue500}>
                {espera > 0 ? `Reenviar código em ${espera}s` : 'Reenviar código'}
              </Txt>
            </Pressable>
            <Pressable
              onPress={() => {
                setPasso(1);
                setRecuperacao(null);
                setVerificacao(null);
              }}
              disabled={carregando}
              accessibilityRole="button"
              style={styles.link}
            >
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
            Crie uma nova senha para {mascararEmail(recuperacao?.email || email)}.
          </Txt>
          {!env.USE_MOCK ? (
            <Banner tone="info" message="O código será verificado pelo servidor ao salvar a nova senha." />
          ) : null}
          <Pressable
            onPress={() => {
              setPasso(2);
              setVerificacao(null);
            }}
            disabled={carregando}
            accessibilityRole="button"
            style={styles.link}
          >
            <Txt v="smallStrong" color={colors.blue500}>
              Corrigir código
            </Txt>
          </Pressable>
          <PasswordField
            label="Nova senha"
            value={senha}
            onChangeText={(t) => {
              setSenha(t);
              setErroSenha('');
            }}
            placeholder="Nova senha"
            required
          />
          <PasswordField
            label="Confirmar nova senha"
            value={confirma}
            onChangeText={(t) => {
              setConfirma(t);
              setErroSenha('');
            }}
            placeholder="Repita a senha"
            required
            error={erroSenha}
          />
          <Card style={styles.gap8}>
            {regras.map((r) => (
              <View key={r.texto} style={styles.rule}>
                <Icon
                  name={r.ok ? 'check-circle' : 'circle-outline'}
                  size={20}
                  color={r.ok ? colors.success : colors.textSubtle}
                />
                <Txt v="small" color={r.ok ? colors.success : colors.textMuted}>
                  {r.texto}
                </Txt>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {passo === 4 ? (
        <View style={styles.sucesso}>
          <View style={[styles.okIcon]}>
            <Icon name="check-decagram" size={40} color={colors.success} />
          </View>
          <Txt v="h2" style={styles.centro}>
            Senha redefinida
          </Txt>
          <Txt v="body" muted style={styles.centro}>
            Sua senha foi redefinida. Volte ao login e entre com a nova senha.
          </Txt>
        </View>
      ) : null}
    </Screen>
  );
}

// Seis caixas visuais sobre um único TextInput (melhor para colar código e para leitores de tela).
function CodeInput({ value, onChange, error, disabled }) {
  const ref = useRef(null);
  return (
    <View style={styles.gap6}>
      <Pressable onPress={() => ref.current?.focus()} accessibilityRole="none" style={styles.codeRow}>
        {Array.from({ length: 6 }, (_, i) => (
          <View key={i} style={[styles.codeBox, value.length === i && styles.codeActive, !!error && styles.codigoErro]}>
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
        editable={!disabled}
        autoFocus
        accessibilityLabel="Código de 6 dígitos"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        style={styles.hiddenInput}
      />
      {error ? (
        <Txt v="caption" color={colors.danger} style={styles.centro}>
          {error}
        </Txt>
      ) : null}
    </View>
  );
}
