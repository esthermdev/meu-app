import { View, StyleSheet, ScrollView } from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

const Wainwright = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollview}
				contentContainerStyle={styles.contentContainer}
			>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Wainwright Facility</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					• Respect for equipment, the facility, and all playing surfaces are expected at all times.{'\n'}
					• An adult shall supervise groups and organizations at all times.{'\n'}
					• All groups and individuals are expected to leave fields free of trash and equipment.{'\n'}
					• Please report any vandalism to the Parks and Recreation, or Police Department as soon as it is discovered.{'\n'}
					• All participants, officials and spectators are expected to display proper sportsmanship and respect to all others on the facility.
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
		...typography.heading3,
		marginBottom: 10,
	},
	contentSubHeader: {
		...typography.heading5,
		color: '#EA1D25',
		textDecorationLine: "underline"
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

export default Wainwright;