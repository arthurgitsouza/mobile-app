import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { AppProvider, useApp } from './src/store/AppContext';
import { UIProvider, BrandMark, Txt } from './src/components/ui';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import AppWatchers from './src/store/AppWatchers';

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, text: colors.text, border: colors.border, primary: colors.navy700 },
};

function Splash() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.navy700, alignItems: 'center', justifyContent: 'center', gap: 14 }}>
      <StatusBar style="light" />
      <BrandMark size={84} />
      <Txt v="display" color={colors.white}>
        RDO Mobile
      </Txt>
      <ActivityIndicator color={colors.gold500} />
    </View>
  );
}

function Root() {
  const { hydrated } = useApp();
  // Pré-carrega a fonte de ícones para evitar "piscar" de glifos vazios na primeira renderização.
  const [fontsLoaded] = useFonts(MaterialCommunityIcons.font);
  if (!hydrated || !fontsLoaded) return <Splash />;
  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <RootNavigator />
      <AppWatchers />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <UIProvider>
          <Root />
        </UIProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
}
