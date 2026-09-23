import React, { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme';
import { shadows } from '../../theme/shadows';
import IconButton from './IconButton';
import Txt from './Txt';

/**
 * Folha inferior modal. `footer` fica fixo abaixo do conteúdo rolável (ações Salvar/Cancelar).
 * O KeyboardAvoidingView com behavior="padding" se autocorrige: se o sistema já redimensionou a
 * janela (adjustResize), a sobreposição calculada é zero e nada é somado duas vezes.
 */
export default function BottomSheet({ visible, onClose, title, subtitle, children, footer, scroll = true, fullHeight }) {
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible, anim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.root}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="Fechar" />
        <Animated.View
          style={[
            styles.sheet,
            shadows.sheet,
            fullHeight && { height: '92%' },
            { maxHeight: '92%', paddingBottom: insets.bottom + 8, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [40, 0] }) }] },
          ]}
        >
          <View style={styles.grabber} />
          {title ? (
            <View style={styles.header}>
              <View style={{ flex: 1, gap: 2 }}>
                <Txt v="h3" numberOfLines={2} accessibilityRole="header">
                  {title}
                </Txt>
                {subtitle ? (
                  <Txt v="small" muted>
                    {subtitle}
                  </Txt>
                ) : null}
              </View>
              <IconButton icon="close" label="Fechar" onPress={onClose} color={colors.textMuted} />
            </View>
          ) : null}
          {scroll ? (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {children}
            </ScrollView>
          ) : (
            <View style={[styles.scroll, styles.content]}>{children}</View>
          )}
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, overflow: 'hidden' },
  grabber: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.borderStrong, marginTop: 8, marginBottom: 4 },
  header: { flexDirection: 'row', alignItems: 'center', paddingLeft: 20, paddingRight: 8, paddingBottom: 4 },
  scroll: { flexGrow: 0 },
  content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12, gap: 14 },
  footer: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6, gap: 10, borderTopWidth: 1, borderTopColor: colors.divider },
});
