import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  linha: { 
    paddingHorizontal: 12 
  },
  conteudo: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 10, 
    minHeight: 52 
  },
  searchMargin: {
    marginTop: 8,
  },
  flexOne: {
    flex: 1,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  btnCancel: {
    flex: 1,
  },
  btnSave: {
    flex: 1.3,
  },
});