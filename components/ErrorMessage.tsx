// Components/ErrorMessage.tsx
import { typography } from '@/constants/Typography';
import { Text, StyleSheet } from 'react-native';

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;
  
  return <Text style={styles.errorText}>{message}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    color: '#EA1D25',
    ...typography.bodySmall,
  },
});

export default ErrorMessage;