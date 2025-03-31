import { View, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

const RulesAndSOTG = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollview}
				contentContainerStyle={styles.contentContainer}
			>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Game Rules</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					• All games are 80-minute games to 15; 2 TO/half.{'\n'}
					• All games are soft capped (highest score plus 1) at 80 minutes and hard capped at 90 minutes.{'\n'}
					• A point begins as soon as a goal is scored.{'\n'}
					• The caps do NOT affect timeouts.{'\n'}
				</CustomText>

				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Spirit of the Game</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					Here is the spirit info for Lobster Pot. Please assign a spirit captain to complete score reporting.{'\n'}
				</CustomText>
				<Link style={styles.link} href='https://docs.google.com/forms/d/15NrrAtvd2mt_RGdpkTYDTYHGXHP0RTiIJEI0GXFwfp4/viewform?edit_requested=true'>
					<CustomText allowFontScaling maxFontSizeMultiplier={1.3}>Please report your spirit score using this link!{'\n'}</CustomText>
				</Link>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					Here are some fun spirited activities for the weekend:
				</CustomText>
				<View style={styles.bulletPoints}>
					<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.bulletPoint}>• Please stop by the photobooth for a team picture!</CustomText>
					<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.bulletPoint}>• Keep an eye out on instagram for the Lobster Pot Bucket List (new this year!) Try and complete the bucket list and tag @meultimate</CustomText>
				</View>

				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Wainright Facility</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					• Respect for equipment, the facility, and all playing surfaces are expected at all times.{'\n'}
					• An adult shall supervise groups and organizations at all times.{'\n'}
					• All groups and individuals are expected to leave fields free of <CustomText style={styles.bold}>trash</CustomText> and equipment.{'\n'}
					• All groups and individuals are responsible for returning equipment belonging to the facility to its original spot and condition after use.{'\n'}
					• Please report any vandalism to the Parks and Recreation, or Police Department as soon as it is discovered.{'\n'}
					• All participants, officials, and spectators are expected to display proper sportsmanship and respect to all others on the facility.{'\n'}
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
		...typography.heading4
	},
	content: {
		...typography.text
	},
	link: {
		...typography.textMedium,
		color: 'blue',
	},
	bulletPoints: {
		marginLeft: 15,
		marginBottom: 15
	},
	bulletPoint: {
		...typography.text,
		color: '#333',
	},
	bold: {
		...typography.textBold
	},
});

export default RulesAndSOTG;