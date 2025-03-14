import { Stack } from "expo-router";
import CustomHeader from "@/components/headers/CustomHeader";
import { SafeAreaView } from "react-native";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' 
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
              <CustomHeader title='Admin' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name='trainers-list'
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
              <CustomHeader title='Trainers List' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name="cart-requests"
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
              <CustomHeader title='Cart Requests' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name='water-requests'
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#fff' }}>
              <CustomHeader title='Cart Requests' />
            </SafeAreaView>
        }}
      />
    </Stack>
  );
};