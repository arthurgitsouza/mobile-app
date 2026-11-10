import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme';
import { AppProvider, useApp } from './src/store/AppContext';
import { UIProvider, SplashScreen } from './src/components/ui';
import RootNavigator from './src/navigation/RootNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import AppWatchers from './src/store/AppWatchers';

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.navy700,
  },
};

const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.navy900 } });

function Root() {
  const { hydrated } = useApp();
  // Pré-carrega a fonte de ícones para evitar "piscar" de glifos vazios na primeira renderização.
  const [fontsLoaded] = useFonts(MaterialCommunityIcons.font);
  const pronto = hydrated && fontsLoaded;
  // A splash fica por cima do app enquanto carrega e, ao terminar a animação, some revelando a primeira tela.
  const [splashAtiva, setSplashAtiva] = useState(true);
  const fimSplash = useCallback(() => setSplashAtiva(false), []);
  return (
    <View style={styles.root}>
      {pronto && (
        <NavigationContainer theme={navTheme} ref={navigationRef}>
          <RootNavigator />
          <AppWatchers />
        </NavigationContainer>
      )}
      {splashAtiva && <SplashScreen pronto={pronto} onFim={fimSplash} />}
    </View>
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
