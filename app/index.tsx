import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import { icons, images } from '@/constants';
import { typography } from '@/constants/Typography';
import { router } from 'expo-router';
import { View, StyleSheet, Image, SafeAreaView, Dimensions, StatusBar } from 'react-native';

const { width } = Dimensions.get('window');
const centerContainerWidth = width - 40;

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <Image source={icons.frisbeePlayer} resizeMode="contain" style={styles.image} />
      <View style={styles.contentContainer}>
        <CustomText style={styles.welcomeText}>Welcome to</CustomText>
        <View style={styles.tournamentLogoContainer}>
          <Image
            source={images.tournamentLogo}
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
    alignItems: 'center',
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'flex-start',
    padding: 20,
  },
  contentContainer: {
    flex: 1,
    width: centerContainerWidth,
  },
  image: {
    marginTop: 50,
    maxHeight: 170,
    width: '60%',
  },
  tournamentLogo: {
    maxHeight: 250,
    width: '80%',
  },
  tournamentLogoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    maxHeight: 250,
  },
  welcomeText: {
    ...typography.heading2,
    color: '#EA1D25',
    textAlign: 'center',
  },
});
