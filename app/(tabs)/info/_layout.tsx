import { Stack } from "expo-router";
import ScreenTitle from "@/components/headers/ScreenTitle";
import CustomHeader from "@/components/headers/CustomHeader";

export default function StandingLayout() {
	return (
		<Stack>
			<Stack.Screen
				name='index'
				options={{
					header: () => <ScreenTitle title='Information' route={'/(tabs)'} showBackButton={false} />
				}}
			/>
			<Stack.Screen name="tournament-info" options={{ header: () => <CustomHeader title='Tournament Info' /> }} />
			<Stack.Screen name="rules" options={{ header: () => <CustomHeader title='Rules' /> }} />
			<Stack.Screen name="emergency" options={{ header: () => <CustomHeader title='In Case of Emergency' /> }} />
			<Stack.Screen name="refund-policy" options={{ header: () => <CustomHeader title='Refund Policy' /> }} />
			<Stack.Screen name="restaurants-hotels" options={{ header: () => <CustomHeader title='Restaurants & Hotels' /> }} />
			<Stack.Screen name="vendors" options={{ header: () => <CustomHeader title='Vendors' /> }} />
			<Stack.Screen name="faq" options={{ header: () => <CustomHeader title='FAQ' /> }} />
			<Stack.Screen name="credits" options={{ header: () => <CustomHeader title='Credits' /> }} />
		</Stack>
	);
};