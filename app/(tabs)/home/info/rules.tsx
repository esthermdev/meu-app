import { View, StyleSheet, ScrollView } from 'react-native';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

const RulesAndSOTG = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollview}
				contentContainerStyle={styles.contentContainer}
			>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Saturday</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					• Games are hard capped at 90 minutes. No soft cap.{'\n'}
					• Games are to 13.{'\n'}
					• One timeout per half with a floater.{'\n'}
					• A point begins as soon as a goal is scored.{'\n'}
					• The caps do NOT affect timeouts.{'\n'}
					• Use the port-o-potties, not the bushes.{'\n'}
				</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Sunday</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					• Games are 1hour 40minutes to hard cap.{'\n'}
					• Games are to 15.{'\n'}
					• A point begins as soon as a goal is scored.{'\n'}
					• The caps do NOT affect timeouts.{'\n'}
					• Use the port-o-potties, not the bushes.{'\n'}
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