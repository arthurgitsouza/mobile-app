import { styles, dinamico } from './styles';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../../theme';
import { PERFIS } from '../../../constants';
import { useApp } from '../../../store/AppContext';
import { autenticarBiometria, biometriaDisponivel } from '../../../services/biometrics';
import { haptic } from '../../../utils/feedback';
import { isEmail, primeiroNome } from '../../../utils/format';
import { Avatar, Banner, BrandMark, Button, Card, Icon, LinkButton, Txt, useUI } from '../../../components/ui';
import { PasswordField, TextField } from '../../../components/form';
import CheckboxField from '../../../components/form/CheckboxField';

const MAX_TENTATIVAS = 5;
const BLOQUEIO_MS = 30000;

// Personas de demonstração (acesso rápido para testar cada perfil no Expo Go).
const RAPIDO = [
  { userId: 'u_master', perfil: 'master', detalhe: 'Analisa, valida e assina' },
  { userId: 'u_joao', perfil: 'operacional', detalhe: 'Preenche o RDO no canteiro' },
  { userId: 'u_fernanda', perfil: 'cliente', detalhe: 'Dá ciência ou registra ressalva' },
];

export default function LoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { state, actions } = useApp();
  const { confirm } = useUI();

  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [manter, setManter] = useState(false);
  const [erros, setErros] = useState({});
  const [erro, setErro] = useState('');
  const [tentativas, setTentativas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState(0);
  const [agora, setAgora] = useState(Date.now());
  const [carregando, setCarregando] = useState(false);
  const [bioOk, setBioOk] = useState(false);

  const ultimo = state.users.find((u) => u.id === state.session.ultimoUserId);
  const podeBiometria = bioOk && ultimo && state.session.biometria?.[ultimo.id];
  const segundosRestantes = Math.max(0, Math.ceil((bloqueadoAte - agora) / 1000));
  const bloqueado = segundosRestantes > 0;

  useEffect(() => {
    biometriaDisponivel().then(setBioOk);
  }, []);

  useEffect(() => {
    if (!bloqueado) return undefined;
    const t = setInterval(() => setAgora(Date.now()), 500);
    return () => clearInterval(t);
  }, [bloqueado]);

  const falhar = (mensagem) => {
    haptic.error();
    const n = tentativas + 1;
    setTentativas(n);
    if (n >= MAX_TENTATIVAS) {
      setBloqueadoAte(Date.now() + BLOQUEIO_MS);
      setAgora(Date.now());
      setTentativas(0);
      setErro('Muitas tentativas. Por segurança, o acesso ficou bloqueado temporariamente.');
    } else {
      setErro(
        `${mensagem} Restam ${MAX_TENTATIVAS - n} ${MAX_TENTATIVAS - n === 1 ? 'tentativa' : 'tentativas'} antes do bloqueio temporário.`,
      );
    }
  };

  const entrarComSenha = async () => {
    if (bloqueado || carregando) return;
    setErro('');
    const mail = email.trim().toLowerCase();
    const e = {};
    if (!isEmail(mail)) e.email = 'Informe um e-mail válido.';
    if (!senha) e.senha = 'Informe a senha.';
    setErros(e);
    if (Object.keys(e).length) return;

    setCarregando(true);
    await new Promise((r) => setTimeout(r, 450)); // latência simulada (o back-end virá depois)
    const user = state.users.find((u) => u.email.toLowerCase() === mail);
    setCarregando(false);
    if (!user || user.senha !== senha) return falhar('E-mail ou senha incorretos.');
    if (!user.ativo) {
      haptic.error();
      return setErro('Este usuário está bloqueado. Fale com o administrador da empresa.');
    }

    // Primeira autenticação neste aparelho: oferece a biometria (RF-01).
    if (state.session.biometria?.[user.id] === undefined && (await biometriaDisponivel())) {
      const ativar = await confirm({
        icon: 'fingerprint',
        title: 'Ativar biometria?',
        message:
          'Nos próximos acessos você poderá entrar com a biometria do aparelho. Suas assinaturas continuarão exigindo confirmação adicional.',
        confirmLabel: 'Ativar',
        cancelLabel: 'Agora não',
      });
      actions.definirBiometria({ userId: user.id, ativo: ativar });
    }
    haptic.success();
    actions.entrar({ userId: user.id, manter });
  };

  const entrarComBiometria = async () => {
    const ok = await autenticarBiometria(`Entrar como ${primeiroNome(ultimo.nome)}`);
    if (ok) {
      haptic.success();
      actions.entrar({ userId: ultimo.id, manter });
    } else {
      setErro('Não foi possível confirmar a biometria. Entre com e-mail e senha.');
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'padding'} style={styles.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={dinamico.scrollConteudo(insets.bottom)}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
      >
        <View style={[styles.hero, dinamico.hero(insets.top)]}>
          <BrandMark size={72} />
          <Txt v="display" color={colors.white} style={styles.titulo}accessibilityRole="header">
            RDO Mobile
          </Txt>
          <Txt v="body" color={colors.textOnDarkMuted} style={styles.titulo}>
            Registro Diário de Obra: do canteiro à assinatura, com histórico verificável.
          </Txt>
          <View style={styles.proto}>
            <Icon name="flask-outline" size={14} color={colors.gold200} />
            <Txt v="caption" color={colors.gold200}>
              Protótipo acadêmico · UNDB Engenharia Civil
            </Txt>
          </View>
        </View>

        <View style={styles.body}>
          <Card style={styles.formCard}>
            <Txt v="h2">Entrar</Txt>
            {erro ? <Banner tone="danger" message={erro} /> : null}
            {bloqueado ? (
              <Banner
                tone="warning"
                icon="timer-sand"
                title={`Tente novamente em ${segundosRestantes}s`}
                message="Bloqueio temporário após várias tentativas incorretas."
              />
            ) : null}

            <TextField
              label="E-mail"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                if (erros.email) setErros((x) => ({ ...x, email: undefined }));
              }}
              placeholder="voce@empresa.com.br"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="username"
              prefixIcon="email-outline"
              error={erros.email}
              returnKeyType="next"
            />
            <PasswordField
              value={senha}
              onChangeText={(t) => {
                setSenha(t);
                if (erros.senha) setErros((x) => ({ ...x, senha: undefined }));
              }}
              placeholder="Sua senha"
              error={erros.senha}
              autoComplete="password"
              textContentType="password"
              returnKeyType="go"
              onSubmitEditing={entrarComSenha}
            />
            <View style={styles.rowBetween}>
              <View style={styles.fill}>
                <CheckboxField plain label="Manter conectado" value={manter} onValueChange={setManter} />
              </View>
              <LinkButton title="Esqueci a senha" onPress={() => navigation.navigate('ForgotPassword')} />
            </View>
            <Button
              title="Entrar"
              icon="login-variant"
              onPress={entrarComSenha}
              loading={carregando}
              disabled={bloqueado}
              size="lg"
            />
            {podeBiometria ? (
              <Button
                title={`Entrar com biometria (${primeiroNome(ultimo.nome)})`}
                icon="fingerprint"
                variant="secondary"
                onPress={entrarComBiometria}
              />
            ) : null}
          </Card>

          <View style={styles.demo}>
            <View style={styles.demoHeader}>
              <Icon name="flash-outline" size={18} color={colors.navy600} />
              <Txt v="label" color={colors.navy600} accessibilityRole="header">
                ACESSO RÁPIDO · DEMONSTRAÇÃO
              </Txt>
            </View>
            {RAPIDO.map((r) => {
              const u = state.users.find((x) => x.id === r.userId);
              if (!u) return null;
              return (
                <Card
                  key={r.userId}
                  onPress={() => actions.entrar({ userId: u.id, manter: false })}
                  accessibilityLabel={`Entrar como ${PERFIS[r.perfil].longo}: ${u.nome}`}
                  style={styles.quick}
                >
                  <Avatar nome={u.nome} size={44} />
                  <View style={styles.quickInfo}>
                    <Txt v="bodyStrong">{PERFIS[r.perfil].longo}</Txt>
                    <Txt v="small" muted>
                      {u.nome} · {r.detalhe}
                    </Txt>
                  </View>
                  <Icon name="chevron-right" size={22} color={colors.textSubtle} />
                </Card>
              );
            })}
            <Txt v="caption" muted style={styles.centro}>
              Senha de todos os usuários de demonstração: 123456
            </Txt>
          </View>

          <View style={styles.footer}>
            <LinkButton
              title="Roteiro de demonstração"
              icon="map-marker-path"
              onPress={() => navigation.navigate('DemoGuide')}
            />
            <Txt v="caption" subtle>
              v1.0.0 · protótipo de interface — dados fictícios
            </Txt>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
