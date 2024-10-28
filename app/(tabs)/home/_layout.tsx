import { Stack } from "expo-router";
import ScreenTitle from "@/components/headers/ScreenTitle";

export default function HomeLayout() {
    return (
        <Stack>
            <Stack.Screen 
                name='index'
                options={{ 
                    headerShown: false
                }} 
            />
        </Stack>
    );
};