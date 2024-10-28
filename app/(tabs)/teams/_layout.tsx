import { Stack } from "expo-router";
import ScreenTitle from "@/components/headers/ScreenTitle";

export default function TeamsLayout() {
    return (
        <Stack>
            <Stack.Screen 
                name='index' 
                options={{
                    header: () => <ScreenTitle title='Teams' route={'/(tabs)'} showBackButton={false} /> 
                }}
            />
        </Stack>
    );
};