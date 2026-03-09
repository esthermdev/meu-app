import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React, { useCallback, useRef } from 'react';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import CartRequestsList from '@/components/features/requests/CartRequestsList';
import FulfilledCartRequestsList from '@/components/features/requests/FulfilledCartRequestList';
import DriversAvailabilityList from '@/components/features/requests/DriversAvailabilityList';

const Tab = createMaterialTopTabNavigator();

// Create a context or ref-based system to manage refresh callbacks
const refreshCallbacksRef = {
  cartRequests: null as (() => void) | null,
  fulfilledRequests: null as (() => void) | null,
};

const CartManagementScreen = () => {
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      // Trigger refresh on all registered callbacks
      refreshCallbacksRef.cartRequests?.();
      refreshCallbacksRef.fulfilledRequests?.();
    }, 250);
  }, []);

  // Set up a single real-time subscription for all cart requests
  React.useEffect(() => {
    const subscription = supabase
      .channel('cart_management_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_requests',
        },
        (payload) => {
          console.log('Cart management real-time update:', payload);
          scheduleRealtimeRefresh();
        },
      )
      .subscribe((status) => {
        console.log('Cart management subscription status:', status);
        // Trigger initial refresh when subscription is established
        if (status === 'SUBSCRIBED') {
          scheduleRealtimeRefresh();
        }
      });

    return () => {
      console.log('Unsubscribing from cart_management_channel');
      subscription.unsubscribe();
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, [scheduleRealtimeRefresh]);

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
      <Tab.Screen
        name="MY REQUESTS"
        children={() => (
          <CartRequestsList
            registerRefreshCallback={(callback) => {
              refreshCallbacksRef.cartRequests = callback;
            }}
          />
        )}
      />
      <Tab.Screen
        name="ALL RIDES"
        children={() => (
          <FulfilledCartRequestsList
            registerRefreshCallback={(callback) => {
              refreshCallbacksRef.fulfilledRequests = callback;
            }}
          />
        )}
      />
      <Tab.Screen name="DRIVERS" component={DriversAvailabilityList} />
    </Tab.Navigator>
  );
};

export default CartManagementScreen;
