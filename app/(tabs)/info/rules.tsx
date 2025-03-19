import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { typography } from '@/constants/Typography';

const RulesAndSOTG = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollview}
				contentContainerStyle={styles.contentContainer}
			>
				<Text style={styles.contentHeader}>Game Rules</Text>
				<Text style={styles.content}>
					• All games are 80-minute games to 15; 2 TO/half.{'\n'}
					• All games are soft capped (highest score plus 1) at 80 minutes and hard capped at 90 minutes.{'\n'}
					• A point begins as soon as a goal is scored.{'\n'}
					• The caps do NOT affect timeouts.{'\n'}
				</Text>

				<Text style={styles.contentHeader}>Spirit of the Game</Text>
				<Text style={styles.content}>
					Here is the spirit info for Lobster Pot. Please assign a spirit captain to complete score reporting.{'\n'}
				</Text>
				<Link style={styles.link} href='https://docs.google.com/forms/d/15NrrAtvd2mt_RGdpkTYDTYHGXHP0RTiIJEI0GXFwfp4/viewform?edit_requested=true'>
					Please report your spirit score using this link!{'\n'}
				</Link>
				<Text style={styles.content}>
					Here are some fun spirited activities for the weekend:
				</Text>
				<View style={styles.bulletPoints}>
					<Text style={styles.bulletPoint}>• Please stop by the photobooth for a team picture!</Text>
					<Text style={styles.bulletPoint}>• Keep an eye out on instagram for the Lobster Pot Bucket List (new this year!) Try and complete the bucket list and tag @meultimate</Text>
				</View>

				<Text style={styles.contentHeader}>Wainright Facility</Text>
				<Text style={styles.content}>
					• Respect for equipment, the facility, and all playing surfaces are expected at all times.{'\n'}
					• An adult shall supervise groups and organizations at all times.{'\n'}
					• All groups and individuals are expected to leave fields free of <Text style={styles.bold}>trash</Text> and equipment.{'\n'}
					• All groups and individuals are responsible for returning equipment belonging to the facility to its original spot and condition after use.{'\n'}
					• Please report any vandalism to the Parks and Recreation, or Police Department as soon as it is discovered.{'\n'}
					• All participants, officials, and spectators are expected to display proper sportsmanship and respect to all others on the facility.{'\n'}
				</Text>
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
		...typography.h4
	},
	content: {
		...typography.body
	},
	link: {
		...typography.bodyMedium,
		color: 'blue',
	},
	bulletPoints: {
		marginLeft: 15,
		marginBottom: 15
	},
	bulletPoint: {
		...typography.body,
		color: '#333',
	},
	bold: {
		...typography.bodyBold
	},
});

export default RulesAndSOTG;