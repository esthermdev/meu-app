import FulfilledWaterRequestsList from '@/components/features/requests/FulfilledWaterRequestList';
import VolunteerAvailabilityList from '@/components/features/requests/VolunteerAvailabilityList';
import WaterRequestsList from '@/components/features/requests/WaterRequestsList';
import { typography } from '@/constants/Typography';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const WaterRequestsScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#EA1D25',
        tabBarInactiveTintColor: '#fff',
        tabBarLabelStyle: {
          ...typography.textXSmall,
        },
        tabBarStyle: {
          backgroundColor: '#262626',
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#EA1D25',
          height: 3,
        },
        tabBarAllowFontScaling: false,
      }}>
      <Tab.Screen name="REQUESTS" component={WaterRequestsList} />
      <Tab.Screen name="FULFILLED" component={FulfilledWaterRequestsList} />
      <Tab.Screen name="VOLUNTEERS" component={VolunteerAvailabilityList} />
    </Tab.Navigator>
  );
};

export default WaterRequestsScreen;
