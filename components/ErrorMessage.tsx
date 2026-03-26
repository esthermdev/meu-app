// Components/ErrorMessage.tsx
import { StyleSheet, Text } from 'react-native';

import { typography } from '@/constants/Typography';

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;

  return <Text style={styles.errorText}>{message}</Text>;
};

const styles = StyleSheet.create({
  errorText: {
    color: '#EA1D25',
    ...typography.textXSmall,
    marginTop: -5,
  },
});

export default ErrorMessage;
