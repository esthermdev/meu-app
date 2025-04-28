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
					On behalf of <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={{ ...typography.textSemiBold, color: '#EA1D25'}}>USA Ultimate, Maine Ultimate </CustomText>and the <CustomText allowFontScaling maxFontSizeMultiplier={1.3} style={{ ...typography.textSemiBold, color: '#EA1D25'}}>City of South Portland</CustomText>, I welcome you to the 2025 Regionals.
					{'\n\n'}
					The tournament takes place at the Wainwright Complex, which is located at 125 Gary Maietta Way in South Portland Maine.  The Wainwright Complex has over 66 acres of developed athletic fields. Ultimate tournaments are hosted here every year by Maine Ultimate, the local organization, from hat leagues to regional Club events. Wainwright also plays host to the Greenbelt Walkway that connects a 6 mile bike/walking trail to Bug Light Park. In the winter months Wainwright turns into a winter wonderland filled with opportunities to skate on the ice rink, ski cross country on the groomed trails and snowshoe around the complex.
					{'\n\n'}
					The greater Portland area is home to many great restaurants and breweries.  We were just named to <Link allowFontScaling={false} href={'https://www.foodandwine.com/global-tastemakers-best-united-states-cities-food-drink-2024-8620202'} style={styles.link}>Food & Wine</Link> top 10 destinations for food and drinks!  From Pizza to a 5 course dinner, ask us for a recommendation.   For the Ultimate Shopper, drive north for about 20 minutes and you'll find yourself in Freeport.  Freeport is home to <Link style={styles.link} href={'https://global.llbean.com/?CORECRD=true&qs=3157801&gad_source=1&gclid=CjwKCAjwt-OwBhBnEiwAgwzrUrsALJ_8Rk3sXUf_kGnm5ssoHETnRGA9Gmy5iPEIqeXf4i_4auTD-RoC-WgQAvD_BwE&gclsrc=aw.ds'}>LL Bean</Link>, a 24 hour retail store, check the entrance doors, they have no locks!
					{'\n\n'}
					There are many lodging opportunities from a weekly VRBO/AirBnB to a one night stay at a national chain hotel.
					{'\n\n'}
					The cost for the tournament will be $650 per team.  You'll get lined fields, access to trainers, golf carts to drive you around, merchandise and we will be livestreaming 1 game per round!  E-Mail rich@maineultimate for an invoice.
					{'\n\n'}
					We look forward to hosting you and please do not hesitate to reach out if you have any questions.
					{'\n\n'}
					Rich and the entire Maine Ultimate crew
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
	},
	link: {
		...typography.text,
		color: 'blue'
	}
});

export default TournamentInfo;