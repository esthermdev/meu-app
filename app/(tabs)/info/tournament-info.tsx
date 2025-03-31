import { View, StyleSheet, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

const TournamentInfo = () => {
	return (
		<View style={styles.container}>
			<ScrollView
				contentContainerStyle={styles.contentContainer}
			>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>
					On behalf of <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={{ ...typography.bodyMedium, color: '#EA1D25'}}>Maine Ultimate</CustomText> in conjunction with the City of South Portland, Tyler Technologies, Revision Energy and a host of other groups and organizations we are pleased to welcome you and your team to the Lobster Pot.  We genuinely hope that you find this to be one of the more well run events that you participate in. We have been working hard behind the scenes to ensure this happens.
					{'\n\n'}
					So...
					{'\n'}
					This is the 13th year of the Lobster Pot and will be hosting 88 college teams from all over the northeast and beyond. Congratulations goes to The University of Buffalo men's team, Green Eggs and Ham, for traveling the farthest! And the shortest drive goes to Bowdoin College, the men's team, Clown and the women's team, Chaos Theory.  Is anyone at UVM right now? They have 6 teams at the Lobster Pot!  3 mens teams and 3 women's teams.
					{'\n\n'}
					Make sure you swing by Tourney Central and head over to the Players Lounge sponsored by Tyler Technologies and make sure to grab a disc from them and check out their job listings.  Portland has a great ultimate community and we’d love to have you join us!!  Swing by the merchandise tent, where you’ll find Lobster Pot specific merchandise from BreakMark Ultimate, BE Ultimate, products from Maine Ultimate, Portland Rising and Boston Glory.  Hungry?  Grab an apple from Sweesters Apple Barrel or a banana or a granola bar, candy or a bag of popcorn.  All of this is free in the player lounge.  Looking for something more?  Grab something to eat from PB&Me or El Rodeo.  Got a sweet tooth?  Grab a box of donuts from Eighty8 Donuts and wash it all down with a cup of coffee from Vagabond Coffee.  How fast can you make it through the 140’ Obstacle course?  What’s your vertical?  Lots of things to do and try at tourney central.
					{'\n\n'}
					Want to share the livestream with your friends and family?  Check out the Maine Ultimate page on YouTube.
					{'\n\n'}
					Good luck to you and your team this weekend and "Thank You for Hoppin' in the Pot"!
					{'\n\n'}
					Rich and the Lobster Pot crew
					{'\n\n'}
				</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.content}>Richard Young</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Cell: (207) 807-8727</CustomText>
				<CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={styles.contentSubHeader}>Pronouns: he, him, his <Link style={{ color: 'blue', textDecorationLine: 'underline' }} href='https://pronouns.org/'>What's this?</Link></CustomText>
				<Link href='https://www.maineultimate.org/'><CustomText allowFontScaling maxFontSizeMultiplier={1.3}>Maine Ultimate</CustomText></Link>
			</ScrollView>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	contentContainer: {
		padding: 20
	},
	content: {
		...typography.text
	},
	contentHeader: {
		...typography.heading5
	},
	contentSubHeader: {
		...typography.textBold
	}
});

export default TournamentInfo;