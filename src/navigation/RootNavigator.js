import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../theme';
import { useApp } from '../store/AppContext';
import { STACK_SCREENS } from '../screens';
import LoginScreen from '../screens/auth/LoginScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import DemoGuideScreen from '../screens/auth/DemoGuideScreen';
import TermsScreen from '../screens/auth/TermsScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

// Fluxo de autenticação primeiro: sem usuário → Login; sem aceite de termos → Termos; depois o app.
// O `key` remonta a pilha ao trocar de usuário, para não vazar telas de outro perfil.
export default function RootNavigator() {
  const { state, currentUser } = useApp();
  const termosOk = !!(currentUser && state.session.termosAceitos?.[currentUser.id]);

  return (
    <Stack.Navigator
      key={currentUser?.id || 'anon'}
      screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}
    >
      {!currentUser ? (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} options={{ animationTypeForReplace: 'pop' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
          <Stack.Screen name="DemoGuide" component={DemoGuideScreen} />
        </Stack.Group>
      ) : !termosOk ? (
        <Stack.Screen name="Terms" component={TermsScreen} />
      ) : (
        <Stack.Group>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen name="DemoGuide" component={DemoGuideScreen} />
          {STACK_SCREENS.map(({ name, component, options }) => (
            <Stack.Screen key={name} name={name} component={component} options={options} />
          ))}
          <Stack.Screen name="TermsView" component={TermsScreen} initialParams={{ readOnly: true }} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}
