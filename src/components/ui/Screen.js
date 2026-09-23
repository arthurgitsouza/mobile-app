import React from 'react';
import { KeyboardAvoidingView, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import { useKeyboardVisible } from '../../hooks/useKeyboardVisible';
import Header from './Header';
import HeaderBell from './HeaderBell';

/**
 * Estrutura padrão de tela: cabeçalho + conteúdo (rolável) + rodapé fixo opcional.
 * - back: mostra a seta de voltar.   - bell: sino de notificações.   - tab: tela raiz de aba (sem inset inferior).
 * - keyboard: evita que o teclado cubra campos (iOS: ajuste de inset do ScrollView; Android: KeyboardAvoidingView).
 */
export default function Screen({
  title, subtitle, back, onBack, right, bell, headerExtra, scroll = true, children, footer, hideFooterOnKeyboard,
  contentContainerStyle, keyboard, refreshing, onRefresh, bg = colors.bg, tab, padded = true, scrollRef, floating, onScroll, scrollEnabled = true,
}) {
  const nav = useNavigation();
  const insets = useSafeAreaInsets();
  const teclado = useKeyboardVisible();
  const goBack = onBack || (() => (nav.canGoBack() ? nav.goBack() : nav.navigate('Main')));
  const mostrarRodape = footer && !(hideFooterOnKeyboard && teclado);

  const bottomPad = footer ? 16 : tab ? 24 : insets.bottom + 24;
  const body = scroll ? (
    <ScrollView
      ref={scrollRef}
      style={styles.flex}
      contentContainerStyle={[padded && styles.pad, { paddingBottom: bottomPad }, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      automaticallyAdjustKeyboardInsets={Platform.OS === 'ios' && !!keyboard}
      showsVerticalScrollIndicator={false}
      scrollEnabled={scrollEnabled}
      onScroll={onScroll}
      scrollEventThrottle={onScroll ? 16 : undefined}
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={colors.navy700} /> : undefined}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.pad, contentContainerStyle]}>{children}</View>
  );

  const content = (
    <View style={styles.flex}>
      {body}
      {mostrarRodape ? <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>{footer}</View> : null}
      {floating}
    </View>
  );

  return (
    <View style={[styles.flex, { backgroundColor: bg }]}>
      <StatusBar style="light" />
      <Header title={title} subtitle={subtitle} onBack={back || onBack ? goBack : undefined} right={<>{right}{bell ? <HeaderBell /> : null}</>}>
        {headerExtra}
      </Header>
      {keyboard && Platform.OS !== 'ios' ? (
        <KeyboardAvoidingView style={styles.flex} behavior="padding">
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: 16, gap: 14 },
  footer: {
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12, gap: 10,
  },
});
