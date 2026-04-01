import FulfilledTrainerRequestList from '@/components/features/requests/FulfilledTrainerRequestList';
import TrainerAvailabilityList from '@/components/features/requests/TrainerAvailabilityList';
import TrainerRequestsList from '@/components/features/requests/TrainerRequestsList';
import { typography } from '@/constants/Typography';
import { RequestsProvider } from '@/context/RequestsContext';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const TrainerManagementScreen = () => {
  return (
    <RequestsProvider>
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
        <Tab.Screen name="REQUESTS" component={TrainerRequestsList} />
        <Tab.Screen name="FULFILLED" component={FulfilledTrainerRequestList} />
        <Tab.Screen name="TRAINERS" component={TrainerAvailabilityList} />
      </Tab.Navigator>
    </RequestsProvider>
  );
};

export default TrainerManagementScreen;
