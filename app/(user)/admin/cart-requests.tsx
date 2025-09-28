import { useState, useEffect, useCallback } from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { StyleSheet, View, FlatList, Switch, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import FulfilledCartRequestsList from '@/components/features/requests/FulfilledCartRequestList';
import CustomText from '@/components/CustomText';
import { getTimeSince } from '@/utils/getTimeSince';
import { getTimeColor } from '@/utils/getTimeColor';
import { Ionicons } from '@expo/vector-icons';

const Tab = createMaterialTopTabNavigator();

// Define types based on your Supabase schema
type CartRequest = Database['public']['Tables']['cart_requests']['Row'] & {
  from_field_name?: string | null;
  to_field_name?: string | null;
};
type Profile = Database['public']['Tables']['profiles']['Row'];
type LocationType = Database['public']['Enums']['location_type'];

const CartManagementScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#EA1D25',
        tabBarInactiveTintColor: '#fff',
        tabBarLabelStyle: {
          ...typography.textXSmall
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
      <Tab.Screen name="MY REQUESTS" component={CartRequestsList} />
      <Tab.Screen name="ALL RIDES" component={FulfilledCartRequestsList} />
      <Tab.Screen name="DRIVERS" component={DriversAvailabilityScreen} />
    </Tab.Navigator>
  );
};

const CartRequestsList = () => {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [currentRides, setCurrentRides] = useState<CartRequest[]>([]);
  const [pendingRides, setPendingRides] = useState<CartRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPendingCollapsed, setIsPendingCollapsed] = useState<boolean>(false);
  const { profile } = useAuth() as { profile: Profile };

  useEffect(() => {
    fetchRequests();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('cart_requests_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_requests'
        },
        (payload) => {
          console.log('Real-time update received:', payload);
          fetchRequests();
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from cart_requests_channel');
      subscription.unsubscribe();
    };
  }, [profile.id]); // Add profile.id as dependency

  const fetchRequests = async () => {
    try {
      console.log('Fetching cart requests...');
      
      // First, fetch all fields to get their names
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('fields')
        .select('id, name');
        
      if (fieldsError) throw fieldsError;
      
      // Create a mapping of field IDs to names
      const fieldMap: Record<number, string> = {};
      if (fieldsData) {
        fieldsData.forEach(field => {
          fieldMap[field.id] = field.name;
        });
      }
      
      // Fetch all cart requests (pending and confirmed for current driver)
      const { data, error } = await supabase
        .from('cart_requests')
        .select('*')
        .in('status', ['pending', 'confirmed'])
        .order('created_at', { ascending: false });
  
      if (error) throw error;
      
      // Enhance the cart requests with field names
      const enhancedRequests = data?.map(request => ({
        ...request,
        from_field_name: request.from_field_number ? fieldMap[request.from_field_number] : null,
        to_field_name: request.to_field_number ? fieldMap[request.to_field_number] : null
      })) || [];
      
      // Separate into current rides (confirmed by this driver) and pending rides
      const current = enhancedRequests.filter(request => 
        request.status === 'confirmed' && request.driver === profile.id
      );
      const pending = enhancedRequests.filter(request => 
        request.status === 'pending'
      );
      
      setCurrentRides(current);
      setPendingRides(pending);
      setRequests(enhancedRequests);
      
      console.log(`Loaded ${current.length} current rides, ${pending.length} pending rides`);
    } catch (error) {
      console.error('Error fetching cart requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: number) => {
    try {
      // Optimistic update - move request from pending to current
      const requestToMove = pendingRides.find(request => request.id === requestId);
      if (requestToMove) {
        setPendingRides(prev => prev.filter(request => request.id !== requestId));
        setCurrentRides(prev => [...prev, { ...requestToMove, status: 'confirmed', driver: profile.id }]);
      }

      const { data, error } = await supabase
        .from('cart_requests')
        .update({
          status: 'confirmed' as Database['public']['Enums']['request_status'],
          driver: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending') // Only accept if still pending
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        // Revert optimistic update on error
        fetchRequests();
        throw error;
      }

      if (!data || data.length === 0) {
        // Revert optimistic update if request was already taken
        fetchRequests();
        Alert.alert('Request Unavailable', 'This request has already been accepted by another driver.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    }
  };

  const removeRequest = async (requestId: number) => {
    try {
      // Optimistic update - remove from local state immediately
      setPendingRides(prev => prev.filter(request => request.id !== requestId));
      setCurrentRides(prev => prev.filter(request => request.id !== requestId));
      
      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'expired' as Database['public']['Enums']['request_status'],
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        // Revert optimistic update on error
        fetchRequests();
        throw error;
      }
    } catch (error) {
      console.error('Error removing request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const completeRide = async (requestId: number) => {
    try {
      // Optimistic update - remove from current rides
      setCurrentRides(prev => prev.filter(request => request.id !== requestId));
      
      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'resolved' as Database['public']['Enums']['request_status'],
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) {
        // Revert optimistic update on error
        fetchRequests();
        throw error;
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete the ride. Please try again.');
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
      case 'Lot 1 (Grass)':
        return 'Parking Lot 1 (Grass)';
      case 'Lot 2 (Pavement)':
        return 'Parking Lot 2 (Pavement)';
      default:
        return locationType;
    }
  };

  const navigateToFieldMap = () => {
    router.push('/(tabs)/home/fieldmap');
  };

  // Render function for current rides (confirmed)
  const renderCurrentRide = ({ item }: { item: CartRequest }) => {
    return (
      <Card style={[styles.cardContainer, styles.currentRideCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#73BF44' }]}>
            <CustomText style={styles.statusText}>Confirmed</CustomText>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint} />
            <View style={styles.routeLine} />
            <View style={styles.routePoint} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>From: </CustomText>
              {item.from_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.from_field_name || item.from_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.from_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              {item.to_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.to_field_name || item.to_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.to_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.passengerRow}>
          <CustomText style={styles.passengerLabel}>Passengers:</CustomText>
          <CustomText style={styles.passengerCount}>{item.passenger_count || 0}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Name:</CustomText>
          <CustomText style={styles.infoValue}>{item.requester || 'Anonymous'}</CustomText>
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
          style={styles.completeButton}
          onPress={() => completeRide(item.id)}
        >
          <CustomText style={styles.completeButtonText}>Complete Ride</CustomText>
        </TouchableOpacity>
      </Card>
    );
  };

  // Render function for pending rides
  const renderPendingRide = ({ item }: { item: CartRequest }) => {
    const timeColor = getTimeColor(item.created_at, { recent: 5, moderate: 15 });
    
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View style={styles.timeContainer}>
            <View style={[styles.timeIndicator, { backgroundColor: timeColor }]} />
            <CustomText style={styles.waitingTime}>{getTimeSince(item.created_at)}</CustomText>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint} />
            <View style={styles.routeLine} />
            <View style={styles.routePoint} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>From: </CustomText>
              {item.from_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.from_field_name || item.from_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.from_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              {item.to_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.to_field_name || item.to_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.to_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.passengerRow}>
          <CustomText style={styles.passengerLabel}>Passengers:</CustomText>
          <CustomText style={styles.passengerCount}>{item.passenger_count || 0}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Name:</CustomText>
          <CustomText style={styles.infoValue}>{item.requester || 'Anonymous'}</CustomText>
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

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => acceptRequest(item.id)}
          >
            <CustomText style={styles.acceptButtonText}>Accept</CustomText>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeRequest(item.id)}
          >
            <CustomText style={styles.removeButtonText}>Remove</CustomText>
          </TouchableOpacity>
        </View>
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
      {currentRides.length === 0 && pendingRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No cart requests available</CustomText>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={() => (
            <View>
              {/* Current Rides Section */}
              {currentRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CustomText style={styles.sectionTitle}>Current Rides</CustomText>
                  {currentRides.map((item) => (
                    <View key={item.id}>
                      {renderCurrentRide({ item })}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Pending Rides Section */}
              {pendingRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <TouchableOpacity 
                    style={styles.sectionHeader}
                    onPress={() => setIsPendingCollapsed(!isPendingCollapsed)}
                  >
                    <CustomText style={styles.sectionTitle}>Pending Rides ({pendingRides.length})</CustomText>
                  <Ionicons 
                    name={isPendingCollapsed ? "chevron-down" : "chevron-up"} 
                    size={20} 
                    color="#fff" 
                  />
                  </TouchableOpacity>
                  {!isPendingCollapsed && pendingRides.map((item) => (
                    <View key={item.id}>
                      {renderPendingRide({ item })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
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
    paddingTop: 10,
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
    backgroundColor: '#262626',
    borderWidth: 0,
    marginTop: 15,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66'
  },
  requestIdBadge: {
    backgroundColor: '#EA1D25',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  requestIdText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
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
  linkText: {
    textDecorationLine: 'underline',
    color: '#81afe4ff',
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#73BF44',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  },
  acceptButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  removeButton: {
    backgroundColor: '#EA1D25',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    flex: 1,
    marginLeft: 4,
  },
  removeButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  completeButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  completeButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  currentRideCard: {
    borderColor: '#73BF44',
    borderWidth: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  collapseIcon: {
    ...typography.textLarge,
    color: '#EA1D25',
    fontWeight: 'bold',
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