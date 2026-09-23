import * as Haptics from 'expo-haptics';

// Respostas táteis discretas; falhas (web/aparelhos sem suporte) são silenciosas.
const safe = (fn) => {
  try {
    const r = fn();
    if (r && typeof r.catch === 'function') r.catch(() => {});
  } catch (e) {
    // sem háptico
  }
};

export const haptic = {
  tap: () => safe(() => Haptics.selectionAsync()),
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
};
