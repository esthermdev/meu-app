// app/schedule/[division]/_layout.js
import React from 'react';
import { Stack } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';

export default function DivisionLayout() {

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