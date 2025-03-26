import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@rneui/themed';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';

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
        return 'Tournament HQ';
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
        color: '#73BF44' // Green for completed
      };
    } else {
      return {
        text: 'Confirmed',
        color: '#28D4C0' // Cyan for confirmed
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
      <Card containerStyle={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <Text style={styles.transportTitle}>Transport</Text>
          <View style={[styles.statusBadge, { borderColor: statusBadge.color, borderWidth: 1, backgroundColor: `${statusBadge.color}3D` }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
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
              <Text style={styles.routeLabel}>From:</Text>
              <Text style={styles.locationText}>
                {item.from_location === 'Field' ? 'Field ' : ''}
                {item.from_location === 'Field' ? item.from_field_number : getLocationLabel(item.from_location)}
              </Text>
            </View>
            
            {/* To section */}
            <View style={styles.locationInfo}>
              <Text style={styles.routeLabel}>To:</Text>
              <Text style={styles.locationText}>
                {item.to_location === 'Field' ? 'Field ' : ''}
                {item.to_location === 'Field' ? item.to_field_number : getLocationLabel(item.to_location)}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Request ID:</Text>
            <Text style={styles.valueText}>{item.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Driver:</Text>
            <Text style={styles.driverText}>{driverName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Passengers:</Text>
            <Text style={styles.valueText}>{item.passenger_count || 0}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Created:</Text>
            <Text style={styles.valueText}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Completed:</Text>
            <Text style={styles.valueText}>{formatDate(item.updated_at)}</Text>
          </View>
        </View>

        {item.special_request && (
          <View style={styles.specialRequestContainer}>
            <Text style={styles.specialRequestLabel}>Special Request:</Text>
            <Text style={styles.specialRequestText}>{item.special_request}</Text>
          </View>
        )}
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRequest(item.id)}
        >
          <Text style={styles.deleteButtonText}>Remove</Text>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <Text style={styles.loadingText}>Loading fulfilled requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No fulfilled transport requests found</Text>
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
    ...typography.bodyMedium,
    color: '#B0B0B0',
  },
  loadingText: {
    ...typography.bodyBold,
    color: '#fff'
  },
  // Card styles
  listContainer: {
    paddingVertical: 3,
  },
  cardContainer: {
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 20,
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
    ...typography.bodyMediumBold,
    color: '#fff',
    marginRight: 'auto'
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    ...typography.body,
    color: '#fff'
  },
  locationsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC66',
    paddingVertical: 5
  },
  routeVisualization: {
    alignItems: 'center',
    paddingHorizontal: 8,
    height: '80%',
    marginVertical: 'auto'
  },
  routeInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  locationInfo: {
    marginVertical: 8
  },
  routeLabel: {
    ...typography.bodyMediumRegular,
    color: '#CCCCCC',
  },
  locationText: {
    ...typography.bodyMediumBold,
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
    ...typography.bodyMediumRegular,
    color: '#CCCCCC80',
  },
  valueText: {
    ...typography.bodyMedium,
    color: '#CCCCCCBF',
  },
  driverText: {
    ...typography.bodyMedium,
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
    ...typography.body,
    color: '#CCCCCCB2',
  },
  specialRequestText: {
    ...typography.bodyMediumRegular,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#EA1D25',
    paddingVertical: 5,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 5
  },
  deleteButtonText: {
    ...typography.bodyMediumBold,
    color: '#fff',
  },
});

export default FulfilledCartRequestsList;