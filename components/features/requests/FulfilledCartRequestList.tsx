import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

// Define types based on your Supabase schema
type CartRequest = Database['public']['Tables']['cart_requests']['Row'] & {
  driver: {
    full_name: string | null;
  } | null;
  from_field_name?: string | null;
  to_field_name?: string | null;
};
type Profile = Database['public']['Tables']['profiles']['Row'];
type LocationType = Database['public']['Enums']['location_type'];

const FulfilledCartRequestsList = () => {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [pendingRides, setPendingRides] = useState<CartRequest[]>([]);
  const [confirmedRides, setConfirmedRides] = useState<CartRequest[]>([]);
  const [completedRides, setCompletedRides] = useState<CartRequest[]>([]);
  const [expiredRides, setExpiredRides] = useState<CartRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };
  const isFocused = useIsFocused();
  
  // Collapsible section states
  const [pendingCollapsed, setPendingCollapsed] = useState<boolean>(false);
  const [confirmedCollapsed, setConfirmedCollapsed] = useState<boolean>(false);
  const [completedCollapsed, setCompletedCollapsed] = useState<boolean>(false);
  const [expiredCollapsed, setExpiredCollapsed] = useState<boolean>(true); // Default collapsed
  
  const driverName = profile.full_name;

  // Collapsible section header component
  const CollapsibleSectionHeader = ({ 
    title, 
    count, 
    isCollapsed, 
    onToggle 
  }: { 
    title: string; 
    count: number; 
    isCollapsed: boolean; 
    onToggle: () => void; 
  }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <CustomText style={styles.sectionTitle}>{title} ({count})</CustomText>
      <Ionicons 
        name={isCollapsed ? "chevron-down" : "chevron-up"} 
        size={20} 
        color="#fff" 
      />
    </TouchableOpacity>
  );

  useEffect(() => {
    if (isFocused) {
      fetchAllRequests();
    }
  }, [isFocused]);

  useEffect(() => {
    fetchAllRequests();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('fulfilled_requests_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_requests'
        },
        (payload) => {
          console.log('Fulfilled requests real-time update:', payload);
          fetchAllRequests();
        }
      )
      .subscribe((status) => {
        console.log('Fulfilled requests subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from fulfilled_requests_channel');
      subscription.unsubscribe();
    };
  }, [profile?.id]); // Add profile dependency to avoid stale closures

  const fetchAllRequests = async () => {
    try {
      console.log('Fetching all cart requests...');
      
      // Get field information for displaying names
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
      
      // Get all cart requests regardless of status
      const { data, error } = await supabase
        .from('cart_requests')
        .select('*, driver:profiles!cart_requests_driver_fkey(full_name)')
        .in('status', ['pending', 'confirmed', 'resolved', 'expired'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Enhance the requests with field names
      const enhancedRequests = data.map(request => ({
        ...request,
        from_field_name: request.from_field_number ? fieldMap[request.from_field_number] : null,
        to_field_name: request.to_field_number ? fieldMap[request.to_field_number] : null
      }));
      
      // Categorize requests by status
      const pending = enhancedRequests.filter(request => request.status === 'pending');
      const confirmed = enhancedRequests.filter(request => request.status === 'confirmed');
      const completed = enhancedRequests.filter(request => request.status === 'resolved');
      const expired = enhancedRequests.filter(request => request.status === 'expired');
      
      setPendingRides(pending);
      setConfirmedRides(confirmed);
      setCompletedRides(completed);
      setExpiredRides(expired);
      setRequests(enhancedRequests);
      
      console.log(`All Rides - Pending: ${pending.length}, Confirmed: ${confirmed.length}, Completed: ${completed.length}, Expired: ${expired.length}`);
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error);
    } finally {
      setLoading(false);
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
        return 'Tourney Central';
      case 'Lot 1 (Grass)':
        return 'Lot 1 (Grass)';
      case 'Lot 2 (Pavement)':
        return 'Lot 2 (Pavement)';
      default:
        return locationType;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Pending',
          color: '#FFD600' // Yellow for pending
        };
      case 'confirmed':
        return {
          text: 'Confirmed',
          color: '#2196F3' // Blue for confirmed
        };
      case 'resolved':
        return {
          text: 'Completed',
          color: '#6EDF28' // Green for completed
        };
      case 'expired':
        return {
          text: 'Expired',
          color: '#EA1D25' // Red for expired
        };
      default:
        return {
          text: 'Unknown',
          color: '#666666' // Gray for unknown
        };
    }
  };

  const deleteRequest = async (requestId: number) => {
    try {
      // We'll just update the status to 'archived' to keep the record but hide it from the list
      const { error } = await supabase
        .from('cart_requests')
        .update({ status: 'expired' as Database['public']['Enums']['request_status'] })
        .eq('id', requestId);

      if (error) throw error;
      
      // Update the local state by removing the archived request
      setRequests(requests.filter(req => req.id !== requestId));
      
    } catch (error) {
      console.error('Error removing request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: CartRequest }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusBadge.color, borderWidth: 1, backgroundColor: `${statusBadge.color}3D` }]}>
            <CustomText style={styles.statusText}>{statusBadge.text}</CustomText>
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
              <CustomText style={styles.routeLabel}>From: </CustomText>
              <CustomText style={styles.locationText}>
                {item.from_location === 'Field' 
                  ? `Field ${item.from_field_name || item.from_field_number}` 
                  : getLocationLabel(item.from_location)}
              </CustomText>
            </View>
            
            {/* To section */}
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              <CustomText style={styles.locationText}>
                {item.to_location === 'Field' 
                  ? `Field ${item.to_field_name || item.to_field_number}`
                  : getLocationLabel(item.to_location)}
              </CustomText>
            </View>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Passengers:</CustomText>
            <CustomText style={styles.valueText}>{item.passenger_count || 0}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Name:</CustomText>
            <CustomText style={styles.valueText}>{item.requester || 'Anonymous'}</CustomText>
          </View>
          {item.status !== 'pending' && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>Driver:</CustomText>
              <CustomText style={styles.driverText}>{item.driver ? item.driver.full_name : driverName}</CustomText>
            </View>
          )}
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>
              {item.status === 'pending' ? 'Created:' : 'Completed:'}
            </CustomText>
            <CustomText style={styles.valueText}>
              {item.status === 'pending' ? formatDate(item.created_at) : formatDate(item.updated_at)}
            </CustomText>
          </View>
        </View>

        {item.special_request && (
          <View style={styles.specialRequestContainer}>
            <CustomText style={styles.specialRequestLabel}>Special Request:</CustomText>
            <CustomText style={styles.specialRequestText}>{item.special_request}</CustomText>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRequest(item.id)}
        >
          <CustomText style={styles.deleteButtonText}>Remove</CustomText>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <CustomText style={styles.loadingText}>Loading fulfilled requests...</CustomText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No transport requests found</CustomText>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={() => (
            <View>
              {/* Pending Rides Section */}
              {pendingRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Pending Rides"
                    count={pendingRides.length}
                    isCollapsed={pendingCollapsed}
                    onToggle={() => setPendingCollapsed(!pendingCollapsed)}
                  />
                  {!pendingCollapsed && pendingRides.map((item) => (
                    <View key={item.id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Confirmed Rides Section */}
              {confirmedRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Ongoing Rides"
                    count={confirmedRides.length}
                    isCollapsed={confirmedCollapsed}
                    onToggle={() => setConfirmedCollapsed(!confirmedCollapsed)}
                  />
                  {!confirmedCollapsed && confirmedRides.map((item) => (
                    <View key={item.id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Completed Rides Section */}
              {completedRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Completed Rides"
                    count={completedRides.length}
                    isCollapsed={completedCollapsed}
                    onToggle={() => setCompletedCollapsed(!completedCollapsed)}
                  />
                  {!completedCollapsed && completedRides.map((item) => (
                    <View key={item.id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}
              
              {/* Expired Rides Section */}
              {expiredRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Archived"
                    count={expiredRides.length}
                    isCollapsed={expiredCollapsed}
                    onToggle={() => setExpiredCollapsed(!expiredCollapsed)}
                  />
                  {!expiredCollapsed && expiredRides.map((item) => (
                    <View key={item.id}>
                      {renderItem({ item })}
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
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
  // Card styles
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 3,
    paddingBottom: 15
  },
  cardContainer: {
    borderRadius: 12,
    padding: 10,
    marginTop: 15,
    backgroundColor: '#262626',
    borderWidth: 0
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66',
    justifyContent: 'space-between'
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
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    ...typography.text,
    color: '#fff'
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
  infoSection: {
    gap: 8,
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC66',
    paddingBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    ...typography.text,
    color: '#CCCCCC80',
  },
  valueText: {
    ...typography.textSemiBold,
    color: '#CCCCCCBF',
  },
  driverText: {
    ...typography.textBold,
    color: '#fff',
  },
  specialRequestContainer: {
    borderWidth: 1,
    borderLeftWidth: 3,
    borderColor: '#EA1D25',
    borderRadius: 5,
    padding: 7,
    marginVertical: 8
  },
  specialRequestLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  specialRequestText: {
    ...typography.textMedium,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#EA1D25',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 5
  },
  deleteButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    borderRadius: 8,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
});

export default FulfilledCartRequestsList;