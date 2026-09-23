import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius } from '../../theme';
import { shadows } from '../../theme/shadows';
import Button from './Button';
import Icon from './Icon';
import Txt from './Txt';

const UIContext = createContext(null);

const TOAST_TONES = {
  success: { bg: colors.success, icon: 'check-circle-outline' },
  error: { bg: colors.danger, icon: 'alert-circle-outline' },
  info: { bg: colors.navy700, icon: 'information-outline' },
  push: { bg: colors.navy800, icon: 'bell-ring-outline' },
  warning: { bg: colors.warning, icon: 'alert-outline' },
};

export function UIProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [dialog, setDialog] = useState(null);
  const timer = useRef(null);
  const anim = useRef(new Animated.Value(0)).current;

  const hideToast = useCallback(() => {
    clearTimeout(timer.current);
    Animated.timing(anim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => setToast(null));
  }, [anim]);

  const show = useCallback(
    (t) => {
      clearTimeout(timer.current);
      setToast({ type: 'info', duration: 3800, ...t, id: Date.now() });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, friction: 8, tension: 70 }).start();
      timer.current = setTimeout(hideToast, t.duration || 3800);
    },
    [anim, hideToast],
  );

  const confirm = useCallback((opts) => new Promise((resolve) => setDialog({ kind: 'confirm', opts, resolve })), []);
  const prompt = useCallback((opts) => new Promise((resolve) => setDialog({ kind: 'prompt', opts, resolve })), []);
  const notice = useCallback((opts) => new Promise((resolve) => setDialog({ kind: 'notice', opts, resolve })), []);

  const value = useMemo(() => ({ toast: { show, hide: hideToast }, confirm, prompt, notice }), [show, hideToast, confirm, prompt, notice]);

  return (
    <UIContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <ToastView toast={toast} anim={anim} onClose={hideToast} />
        <DialogHost dialog={dialog} close={(result) => { dialog?.resolve(result); setDialog(null); }} />
      </View>
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI deve ser usado dentro de <UIProvider>');
  return ctx;
}

function ToastView({ toast, anim, onClose }) {
  const insets = useSafeAreaInsets();
  if (!toast) return null;
  const tone = TOAST_TONES[toast.type] || TOAST_TONES.info;
  return (
    <Animated.View
      style={[styles.toastWrap, { pointerEvents: 'box-none', top: insets.top + 8, opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] }) }] }]}
    >
      <Pressable
        onPress={() => {
          onClose();
          toast.onPress?.();
        }}
        accessibilityRole="alert"
        accessibilityLabel={[toast.title, toast.message].filter(Boolean).join('. ')}
        style={[styles.toast, shadows.raised, { backgroundColor: tone.bg }]}
      >
        <Icon name={toast.icon || tone.icon} size={22} color={colors.white} />
        <View style={{ flex: 1, gap: 1 }}>
          {toast.title ? (
            <Txt v="smallStrong" color={colors.white} numberOfLines={2}>
              {toast.title}
            </Txt>
          ) : null}
          {toast.message ? (
            <Txt v="small" color={colors.textOnDarkMuted} numberOfLines={3} style={{ color: 'rgba(255,255,255,0.92)' }}>
              {toast.message}
            </Txt>
          ) : null}
        </View>
        <Icon name="close" size={18} color="rgba(255,255,255,0.8)" />
      </Pressable>
    </Animated.View>
  );
}

function DialogHost({ dialog, close }) {
  const [text, setText] = useState('');
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (dialog?.kind === 'prompt') {
      setText(dialog.opts.initialValue || '');
      setTouched(false);
    }
  }, [dialog]);

  if (!dialog) return null;
  const { kind, opts } = dialog;
  const destructive = !!opts.destructive;

  const minLen = opts.minLength ?? (opts.required === false ? 0 : 3);
  const invalid = kind === 'prompt' && text.trim().length < minLen;
  // Rótulos longos não cabem lado a lado: empilha os botões (confirmar em cima).
  const empilhar = kind !== 'notice' && (opts.confirmLabel || 'Confirmar').length + (opts.cancelLabel || 'Cancelar').length > 22;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={() => close(kind === 'confirm' ? false : null)} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView behavior="padding" style={styles.dialogRoot}>
        <Pressable style={styles.backdrop} onPress={() => (kind === 'notice' ? close(true) : undefined)} accessibilityElementsHidden />
        <View style={[styles.dialog, shadows.raised]} accessibilityViewIsModal>
          {opts.icon || destructive ? (
            <View style={[styles.dialogIcon, { backgroundColor: destructive ? colors.dangerBg : colors.blue100 }]}>
              <Icon name={opts.icon || 'alert-outline'} size={26} color={destructive ? colors.danger : colors.navy600} />
            </View>
          ) : null}
          <Txt v="h3" style={{ textAlign: opts.icon || destructive ? 'center' : 'left' }} accessibilityRole="header">
            {opts.title}
          </Txt>
          {opts.message ? (
            <Txt v="body" muted style={{ textAlign: opts.icon || destructive ? 'center' : 'left' }}>
              {opts.message}
            </Txt>
          ) : null}

          {kind === 'prompt' ? (
            <View style={{ gap: 6 }}>
              <TextInput
                value={text}
                onChangeText={(t) => {
                  setText(t);
                  setTouched(true);
                }}
                placeholder={opts.placeholder}
                placeholderTextColor={colors.textSubtle}
                multiline={opts.multiline !== false}
                autoFocus
                keyboardType={opts.keyboardType}
                maxLength={opts.maxLength || 600}
                accessibilityLabel={opts.label || opts.title}
                style={[styles.input, opts.multiline !== false && { minHeight: 96, textAlignVertical: 'top' }, touched && invalid && { borderColor: colors.danger }]}
              />
              {touched && invalid ? (
                <Txt v="caption" color={colors.danger}>
                  {opts.errorMessage || `Informe ao menos ${minLen} caracteres.`}
                </Txt>
              ) : null}
            </View>
          ) : null}

          <View style={[styles.dialogActions, empilhar && { flexDirection: 'column-reverse' }]}>
            {kind !== 'notice' ? (
              <Button title={opts.cancelLabel || 'Cancelar'} variant="secondary" onPress={() => close(kind === 'confirm' ? false : null)} style={empilhar ? undefined : { flex: 1 }} />
            ) : null}
            <Button
              title={opts.confirmLabel || (kind === 'notice' ? 'Entendi' : 'Confirmar')}
              variant={destructive ? 'dangerSolid' : 'primary'}
              disabled={kind === 'prompt' && invalid}
              onPress={() => close(kind === 'confirm' ? true : kind === 'prompt' ? text.trim() : true)}
              style={empilhar ? undefined : { flex: 1 }}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  toastWrap: { position: 'absolute', left: 12, right: 12, zIndex: 1000 },
  toast: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.lg },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  dialogRoot: { flex: 1, justifyContent: 'center', padding: 20 },
  dialog: { backgroundColor: colors.surface, borderRadius: radius.xl, padding: 20, gap: 12, alignItems: 'stretch' },
  dialogIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  input: {
    borderWidth: 1.5, borderColor: colors.borderStrong, borderRadius: radius.md, padding: 12, fontSize: 15, color: colors.text, backgroundColor: colors.white,
  },
});
