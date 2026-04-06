import { ScrollView, StyleSheet, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

const Wainwright = () => {
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollview} contentContainerStyle={styles.contentContainer}>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>
          Wainwright Facility
        </CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • Respect for equipment, the facility, and all playing surfaces are expected at all times.
          {'\n'}• An adult shall supervise groups and organizations at all times.{'\n'}• All groups and individuals are
          expected to leave fields free of trash and equipment.{'\n'}• Please report any vandalism to the Parks and
          Recreation, or Police Department as soon as it is discovered.
          {'\n'}• All participants, officials and spectators are expected to display proper sportsmanship and respect to
          all others on the facility.
        </CustomText>
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
    ...typography.heading3,
    marginBottom: 10,
  },
  content: {
    ...typography.text,
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
  link: {
    ...typography.textMedium,
    color: 'blue',
  },
});

export default Wainwright;
