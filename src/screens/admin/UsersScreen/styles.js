import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  chips: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 8 
  },
  row: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 12, 
    padding: 12 
  },
  tags: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 6 
  },
  searchMargin: {
    marginTop: 8,
  },
  userInfo: {
    flex: 1,
    gap: 3,
  },
});