import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

const RulesAndSOTG = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollview} contentContainerStyle={styles.contentContainer}>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>
          Saturday & Sunday
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • Games are hard capped at 90 minutes. Soft cap at 80 minutes.{'\n'}• Games are to 15.
          {'\n'}• 2 timeouts per half.{'\n'}• A point begins as soon as a goal is scored.{'\n'}• The caps do NOT affect
          timeouts.
          {'\n'}• Use the port-o-potties, not the bushes.{'\n'}
        </CustomText>
        <Link
          allowFontScaling
          maxFontSizeMultiplier={1.3}
          style={styles.link}
          href="https://www.usaultimate.org/competition/rules/">
          Link to USAU rules
        </Link>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollview: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentHeader: {
    ...typography.heading4,
    marginBottom: 10,
  },
  content: {
    ...typography.text,
  },
  link: {
    ...typography.textMedium,
    color: 'blue',
  },
  bold: {
    ...typography.textBold,
  },
  bulletPoint: {
    ...typography.text,
    color: '#333',
  },
  bulletPoints: {
    marginBottom: 15,
    marginLeft: 15,
  },
  contentSubHeader: {
    ...typography.heading5,
    color: '#EA1D25',
    textDecorationLine: 'underline',
  },
});

export default RulesAndSOTG;
