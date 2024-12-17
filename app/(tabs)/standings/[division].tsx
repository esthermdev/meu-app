import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';


const DivisionStandings = () => {
  const { division, divisionName } = useLocalSearchParams();

    return (
        <View style={styles.container}>
          <Text>{divisionName} Standings</Text>
        </View>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});

export default DivisionStandings;