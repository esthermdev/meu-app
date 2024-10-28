import { Stack } from "expo-router";
import ScreenTitle from "@/components/headers/ScreenTitle";

export default function StandingLayout() {
    return (
        <Stack>
            <Stack.Screen 
                name='index' 
                options={{
                    header: () => <ScreenTitle title='Information' route={'/(tabs)'} showBackButton={false} /> 
                }}
            />
        </Stack>
    );
};