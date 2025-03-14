import React, { useState, useEffect, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, Text, View, FlatList, Switch, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@rneui/themed';
import { ms } from 'react-native-size-matters';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';

const Tab = createMaterialTopTabNavigator();

// Define types based on your Supabase schema
type CartRequest = Database['public']['Tables']['cart_requests']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type LocationType = Database['public']['Enums']['location_type'];

const CartManagementScreen = () => {
  return (
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#EA1D25',
          tabBarInactiveTintColor: '#8F8DAA',
          tabBarLabelStyle: {
            fontFamily: 'Outfit-Semibold',
            fontSize: ms(12),
          },
          tabBarStyle: {
            backgroundColor: '#262537',
            borderBottomWidth: 1,
            borderBottomColor: '#8F8DAA',
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#EA1D25',
            height: 3,
          },
        }}
      >
        <Tab.Screen name="Active Requests" component={CartRequestsList} />
        <Tab.Screen name="Drivers" component={DriversAvailabilityScreen} />
      </Tab.Navigator>
  );
};

const CartRequestsList = () => {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };

  useEffect(() => {
    fetchRequests();
    const subscription = supabase
      .channel('cart_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_requests' }, fetchRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_requests')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching cart requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: number) => {
    try {
      const { data, error } = await supabase
        .from('cart_requests')
        .update({
          status: 'confirmed' as Database['public']['Enums']['request_status'],
          driver: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (data) {
        Alert.alert('Success', 'You have accepted the cart request.');
        fetchRequests();
      } else {
        Alert.alert('Request Unavailable', 'This request has already been accepted by another driver.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getLocationLabel = (locationType: LocationType) => {
    switch (locationType) {
      case 'Field':
        return 'Field';
      case 'Entrance':
        return 'Main Entrance';
      case 'Tourney Central':
        return 'Tournament HQ';
      case 'Lot 1':
        return 'Parking Lot 1';
      case 'Lot 2':
        return 'Parking Lot 2';
      default:
        return locationType;
    }
  };

  const renderItem = ({ item }: { item: CartRequest }) => (
    <Card containerStyle={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.requestTitle}>Transport Request</Text>
        </View>
        <Text style={styles.requestTime}>{formatDate(item.created_at)}</Text>
      </View>
      
      <View style={styles.cardContent}>
        <View style={styles.locationContainer}>
          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>From:</Text>
            <Text style={styles.locationValue}>
              {getLocationLabel(item.from_location)}
              {item.from_field_number ? ` ${item.from_field_number}` : ''}
            </Text>
          </View>
          
          <Ionicons name="arrow-forward" size={20} color="#B0B0B0" />
          
          <View style={styles.locationBox}>
            <Text style={styles.locationLabel}>To:</Text>
            <Text style={styles.locationValue}>
              {getLocationLabel(item.to_location)}
              {item.to_field_number ? ` ${item.to_field_number}` : ''}
            </Text>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Passengers:</Text>
            <Text style={styles.detailValue}>{item.passenger_count || 1}</Text>
          </View>
          
          {item.special_request && (
            <View style={styles.specialRequestContainer}>
              <Text style={styles.specialRequestLabel}>Special Request:</Text>
              <Text style={styles.specialRequestText}>{item.special_request}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptRequest(item.id)}
        >
          <Text style={styles.buttonText}>Accept Request</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading cart requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No active cart requests</Text>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchRequests}
        />
      )}
    </SafeAreaView>
  );
};

const DriversAvailabilityScreen = () => {
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_driver', true)
        .order('full_name');

      if (error) throw error;
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
    }
  }, []);

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  const toggleAvailability = async (driverId: string, currentAvailability: boolean | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: !currentAvailability })
        .eq('id', driverId);

      if (error) throw error;

      // Update local state
      setDrivers(drivers.map(driver =>
        driver.id === driverId
          ? { ...driver, is_available: !currentAvailability }
          : driver
      ));
    } catch (error) {
      console.error('Error updating driver availability:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  }, [fetchDrivers]);

  const renderDriverItem = ({ item }: { item: Profile }) => (
    <View style={styles.driverItem}>
      <View style={styles.driverInfo}>
        <Text style={styles.driverName}>{item.full_name || 'Unnamed Driver'}</Text>
        <Text style={[styles.availabilityText,
        { color: item.is_available ? '#59DE07' : '#EA1D25' }]}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </Text>
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
        data={drivers}
        renderItem={renderDriverItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.driverList}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333243',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    color: '#B0B0B0',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333243',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Outfit-Medium',
    color: '#B0B0B0',
  },
  cardContainer: {
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#1F1F2F',
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  requestTime: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#B0B0B0',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  cardContent: {
    flexDirection: 'column',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  locationBox: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#B0B0B0',
    marginBottom: 4,
  },
  locationValue: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: 'white',
  },
  detailsContainer: {
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#B0B0B0',
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    color: 'white',
  },
  specialRequestContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFA500',
  },
  specialRequestLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    color: '#B0B0B0',
    marginBottom: 4,
  },
  specialRequestText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: 'white',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  completeButton: {
    backgroundColor: '#00B0FB',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: 'white',
  },
  listContainer: {
    paddingVertical: 15,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#333243',
  },
  driverList: {
    padding: 10,
  },
  driverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1F1F2F',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  availabilityText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    marginTop: 5,
  },
});

export default CartManagementScreen;