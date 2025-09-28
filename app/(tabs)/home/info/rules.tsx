import { View, StyleSheet, ScrollView } from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import { Link } from 'expo-router';

const RulesAndSOTG = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollview}
				contentContainerStyle={styles.contentContainer}
			>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Saturday & Sunday</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					• Games are hard capped at 90 minutes. Soft cap at 80 minutes.{'\n'}
					• Games are to 15.{'\n'}
					• 2 timeouts per half.{'\n'}
					• A point begins as soon as a goal is scored.{'\n'}
					• The caps do NOT affect timeouts.{'\n'}
					• Use the port-o-potties, not the bushes.{'\n'}
				</CustomText>
				<Link allowFontScaling maxFontSizeMultiplier={1.3} style={styles.link} href="https://www.usaultimate.org/competition/rules/">
					Link to USAU rules
				</Link>
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
		...typography.heading4,
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

export default RulesAndSOTG;