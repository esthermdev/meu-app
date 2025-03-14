// components/buttons/CircleIconButton.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { typography } from '@/constants/Typography';

type MaterialIconNames = keyof typeof MaterialCommunityIcons.glyphMap;

interface CircleIconButtonProps {
  icon: MaterialIconNames;
  label: string;
  route?: Href<string | object>;
  disabled?: boolean;
}

const CircleIconButton: React.FC<CircleIconButtonProps> = ({
  icon,
  label,
  route,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.button}
        onPress={() => route ? router.push(route) : null}
        disabled={disabled}
      >
        <MaterialCommunityIcons name={icon} size={28} color="#347764" />
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    textAlign: 'center',
    marginTop: 5,
    ...typography.bodyBold
  },
});

export default CircleIconButton;