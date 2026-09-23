import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../../theme';
import { useApp } from '../../store/AppContext';
import { naoLidas } from '../../domain/selectors';
import IconButton from './IconButton';

export default function HeaderBell() {
  const nav = useNavigation();
  const { state, currentUser } = useApp();
  const n = state && currentUser ? naoLidas(state, currentUser) : 0;
  return (
    <IconButton
      icon="bell-outline"
      label={n ? `Notificações, ${n} não lidas` : 'Notificações'}
      color={colors.white}
      badge={n}
      onPress={() => nav.navigate('Notifications')}
    />
  );
}
