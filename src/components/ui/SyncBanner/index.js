import React from 'react';
import { Pressable, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../../theme';
import { useApp } from '../../../store/AppContext';
import { contar } from '../../../utils/format';
import Icon from '../Icon';
import Txt from '../Txt';
import { styles, dinamico } from './styles';

// Estado de conexão/sincronização sempre visível (RNF-03 / critério de aceite: "indica claramente o que ainda não foi enviado").
export default function SyncBanner({ style }) {
  const nav = useNavigation();
  const { state, online } = useApp();
  if (!state) return null;
  const pendentes = state.rdos.filter((r) => r.sync?.pendente).length;
  if (online && pendentes === 0) return null;

  const offline = !online;
  const tone = offline
    ? { bg: colors.warningBg, fg: colors.warning, icon: 'cloud-off-outline' }
    : { bg: colors.infoBg, fg: colors.info, icon: 'cloud-sync-outline' };
  const texto = offline
    ? pendentes
      ? `Sem conexão — ${contar(pendentes, 'RDO')} salvo${pendentes > 1 ? 's' : ''} no aparelho aguardando envio.`
      : 'Sem conexão — você pode continuar preenchendo. Rascunhos ficam salvos no aparelho.'
    : `Sincronizando ${contar(pendentes, 'RDO')}…`;

  return (
    <Pressable
      onPress={() => nav.navigate('Sync')}
      accessibilityRole="button"
      accessibilityLabel={`${texto} Abrir central de sincronização.`}
      style={[styles.wrap, dinamico.fundo(tone.bg), style]}
    >
      <Icon name={tone.icon} size={20} color={tone.fg} />
      <View style={styles.fill}>
        <Txt v="smallStrong" color={tone.fg}>
          {texto}
        </Txt>
      </View>
      <Icon name="chevron-right" size={20} color={tone.fg} />
    </Pressable>
  );
}
