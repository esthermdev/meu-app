// app/schedule/[division]/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useScheduleOptions } from '@/hooks/useScheduleConfig';

export default function DivisionLayout() {
	const { division } = useLocalSearchParams();
	const { scheduleOptions } = useScheduleOptions(Number(division))
  console.log(scheduleOptions)

	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					headerShown: false
				}}
			/>
			{scheduleOptions.map(gameType => 
				<Stack.Screen 
					key={gameType.route}
					name={gameType.route}
					options={{
						title: gameType.title,
						headerShown: false
					}}
				/>
			)}
		</Stack>
	);
}