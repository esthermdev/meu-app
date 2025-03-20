import { Stack } from "expo-router";
import { SafeAreaView } from "react-native";
import { CustomAdminHeader } from "@/components/headers/CustomAdminHeader";

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name='index' 
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomAdminHeader title='Admin' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name='trainers-list'
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomAdminHeader title='Trainers List' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name='update-scores'
        options={{
          headerShown: false
        }}
      />
      <Stack.Screen name="cart-requests"
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomAdminHeader title='Cart Requests' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name='water-requests'
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomAdminHeader title='Cart Requests' />
            </SafeAreaView>
        }}
      />
      <Stack.Screen name='announcements'
        options={{
          header: () =>
            <SafeAreaView style={{ backgroundColor: '#EA1D25' }}>
              <CustomAdminHeader title='Public Announcements' />
            </SafeAreaView>
        }}
      />
    </Stack>
  );
};