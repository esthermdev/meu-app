import React from 'react';

import CartRequestsList from '@/components/features/requests/CartRequestsList';
import DriversAvailabilityList from '@/components/features/requests/DriversAvailabilityList';
import FulfilledCartRequestsList from '@/components/features/requests/FulfilledCartRequestList';
import { typography } from '@/constants/Typography';

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

const Tab = createMaterialTopTabNavigator();

const CartManagementScreen = () => {
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
      <Tab.Screen name="MY REQUESTS" component={CartRequestsList} />
      <Tab.Screen name="ALL RIDES" component={FulfilledCartRequestsList} />
      <Tab.Screen name="DRIVERS" component={DriversAvailabilityList} />
    </Tab.Navigator>
  );
};

export default CartManagementScreen;
