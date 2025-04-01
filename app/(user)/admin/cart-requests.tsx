import { useState, useEffect, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View, FlatList, Switch, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import FulfilledCartRequestsList from '@/components/features/requests/FulfilledCartRequestList';
import CustomText from '@/components/CustomText';

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
        tabBarInactiveTintColor: '#fff',
        tabBarLabelStyle: {
          ...typography.textSmall
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
      <Tab.Screen name="Requests" component={CartRequestsList} />
      <Tab.Screen name="Fulfilled" component={FulfilledCartRequestsList} />
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
  
  // Function to calculate time elapsed since request was created
  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const createdAt = new Date(dateString);
    const diffMs = now.getTime() - createdAt.getTime();
    
    // Convert to minutes
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${remainingMins > 0 ? `${remainingMins} min${remainingMins !== 1 ? 's' : ''}` : ''} ago`;
    }
  };
  
  // Function to determine color for time indicator based on elapsed time
  const getTimeColor = (dateString: string | null) => {
    if (!dateString) return '#EA1D25'; // Default to red if unknown
    
    const now = new Date();
    const createdAt = new Date(dateString);
    const diffMs = now.getTime() - createdAt.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 5) return '#59DE07'; // Green for recent (< 5 mins)
    if (diffMins < 15) return '#FFD600'; // Yellow for moderate (5-15 mins)
    return '#EA1D25'; // Red for long wait (> 15 mins)
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

  // Modified renderItem function for CartRequestsList with time indicator
  const renderItem = ({ item }: { item: CartRequest }) => {
    const timeColor = getTimeColor(item.created_at);
    
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.transportTitle}>Transport</CustomText>
          <View style={styles.timeContainer}>
            <View style={[styles.timeIndicator, { backgroundColor: timeColor }]} />
            <CustomText style={styles.waitingTime}>{getTimeSince(item.created_at)}</CustomText>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          {/* Vertical route line with points on the left */}
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint} />
            <View style={styles.routeLine} />
            <View style={styles.routePoint} />
          </View>

          {/* Locations information on the right */}
          <View style={styles.routeInfo}>
            {/* From section */}
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>From: </CustomText><CustomText style={styles.locationText}>
                {item.from_location === 'Field' ? 'Field ' : ''}
                {item.from_location === 'Field' ? item.from_field_number : getLocationLabel(item.from_location)}
              </CustomText>
            </View>

            {/* To section */}
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              <CustomText style={styles.locationText}>
                {item.to_location === 'Field' ? 'Field ' : ''}
                {item.to_location === 'Field' ? item.to_field_number : getLocationLabel(item.to_location)}
              </CustomText>
            </View>
          </View>
        </View>

        <View style={styles.passengerRow}>
          <CustomText style={styles.passengerLabel}>Passengers:</CustomText>
          <CustomText style={styles.passengerCount}>{item.passenger_count || 0}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Created:</CustomText>
          <CustomText style={styles.infoValue}>{formatDate(item.created_at)}</CustomText>
        </View>

        {item.special_request && (
          <View style={styles.specialRequestContainer}>
            <CustomText style={styles.specialRequestLabel}>Special Request:</CustomText>
            <CustomText style={styles.specialRequestText}>{item.special_request}</CustomText>
          </View>
        )}

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={() => acceptRequest(item.id)}
        >
          <CustomText style={styles.acceptButtonText}>Accept Request</CustomText>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomText style={styles.loadingText}>Loading cart requests...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No active cart requests</CustomText>
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
    </View>
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
        <CustomText style={styles.driverName}>{item.full_name || 'Unnamed Driver'}</CustomText>
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
    backgroundColor: '#000',
  },
  // Loading and empty 
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  emptyText: {
    ...typography.textMedium,
    color: '#B0B0B0',
  },
  loadingText: {
    ...typography.textBold,
    color: '#fff'
  },
  // Cart request card styles
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 3,
    paddingBottom: 15
  },
  cardContainer: {
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    backgroundColor: '#262626',
    borderWidth: 0
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66'
  },
  transportTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  requestTime: {
    ...typography.textLarge,
    color: '#aaa',
  },
  locationsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC66',
  },
  routeVisualization: {
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '60%',
    marginVertical: 'auto'
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'space-between',
    gap: 10,
    marginVertical: 10
  },
  locationInfo: {
    flexDirection: 'row',
  },
  routeLabel: {
    ...typography.textLarge,
    color: '#CCCCCC',
  },
  locationText: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  routePoint: {
    width: 10,
    height: 10,
    borderRadius: 6,
    backgroundColor: '#EA1D25',
  },
  routeLine: {
    width: 2,
    flex: 1, // Makes the line fill the space between the points
    backgroundColor: '#EA1D25',
  },
  passengerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  passengerLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  passengerCount: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC66',
    paddingBottom: 8,
    marginBottom: 8
  },
  infoLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  infoValue: {
    ...typography.textSemiBold,
    color: '#CCCCCCBF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  waitingTime: {
    ...typography.textMedium,
    color: '#CCCCCC',
  },
  specialRequestContainer: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: '#EA1D25',
    borderRadius: 5,
    padding: 7,
    marginBottom: 8,
  },
  specialRequestLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  specialRequestText: {
    ...typography.textMedium,
    color: '#fff',
  },
  acceptButton: {
    backgroundColor: '#73BF44',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  acceptButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  // Driver availability screen styles
  screenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  driverList: {
    paddingHorizontal: 15,
    paddingTop: 15,
    paddingBottom: 15
  },
  driverItem: {
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
  driverInfo: {
    flex: 1,
  },
  driverName: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  availabilityText: {
    ...typography.text,
    marginTop: 5,
  },
});

export default CartManagementScreen;