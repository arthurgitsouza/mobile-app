import React, { useEffect, useState } from 'react';
import { Modal, View } from 'react-native';
import { colors } from '../../../../theme';
import { shadows } from '../../../../theme/shadows';
import { Icon, ProgressBar, Txt } from '../../../../components/ui';
import { styles } from './styles';

const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

// RNF-02: fotos mostram progresso de envio. No protótipo o envio é simulado; offline, apenas grava no aparelho.
export default function SubmitProgress({ visible, fotos, online, onConcluir }) {
  const [progresso, setProgresso] = useState({});
  const [etapa, setEtapa] = useState('dados');

  useEffect(() => {
    if (!visible) return undefined;
    let cancelado = false;
    setProgresso({});
    setEtapa(online ? 'dados' : 'local');
    (async () => {
      await dormir(450);
      if (online) {
        for (const f of fotos) {
          for (let p = 0; p <= 100; p += 25) {
            if (cancelado) return;
            setProgresso((x) => ({ ...x, [f.id]: p }));
            await dormir(120);
          }
        }
        if (cancelado) return;
        setEtapa('final');
        await dormir(350);
      }
      if (!cancelado) onConcluir();
    })();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const total = fotos.length
    ? Math.round(fotos.reduce((s, f) => s + (progresso[f.id] || 0), 0) / fotos.length)
    : etapa === 'final'
      ? 100
      : 30;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.root}>
        <View style={[styles.card, shadows.raised]} accessibilityViewIsModal>
          <View style={styles.icon}>
            <Icon name={online ? 'cloud-upload-outline' : 'content-save-outline'} size={30} color={colors.navy600} />
          </View>
          <Txt v="h3" style={styles.textAlignCenter} accessibilityRole="header">
            {online ? 'Enviando RDO ao master…' : 'Salvando no aparelho…'}
          </Txt>
          <Txt v="small" muted style={styles.textAlignCenter}>
            {online
              ? 'Dados e fotos estão sendo enviados com segurança.'
              : 'Sem conexão: o RDO será enviado automaticamente quando a rede voltar.'}
          </Txt>
          {online ? <ProgressBar value={total} height={10} label="Progresso do envio" /> : null}
          {online
            ? fotos.map((f) => (
                <View key={f.id} style={styles.row}>
                  <Icon
                    name={(progresso[f.id] || 0) >= 100 ? 'check-circle' : 'image-outline'}
                    size={18}
                    color={(progresso[f.id] || 0) >= 100 ? colors.success : colors.textMuted}
                  />
                  <Txt v="caption" muted style={styles.flex1} numberOfLines={1}>
                    Foto {String(f.numero).padStart(2, '0')} — {f.legenda}
                  </Txt>
                  <Txt v="caption" muted>
                    {progresso[f.id] || 0}%
                  </Txt>
                </View>
              ))
            : null}
        </View>
      </View>
    </Modal>
  );
}
