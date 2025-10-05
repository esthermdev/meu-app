import CustomHeader from "@/components/headers/CustomHeader";
import { Stack } from "expo-router";

export default function HomeLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ header: () => <CustomHeader title='Spirit of the Game' /> }} />
    </Stack>
  );
}
