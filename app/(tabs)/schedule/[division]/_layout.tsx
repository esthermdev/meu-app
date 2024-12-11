// app/schedule/[division]/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useScheduleOptions } from '@/hooks/useScheduleConfig';

export default function DivisionLayout() {
	const { division } = useLocalSearchParams();
	const schedule = useScheduleOptions(Number(division))
	console.log(schedule)

	return (
		<Stack>
			<Stack.Screen
				name="index"
				options={{
					headerShown: false
				}}
			/>
			<Stack.Screen
				name="[poolplay]"
				options={{
					headerShown: false
				}}
			/>
		</Stack>
	);
}