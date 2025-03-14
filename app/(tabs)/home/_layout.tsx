import CustomHeader from "@/components/headers/CustomHeader";
import { Stack } from "expo-router";

export default function HomeLayout() {
	return (
		<Stack>
			<Stack.Screen name='index' options={{ headerShown: false }} />
			<Stack.Screen name='mygames' options={{ header: () => <CustomHeader title='My Games' />}} />
			<Stack.Screen name='fieldmap' options={{ header: () => <CustomHeader title='Field Map' />}} />
			<Stack.Screen name='volunteers' options={{ header: () => <CustomHeader title='Volunteers' />}} />
		</Stack>
	);
};