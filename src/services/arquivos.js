import { Platform, Share } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';

// Leitura de imagem em base64: expo-print não carrega arquivos locais (file://) dentro do HTML.
async function lerComoDataUri(uri) {
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    return new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = reject;
      fr.readAsDataURL(blob);
    });
  }
  const b64 = await new File(uri).base64();
  return `data:image/${/\.png$/i.test(uri) ? 'png' : 'jpeg'};base64,${b64}`;
}

export async function fotosParaBase64(fotos = []) {
  const out = {};
  for (const f of fotos) {
    if (!f.uri) continue;
    try {
      out[f.id] = await lerComoDataUri(f.uri);
    } catch (e) {
      // foto indisponível (cache limpo): o PDF usa o quadro de identificação no lugar
    }
  }
  return out;
}

function baixarNoNavegador(nome, conteudo, mime) {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// PDF do RDO (RF-15): gera o arquivo, dá um nome legível e abre o compartilhamento do sistema.
export async function compartilharPdf(html, nomeArquivo) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return { web: true };
  }
  const { uri } = await Print.printToFileAsync({ html, width: 595, height: 842 });
  let alvo = uri;
  try {
    const destino = new File(Paths.cache, nomeArquivo);
    if (destino.exists) destino.delete();
    new File(uri).copy(destino);
    alvo = destino.uri;
  } catch (e) {
    // mantém o nome gerado pelo sistema
  }
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(alvo, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Compartilhar RDO em PDF' });
  }
  return { uri: alvo };
}

export async function imprimir(html) {
  await Print.printAsync({ html });
}

// Exportação CSV (RF-18): UTF-8 com BOM e separador ";" para abrir corretamente no Excel em pt-BR.
export async function compartilharCsv(nomeArquivo, texto) {
  const conteudo = `﻿${texto}`;
  if (Platform.OS === 'web') {
    baixarNoNavegador(nomeArquivo, conteudo, 'text/csv;charset=utf-8');
    return { web: true };
  }
  try {
    const arquivo = new File(Paths.cache, nomeArquivo);
    if (arquivo.exists) arquivo.delete();
    arquivo.create();
    arquivo.write(conteudo);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(arquivo.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text', dialogTitle: 'Exportar dados do RDO' });
    }
    return { uri: arquivo.uri };
  } catch (e) {
    await Share.share({ message: texto, title: nomeArquivo });
    return { texto: true };
  }
}
