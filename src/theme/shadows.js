import { Platform } from 'react-native';

// Android usa elevation; iOS usa shadow*; web usa boxShadow (evita o aviso de shadow* obsoleto no react-native-web).
const make = (elevation, opacity, radius, offsetY) =>
  Platform.select({
    android: { elevation },
    web: { boxShadow: `0px ${offsetY}px ${radius}px rgba(1, 0, 40, ${opacity})` },
    default: {
      shadowColor: '#010028',
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: offsetY },
    },
  });

export const shadows = {
  card: make(1, 0.06, 6, 2),
  raised: make(4, 0.12, 12, 6),
  sheet: make(12, 0.2, 18, -4),
};
