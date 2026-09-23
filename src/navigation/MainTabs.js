import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { PERFIL } from '../constants';
import { useApp } from '../store/AppContext';
import { naoLidas, rdosAguardandoAnalise } from '../domain/selectors';
import { Icon } from '../components/ui';
import { TAB_SCREENS } from '../screens';

const Tab = createBottomTabNavigator();

// Abas por perfil (seção 13: painel inicial conforme perfil).
const TABS = {
  [PERFIL.MASTER]: [
    { name: 'Home', label: 'Painel', icon: 'view-dashboard-outline', on: 'view-dashboard' },
    { name: 'Analysis', label: 'Análise', icon: 'clipboard-check-outline', on: 'clipboard-check', badge: 'analise' },
    { name: 'Rdos', label: 'RDOs', icon: 'file-document-multiple-outline', on: 'file-document-multiple' },
    { name: 'Obras', label: 'Obras', icon: 'office-building-outline', on: 'office-building' },
    { name: 'More', label: 'Mais', icon: 'dots-horizontal-circle-outline', on: 'dots-horizontal-circle' },
  ],
  [PERFIL.OPERACIONAL]: [
    { name: 'Home', label: 'Início', icon: 'home-outline', on: 'home' },
    { name: 'Rdos', label: 'Meus RDOs', icon: 'file-document-multiple-outline', on: 'file-document-multiple' },
    { name: 'Obras', label: 'Obras', icon: 'office-building-outline', on: 'office-building' },
    { name: 'Notifications', label: 'Avisos', icon: 'bell-outline', on: 'bell', badge: 'avisos' },
    { name: 'More', label: 'Mais', icon: 'dots-horizontal-circle-outline', on: 'dots-horizontal-circle' },
  ],
  [PERFIL.CLIENTE]: [
    { name: 'Home', label: 'Início', icon: 'home-outline', on: 'home' },
    { name: 'Rdos', label: 'RDOs', icon: 'file-document-multiple-outline', on: 'file-document-multiple' },
    { name: 'Files', label: 'Arquivos', icon: 'folder-outline', on: 'folder' },
    { name: 'Notifications', label: 'Avisos', icon: 'bell-outline', on: 'bell', badge: 'avisos' },
    { name: 'More', label: 'Mais', icon: 'dots-horizontal-circle-outline', on: 'dots-horizontal-circle' },
  ],
};

export default function MainTabs() {
  const { state, currentUser } = useApp();
  const insets = useSafeAreaInsets();
  const abas = TABS[currentUser.perfil];
  const badges = {
    avisos: naoLidas(state, currentUser),
    analise: currentUser.perfil === PERFIL.MASTER ? rdosAguardandoAnalise(state).length : 0,
  };

  return (
    <Tab.Navigator
      key={currentUser.perfil}
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy700,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14, fontWeight: '700' },
        // Altura explícita: ícone + rótulo completos em iOS/Android/web, respeitando a área segura inferior.
        tabBarStyle: {
          backgroundColor: colors.surface, borderTopColor: colors.border, borderTopWidth: 1,
          height: 68 + insets.bottom, paddingTop: 6, paddingBottom: insets.bottom + 10,
        },
        tabBarBadgeStyle: { backgroundColor: colors.gold500, color: colors.navy900, fontWeight: '800', fontSize: 10 },
      }}
    >
      {abas.map((a) => (
        <Tab.Screen
          key={a.name}
          name={a.name}
          component={TAB_SCREENS[a.name]}
          options={{
            title: a.label,
            tabBarAccessibilityLabel: badges[a.badge] ? `${a.label}, ${badges[a.badge]} pendentes` : a.label,
            tabBarBadge: a.badge && badges[a.badge] ? badges[a.badge] : undefined,
            tabBarIcon: ({ focused, color }) => <Icon name={focused ? a.on : a.icon} size={25} color={color} />,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}
