import PrimaryButton from "@/components/buttons/PrimaryButton";
import { icons } from "@/constants";
import { typography } from "@/constants/Typography";
import { router } from "expo-router";
import { Text, View, StyleSheet, Image, SafeAreaView, Dimensions } from "react-native";

const { width } = Dimensions.get('window');
const centerContainerWidth = width - 40;

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <Image 
        source={icons.frisbeePlayer}
        resizeMode="contain"
        style={styles.image}
      />
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeText}>Welcome to</Text>
        <View style={styles.tournamentLogo}>
          <Text>TOURNAMENT LOGO HERE</Text>
        </View>
        <PrimaryButton title="Continue" onPress={() => router.push('/(tabs)/home')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "flex-start",
    alignItems: "center",
    backgroundColor: '#fff'
  },
  contentContainer: {
    flex: 1,
    width: centerContainerWidth,
  },
  image: {
    marginTop: 80,
    width: '60%',
    maxHeight: 170,
  },
  welcomeText: {
    ...typography.h2,
    color: "#EA1D25",
    textAlign: 'center'
  },
  tournamentLogo: {
    height: 200,
    backgroundColor: '#F7F7F7',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32
  }
})
