import { Stack } from 'expo-router';
import CustomHeader from '@/components/headers/CustomHeader';
import { useScheduleOptions } from '@/hooks/useScheduleConfig';
import { useDivisions } from '@/hooks/useScheduleConfig';

export default function DivisionLayout() {
	const { divisionName } = useDivisions()

	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					header: () => <CustomHeader title={divisionName} />
				}}
			/>
			<Stack.Screen
				name="[gameType]"
				options={{ headerShown: false }}
			/>
		</Stack>
	);
}