import { Stack } from "expo-router";
import ScreenTitle from "@/components/headers/ScreenTitle";

export default function StandingsLayout() {
    return (
        <Stack>
            <Stack.Screen 
                name='index' 
                options={{
                    header: () => <ScreenTitle title='Standings' route={'/(tabs)'} showBackButton={false} /> 
                }}
            />
            <Stack.Screen name="[division]" options={{ headerShown: false }}/>
        </Stack>
    );
};