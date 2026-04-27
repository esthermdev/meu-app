import { ScrollView, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

const RulesAndSOTG = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollview} contentContainerStyle={styles.contentContainer}>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>
          D-I
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • In Clipped Pools, winners play winners in the second round. Teams are reseeded for crossovers.{'\n'}• All
          games are 105-minute games to 15; 2 TO/half {'\n'}• All games are soft capped (highest score plus 1) at 90
          mins and hard capped at 105 mins. {'\n'}• A point begins as soon as a goal is scored. {'\n'}• Caps do not
          affect timeouts.
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>
          D-III
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • All pool play and crossover games are 90 min games to 15; 2 TO/half.{'\n'}• All pool play games are soft
          capped (highest score plus 1) at 75 mins and hard capped at 90 mins. {'\n'}• A point begins as soon as a goal
          is scored. {'\n'}• Caps do not affect timeouts.
        </CustomText>
        <View style={styles.divider} />
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • All bracket games are 105 min games to 15; 2TO/half. {'\n'}• All bracket games are soft capped at 90 mins
          and hard capped at 105 mins. {'\n'}• A point begins as soon as a goal is scored. {'\n'}• Caps do not affect
          timeouts.
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
    marginBottom: 5,
  },
  content: {
    ...typography.text,
    marginBottom: 20,
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
  divider: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 15,
  },
  contentSubHeader: {
    ...typography.heading5,
    color: '#EA1D25',
    textDecorationLine: 'underline',
  },
});

export default RulesAndSOTG;
