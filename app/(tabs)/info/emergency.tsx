import { View, StyleSheet, ScrollView } from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

const EmergencyScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollview}
        contentContainerStyle={styles.contentContainer}
      >
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Maine Ultimate's Emergency Preparedness Plan: Wainwright{'\n'}</CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Emergency Personnel:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          Certified Athletic Trainer (ATC) located in a central spot, the Red Shed or designated central spot, within the Quads/Wainwright during practices, games, and tournaments.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Emergency Communication:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          The ATC(s) onsite carries a cell phone and radio (if applicable). Coaches on the fields should carry a cell phone and/or radio. Contact information should be shared between coaches and ATC(s) for quicker communication.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Emergency Equipment:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          Maine Ultimate provides access to an AED for the Athletic Trainer. The Athletic Trainer should supply their own medical kit. Emergency supplies are stored in the Red Shed including a splint kit, crutches, wound care necessities, and other items as needed.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Roles of the Certified Athletic Trainer:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • Immediate evaluation and care of injured or ill athlete(s) on the field.{'\n'}
          • Determine the need for and delegate the activation of EMS.{'\n'}
          • Return to Play (RTP) decision-making on the injured athlete.{'\n'}
          • Physician referral of injured athlete (if needed).{'\n'}
          • Contacting Maine Ultimate President or site representative regarding emergency situations or serious injuries.{'\n'}
          • Contacting parent(s) of injured athletes under 18.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Roles of Student Athletic Trainer (ATS) and/or Coaches:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • Call 911 (provide necessary information).{'\n'}
          • Scene control: limit scene to sports medicine personnel and move bystanders away.{'\n'}
          • Provide secondary help in immediate care, if requested by the Athletic Trainer.{'\n'}
          • Assign a lookout to direct arriving EMS personnel to the scene.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Roles of Coaches if ATC is NOT present:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          • Activate EMS in ALL emergency situations.{'\n'}
          • Call 911 (provide necessary information).{'\n'}
          • Assign a lookout to direct arriving EMS personnel to the scene.{'\n'}
          • Notify the Athletic Trainer and Maine Ultimate President/onsite Representative of the incident.{'\n'}
          • For non-emergencies, contact the Athletic Trainer or designated medical personnel for return to play questions.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Roles of Maine Ultimate Staff:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          Ensure Wainwright's field access route is clear and accessible to emergency personnel. Ensure a Wainwright Staff member has unlocked and opened any necessary gates on the field access route. Aid in crowd control if necessary.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Storm Safety Location:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          In the event of lightning or severe storm warning, move all individuals inside the main building, inside cars, or inside buses.{'\n'}
        </CustomText>

        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Venue Address:</CustomText>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
          Wainwright Sports Complex{'\n'}
          125 Gary L Maietta Parkway{'\n'}
          South Portland, Maine 04106
        </CustomText>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollview: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  contentHeader: {
    ...typography.heading3
  },
  contentSubHeader: {
    ...typography.textLargeBold
  },
  content: {
    ...typography.text,
    color: '#333',
  },
});

export default EmergencyScreen;