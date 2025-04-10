import PrimaryButton from "@/components/buttons/PrimaryButton";
import CustomText from "@/components/CustomText";
import { icons, images } from "@/constants";
import { typography } from "@/constants/Typography";
import { router } from "expo-router";
import { Text, View, StyleSheet, Image, SafeAreaView, Dimensions, StatusBar } from "react-native";

const { width } = Dimensions.get('window');
const centerContainerWidth = width - 40;

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor='#fff' />
      <Image 
        source={icons.frisbeePlayer}
        resizeMode="contain"
        style={styles.image}
      />
      <View style={styles.contentContainer}>
        <CustomText style={styles.welcomeText}>Welcome to</CustomText>
        <View style={styles.tournamentLogoContainer}>
          <Image 
            source={images.regionals}
            resizeMode="contain"
            style={styles.tournamentLogo}
          />
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
    marginTop: 50,
    width: '60%',
    maxHeight: 170,
  },
  tournamentLogo: {
    width: '80%',
    maxHeight: 300,
  },
  welcomeText: {
    ...typography.h2,
    color: "#EA1D25",
    textAlign: 'center'
  },
  tournamentLogoContainer: {
    maxHeight: 300,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  }
})
