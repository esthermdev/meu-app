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
        <AppLandingPlayerSvg style={{ alignSelf: 'center', marginVertical: 50 }} height={250} />
        <CustomText style={styles.welcomeText}>Welcome to</CustomText>
        <View style={styles.tournamentLogoContainer}>
          <Image source={images.tournamentLogo} resizeMode="contain" style={styles.tournamentLogo} />
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
    color: '#000',
    textAlign: 'center',
  },
});
