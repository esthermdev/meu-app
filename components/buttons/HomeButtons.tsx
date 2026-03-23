import { Dimensions, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Href, router } from 'expo-router';

import { FontAwesome } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const buttonWidth = (width - 80) / 2;

type FontAwesomeNames = keyof typeof FontAwesome.glyphMap;

interface HomeButtonsProps {
  title: string;
  icon: FontAwesomeNames;
  buttonColor: object;
  route?: Href;
  disabled: boolean;
}

export const HomeButtons: React.FC<HomeButtonsProps> = ({ title, icon, buttonColor, route, disabled }) => {
  return (
    <TouchableOpacity
      style={[styles.buttonStyle, buttonColor]}
      onPress={() => (route ? router.push(route) : router.dismissAll())}
      disabled={disabled}>
      <FontAwesome name={icon} size={24} color="#fff" />
      <Text maxFontSizeMultiplier={1.1} style={styles.buttonText}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

export default HomeButtons;

const styles = StyleSheet.create({
  buttonStyle: {
    alignItems: 'flex-start',
    borderRadius: 22,
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 120,
    minWidth: buttonWidth,
    padding: 20,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'OutfitBold',
    fontSize: 18,
  },
});
