import { Dimensions, StatusBar, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppLandingPlayerSvg } from '@/assets/svg';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
// import { images } from '@/constants';
import { typography } from '@/constants/Typography';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const centerContainerWidth = width - 40;

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.contentContainer}>
        <AppLandingPlayerSvg style={{ alignSelf: 'center', marginVertical: 50 }} height={250} />
        <CustomText style={styles.welcomeText}>Welcome to</CustomText>
        <View style={styles.tournamentLogoContainer}>
          {/* <Image source={images.tournamentLogo} resizeMode="contain" style={styles.tournamentLogo} /> */}
          <CustomText style={styles.tournamentTitle}>New England College Men&apos;s Regionals 2026</CustomText>
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
  welcomeText: {
    ...typography.heading2,
    color: '#000',
    textAlign: 'center',
  },
  tournamentLogoContainer: {
    flex: 1,
    justifyContent: 'center',
    maxHeight: 250,
  },
  tournamentLogo: {
    maxHeight: 250,
    width: '80%',
  },
  tournamentTitle: {
    ...typography.heading2,
    color: '#276B5D',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 30,
    letterSpacing: 1,
    paddingHorizontal: 4,
    textShadowColor: 'rgba(39, 107, 93, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
