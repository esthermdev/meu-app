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
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentHeader}>Game Rules</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>DI{'\n'}</CustomText>
					• Games are XXXX minutes{'\n'}
					• All games are soft capped (highest score plus 1) at XXX and hard capped at XXXX minutes{'\n'}
					• A point begins as soon as a goal is scored.{'\n'}
					• The caps do NOT affect timeouts.{'\n'}
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

export default RulesAndSOTG;