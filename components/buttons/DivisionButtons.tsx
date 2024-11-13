import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { router } from 'expo-router';
import { ms } from 'react-native-size-matters';

interface DivisionButtonProps {
  route: any;
  title: string;
  color: string;
  icon: string | null;
}

  export const DivisionButton = React.memo<DivisionButtonProps>(({ route, title, color, icon }) => (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: color }]}
      onPress={() => router.push(`${route}`)}
    >
      <View style={styles.iconContainer}>
        <FontAwesome6 name={icon} size={ms(25)} color={color} />
      </View>
      <Text maxFontSizeMultiplier={1.1} style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
));


const styles = StyleSheet.create({
  button: {
    width: '45%',
    aspectRatio: 1,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  iconContainer: {
    width: ms(50),
    height: ms(50),
    borderRadius: 40,
    backgroundColor: 'white',
    shadowColor: 'white',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: ms(15),
    fontFamily: 'OutfitSemiBold'
  },
});