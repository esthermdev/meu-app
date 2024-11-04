import HomeButtons from "@/components/buttons/HomeButtons";
import { View, Text, StyleSheet } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.buttonContainer}>
        <HomeButtons 
          title="My Games"
          buttonColor={{ backgroundColor: '#FA7930' }}
          icon="star"
          route="/(tabs)/home/mygames"
          disabled={false}
        />
        <HomeButtons 
          title="Watch Live"
          buttonColor={{ backgroundColor: '#FF026C' }}
          icon="youtube-play"
          route="/(tabs)"
          disabled={false}
        />
        <HomeButtons 
          title="Field Map"
          buttonColor={{ backgroundColor: '#B6C846' }}
          icon="map"
          route="/(tabs)"
          disabled={false}
        />
        <HomeButtons 
          title="Report Spirit Scores"
          buttonColor={{ backgroundColor: '#41A603' }}
          icon="handshake-o"
          route="/(tabs)"
          disabled={false}
        />
        <Text>This is the Home screen.</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 15,
  }
});