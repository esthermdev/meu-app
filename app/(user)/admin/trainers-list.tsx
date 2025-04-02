import { useState, useEffect, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View, FlatList, Switch, RefreshControl } from 'react-native';
import FulfilledTrainerRequestList from '@/components/features/requests/FulfilledTrainerRequestList';
import TrainerRequestsList from '@/components/features/requests/TrainerRequestsList';
import CustomText from '@/components/CustomText';

import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import { RequestsProvider } from '@/context/RequestsContext';

const Tab = createMaterialTopTabNavigator();

type Profile = Database['public']['Tables']['profiles']['Row'];

const TrainerManagementScreen = () => {
  return (
    <RequestsProvider>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#EA1D25',
          tabBarInactiveTintColor: '#fff',
          tabBarLabelStyle: {
            ...typography.bodySmall
          },
          tabBarStyle: {
            backgroundColor: '#262626',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#EA1D25',
            height: 3,
          },
          tabBarAllowFontScaling: false
        }}
      >
        <Tab.Screen name="Requests" component={TrainerRequestsList} />
        <Tab.Screen name="Fulfilled" component={FulfilledTrainerRequestList} />
        <Tab.Screen name="Trainers" component={TrainerAvailabilityScreen} />
      </Tab.Navigator>
    </RequestsProvider>
  );
};

const TrainerAvailabilityScreen = () => {
  const [trainers, setTrainers] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchTrainers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_medical_staff', true)
        .order('full_name');

      if (error) throw error;
      setTrainers(data || []);
    } catch (error) {
      console.error('Error fetching trainers:', error);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const toggleAvailability = async (trainerId: string, currentAvailability: boolean | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: !currentAvailability })
        .eq('id', trainerId);

      if (error) throw error;

      // Update local state
      setTrainers(trainers.map(trainer =>
        trainer.id === trainerId
          ? { ...trainer, is_available: !currentAvailability }
          : trainer
      ));
    } catch (error) {
      console.error('Error updating trainer availability:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTrainers();
    setRefreshing(false);
  }, [fetchTrainers]);

  const renderTrainerItem = ({ item }: { item: Profile }) => (
    <View style={styles.trainerItem}>
      <View style={styles.trainerInfo}>
        <CustomText style={styles.trainerName}>{item.full_name || 'Unnamed Trainer'}</CustomText>
        <CustomText style={[styles.availabilityText,
        { color: item.is_available ? '#59DE07' : '#EA1D25' }]}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </CustomText>
      </View>
      <Switch
        value={!!item.is_available}
        onValueChange={() => toggleAvailability(item.id, item.is_available)}
        trackColor={{ false: "#fff", true: "whitesmoke" }}
        thumbColor={item.is_available ? "#59DE07" : "#828282"}
      />
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={trainers}
        renderItem={renderTrainerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.trainerList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EA1D25']}
            tintColor="#EA1D25"
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333243',
  },
  tabBar: {
    backgroundColor: '#ffffff',
  },
  tabLabel: {
    ...typography.text
  },
  tabIndicator: {
    backgroundColor: '#EA1D25',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  trainerList: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15
  },
  trainerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#262626',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  trainerInfo: {
    flex: 1,
  },
  trainerName: {
    ...typography.textLargeBold,
    color: '#fff'
  },
  availabilityText: {
    ...typography.text,
    marginTop: 5,
  },
});

export default TrainerManagementScreen;