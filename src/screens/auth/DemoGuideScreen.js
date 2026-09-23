import React from 'react';
import { StyleSheet, View } from 'react-native';
import { colors } from '../../theme';
import { PERFIS } from '../../constants';
import { useApp } from '../../store/AppContext';
import { Badge, Banner, Button, Card, Icon, Screen, Txt } from '../../components/ui';

// Cenário principal de demonstração (seção 21) com atalhos para entrar em cada perfil.
const PASSOS = [
  { n: 1, perfil: 'master', userId: 'u_master', titulo: 'Cadastrar obra e vínculos', texto: 'Em Obras → Nova obra, cadastre a obra e associe um usuário operacional e um cliente. (A Obra Alfa já existe como exemplo.)' },
  { n: 2, perfil: 'operacional', userId: 'u_joao', titulo: 'Preencher o RDO do dia', texto: 'Em Início → “Iniciar RDO de hoje”: clima, 12 trabalhadores, 3 equipamentos, atividades e 3 fotos legendadas (câmera ou galeria).' },
  { n: 3, perfil: 'operacional', userId: 'u_joao', titulo: 'Rascunho offline e sincronização', texto: 'Em Mais → Configurações, ative “Simular modo offline”, envie o RDO (fica salvo no aparelho) e desative para ver a sincronização.' },
  { n: 4, perfil: 'operacional', userId: 'u_joao', titulo: 'Revisar e enviar ao master', texto: 'Na etapa “Revisão e envio” confira as validações, aceite a declaração e envie. O master recebe uma notificação.' },
  { n: 5, perfil: 'master', userId: 'u_master', titulo: 'Analisar, comentar e devolver', texto: 'Na aba Análise abra o RDO nº 0007 da Obra Alfa, comente a Foto 02 (sem local preciso) e devolva com motivo e prazo.' },
  { n: 6, perfil: 'operacional', userId: 'u_joao', titulo: 'Corrigir e reenviar', texto: 'Abra o RDO devolvido (nº 0008), corrija a foto e reenvie. Depois o master valida, chancela e assina (código de uso único).' },
  { n: 7, perfil: 'cliente', userId: 'u_fernanda', titulo: 'Ciência com ressalva', texto: 'O cliente recebe push + e-mail simulado, lê o RDO nº 0006 e assina com uma ressalva (ou solicita esclarecimento).' },
  { n: 8, perfil: 'master', userId: 'u_master', titulo: 'PDF verificável e painel', texto: 'O RDO é finalizado com PDF, QR code e hash de verificação. Confira Arquivos, Relatórios e a trilha de Auditoria.' },
];

export default function DemoGuideScreen() {
  const { state, actions, currentUser } = useApp();
  return (
    <Screen title="Roteiro de demonstração" subtitle="Cenário principal (seção 21 do documento-base)" back>
      <Banner tone="info" message="Toque em “Entrar como…” para testar cada etapa com o perfil certo. Os dados são fictícios e ficam apenas neste aparelho." />
      {PASSOS.map((p) => {
        const u = state.users.find((x) => x.id === p.userId);
        return (
          <Card key={p.n} style={{ gap: 10 }}>
            <View style={styles.head}>
              <View style={styles.num}>
                <Txt v="bodyStrong" color={colors.white}>
                  {p.n}
                </Txt>
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Txt v="bodyStrong">{p.titulo}</Txt>
                <Badge label={PERFIS[p.perfil].longo} color={colors.navy700} bg={colors.blue100} icon={PERFIS[p.perfil].icone} size="sm" />
              </View>
            </View>
            <Txt v="small" muted>
              {p.texto}
            </Txt>
            {u && currentUser?.id !== u.id ? (
              <Button title={`Entrar como ${u.nome}`} icon="login-variant" variant="tonal" size="sm" onPress={() => actions.entrar({ userId: u.id })} />
            ) : currentUser?.id === u?.id ? (
              <View style={styles.now}>
                <Icon name="check-circle-outline" size={16} color={colors.success} />
                <Txt v="smallStrong" color={colors.success}>
                  Você já está neste perfil
                </Txt>
              </View>
            ) : null}
          </Card>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  num: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center' },
  now: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
