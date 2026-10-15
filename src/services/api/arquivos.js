import { File, Directory, Paths } from 'expo-file-system';
import { Platform } from 'react-native';
import { ApiError } from './client.js';

// Imagens do seletor ficam em cache. A fila nativa usa uma cópia durável antes de gravar o item.
export async function preservarFotos(rdo) {
  try {
    if (Platform.OS === 'web') {
      const fotos = await Promise.all(
        rdo.fotos.map(async (foto) => {
          if (!foto.uri?.startsWith('blob:')) return foto;
          const blob = await (await fetch(foto.uri)).blob();
          const uri = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          return { ...foto, uri };
        }),
      );
      return { ...rdo, fotos };
    }
    const pasta = new Directory(Paths.document, 'rdo-fila');
    pasta.create({ idempotent: true, intermediates: true });
    const fotos = await Promise.all(
      rdo.fotos.map(async (foto) => {
        if (!foto.uri || foto.envio === 'enviada' || /^https?:/.test(foto.uri)) return foto;
        const extensao = foto.uri.split(/[?#]/)[0].match(/\.(jpe?g|png|webp|heic)$/i)?.[0] || '.jpg';
        const destino = new File(pasta, encodeURIComponent(foto.id) + extensao);
        if (foto.uri !== destino.uri && !destino.exists) await new File(foto.uri).copy(destino);
        return { ...foto, uri: destino.uri };
      }),
    );
    return { ...rdo, fotos };
  } catch {
    throw new ApiError({
      codigo: 'ARMAZENAMENTO',
      mensagem: 'Não foi possível guardar as fotos no aparelho. Libere espaço e tente novamente.',
    });
  }
}
