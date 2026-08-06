import { Dimensions, Image, ScrollView, StatusBar, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { AppLandingPlayerSvg } from '@/assets/svg';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import { images } from '@/constants';
import { typography } from '@/constants/Typography';

import { SafeAreaView } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const centerContainerWidth = width - 40;

// iPhone SE (2nd/3rd gen) is ~667pt tall; 1st gen ~568pt. On these short screens the
// full-size artwork pushes the Continue button off the bottom, so scale the imagery down.
const isCompact = height < 700;

const svgHeight = isCompact ? 180 : 200;
const svgMarginVertical = isCompact ? 25 : 40;
const logoHeight = isCompact ? 200 : 290;
const logoMarginBottom = isCompact ? 30 : 35;

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}>
        <View style={styles.contentContainer}>
          <AppLandingPlayerSvg style={{ alignSelf: 'center', marginVertical: svgMarginVertical }} height={svgHeight} />
          <CustomText style={styles.welcomeText}>Welcome to</CustomText>
          <Image source={images.tournamentLogo} resizeMode="center" style={styles.tournamentLogo} />
          {/* <CustomText style={styles.tournamentTitle}>Masters Regionals 2026</CustomText> */}
          <PrimaryButton title="Continue" onPress={() => router.push('/(tabs)/home')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    flexGrow: 1,
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
    height: logoHeight,
    marginBottom: logoMarginBottom,
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
