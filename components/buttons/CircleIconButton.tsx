// components/buttons/CircleIconButton.tsx
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router, Href } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
    padding: 8,
  },
  button: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  label: {
    textAlign: 'center',
    fontFamily: 'GeistMedium',
    fontSize: 14,
  },
});

export default CircleIconButton;