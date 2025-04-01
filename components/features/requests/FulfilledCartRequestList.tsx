import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

// Define types based on your Supabase schema
type CartRequest = Database['public']['Tables']['cart_requests']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type LocationType = Database['public']['Enums']['location_type'];

const FulfilledCartRequestsList = () => {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };
  
  const driverName = profile.full_name;

  useEffect(() => {
    fetchFulfilledRequests();
    const subscription = supabase
      .channel('cart_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cart_requests' }, fetchFulfilledRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFulfilledRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_requests')
        .select('*, driver')
        .in('status', ['confirmed']) // Get requests that are confirmed or completed // Only show requests for the current driver
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as unknown as CartRequest[]);
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
      case 'Lot 1':
        return 'Parking Lot 1';
      case 'Lot 2':
        return 'Parking Lot 2';
      default:
        return locationType;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'completed') {
      return {
        text: 'Completed',
        color: '#6EDF28' // Green for completed
      };
    } else {
      return {
        text: 'Confirmed',
        color: '#6EDF28' // Cyan for confirmed
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
          <CustomText style={styles.transportTitle}>Transport</CustomText>
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
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Passengers:</CustomText>
            <CustomText style={styles.valueText}>{item.passenger_count || 0}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Driver:</CustomText>
            <CustomText style={styles.driverText}>{driverName}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Request ID:</CustomText>
            <CustomText style={styles.valueText}>{item.id}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Created:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.created_at)}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Completed:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.updated_at)}</CustomText>
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
          <CustomText style={styles.emptyText}>No fulfilled transport requests found</CustomText>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchFulfilledRequests}
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
    marginVertical: 12,
    backgroundColor: '#262626',
    borderWidth: 0
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66'
  },
  transportTitle: {
    ...typography.textLargeBold,
    color: '#fff',
    marginRight: 'auto'
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
});

export default FulfilledCartRequestsList;