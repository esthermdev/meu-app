import { FontAwesome } from '@expo/vector-icons';
import { router, Href } from 'expo-router';
import { StyleSheet, Text, Dimensions, TouchableOpacity } from 'react-native';

type FontAwesomeNames = keyof typeof FontAwesome.glyphMap;

interface HomeButtonsProps {
    title: string;
    icon: FontAwesomeNames;
    buttonColor: object;
    route?: Href<string | object>;
    disabled: boolean;
}

export const HomeButtons: React.FC<HomeButtonsProps> = ({
    title, icon, buttonColor, route, disabled
}) => {
    return (
        <TouchableOpacity 
            style={[styles.buttonStyle, buttonColor]}
            onPress={() => route ? router.push(route) : router.dismissAll()}
            disabled={disabled}
        >
            <FontAwesome name={icon} size={24} color='#fff' />
            <Text maxFontSizeMultiplier={1.1} style={styles.buttonText}>{title}</Text>
        </TouchableOpacity>
    );
}

export default HomeButtons;

const styles = StyleSheet.create({
  buttonStyle: {
    flex: 1,
    padding: 20,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    borderRadius: 22,
    minWidth: 160,
    minHeight: 120 
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'OutfitBold',
    color: '#fff'
  }
})