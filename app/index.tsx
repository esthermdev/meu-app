import { Dimensions, Image, StatusBar, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppLandingPlayerSvg } from '@/assets/svg';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import { images } from '@/constants';
import { typography } from '@/constants/Typography';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const centerContainerWidth = width - 40;

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <View style={styles.contentContainer}>
        <AppLandingPlayerSvg style={{ alignSelf: 'center', marginVertical: 40 }} height={200} />
        <CustomText style={styles.welcomeText}>Welcome to</CustomText>
        <Image source={images.tournamentLogo} resizeMode="center" style={styles.tournamentLogo} />
        {/* <CustomText style={styles.tournamentTitle}>Masters Regionals 2026</CustomText> */}

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
    marginVertical: 20,
    borderRadius: 20,
    backgroundColor: 'grey',
  },
  tournamentLogo: {
    height: 290,
    marginBottom: 35,
    marginTop: 10,
    alignSelf: 'center',
  },
  tournamentTitle: {
    ...typography.heading1,
    color: '#276B5D',
    textAlign: 'center',
    fontWeight: '800',
    letterSpacing: 1,
    paddingHorizontal: 4,
    textShadowColor: 'rgba(39, 107, 93, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});
