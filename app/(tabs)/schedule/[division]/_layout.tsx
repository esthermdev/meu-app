// app/schedule/[division]/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useScheduleOptions } from '@/hooks/useScheduleConfig';
import CustomHeader from '@/components/headers/CustomHeader';
import { useDivisions } from '@/hooks/useScheduleConfig';

export default function DivisionLayout() {
	const { divisionId, divisionName } = useDivisions()
	const { scheduleOptions } = useScheduleOptions(divisionId)

	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					header: () => <CustomHeader title={divisionName} />
				}}
			/>
			{scheduleOptions.map(gameType => 
				<Stack.Screen 
					key={gameType.route}
					name={gameType.route}
					options={{
						title: gameType.title,
						header: () => <CustomHeader title={divisionName} />,
					}}
				/>
			)}
		</Stack>
	);
}