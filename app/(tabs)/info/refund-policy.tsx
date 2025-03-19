import { typography } from '@/constants/Typography';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

const RefundPolicyScreen = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				style={styles.scrollview}
				contentContainerStyle={styles.contentContainer}
			>
				<Text style={styles.contentHeader}>Tournament Refund Policy</Text>
				<Text style={styles.content}>
					• A 50% refund will be issued if cancellation is made 2 weeks or more before tournament date, unless a replacement team is secured.{'\n'}
					• No refund will be issued if cancellation is made less than 2 weeks before tournament date.{'\n'}
				</Text>

				<Text style={styles.contentHeader}>What If The Tournament Is Cancelled or Shortened?</Text>
				<Text style={styles.content}>
					There are various reasons that may cause Maine Ultimate to cancel an event. Factors influencing refunds include, but are not limited to, the timing of event cancellation, the cause(s) of cancellation, the ability of the Maine Ultimate to recover event expenses, and the scope of the cancellation. Maine Ultimate will assess their financial obligations on a case by case basis and determine refunds at that time.
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
		...typography.body,
		color: '#333',
	},
});

export default RefundPolicyScreen;