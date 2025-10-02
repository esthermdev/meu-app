// components/features/requests/FulfilledWaterRequestList.tsx

import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import { getTimeSince } from '@/utils/getTimeSince';
import { getTimeColor } from '@/utils/getTimeColor';

// Define types based on your Supabase schema
type WaterRequest = Database['public']['Tables']['water_requests']['Row'];

const FulfilledWaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchFulfilledRequests();
    }
  }, [isFocused]);

  useEffect(() => {
    fetchFulfilledRequests();
    const subscription = supabase
      .channel('water_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_requests' }, fetchFulfilledRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFulfilledRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('water_requests')
        .select('*, fields(name, location)')
        .eq('status', 'resolved') // Get requests that are resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as unknown as WaterRequest[]);
    } catch (error) {
      console.error('Error fetching fulfilled water requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: number) => {
    try {
      // Simply delete the record since it's already fulfilled
      const { error } = await supabase
        .from('water_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Update the local state by removing the deleted request
      setRequests(requests.filter(req => req.id !== requestId));

    } catch (error) {
      console.error('Error removing water request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const clearAllRequests = async () => {
    Alert.alert(
      'Clear All Requests',
      'Are you sure you want to remove all fulfilled water requests?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get all request IDs
              const requestIds = requests.map(req => req.id);

              // Delete all fulfilled requests
              const { error } = await supabase
                .from('water_requests')
                .delete()
                .eq('status', 'resolved');

              if (error) throw error;

              // Clear the local state
              setRequests([]);

            } catch (error) {
              console.error('Error clearing all water requests:', error);
              Alert.alert('Error', 'Failed to clear all requests. Please try again.');
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: WaterRequest }) => {
    
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.waterTitle}>Water</CustomText>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#6EDF283D', borderColor: '#6EDF28', borderWidth: 1 }]}>
            <CustomText style={styles.statusText}>Resolved</CustomText>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Field:</CustomText>
            <CustomText style={styles.valueText}>Field {item.field_number}</CustomText>
          </View>
          
          {item.volunteer && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>Volunteer:</CustomText>
              <CustomText style={styles.valueText}>{item.volunteer}</CustomText>
            </View>
          )}
        </View>
        
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
        <CustomText style={styles.loadingText}>Loading fulfilled water requests...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No fulfilled water requests found</CustomText>
        </View>
      ) : (
        <>
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={loading}
            onRefresh={fetchFulfilledRequests}
          />
          <View style={styles.clearAllContainer}>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearAllRequests}
            >
              <CustomText style={styles.clearAllButtonText}>Clear All</CustomText>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  waterTitle: {
    ...typography.textLargeBold,
    color: '#fff',
    marginRight: 'auto'
  },
  requestIdBadge: {
    marginRight: 5,
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
  timeText: {
    ...typography.textSemiBold,
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
  clearAllContainer: {
    paddingHorizontal: 15,
    paddingBottom: 35,
    paddingVertical: 20,
    marginBottom: 0,
    backgroundColor: '#242424',
    alignItems: 'center'
  },
  clearAllButton: {
    backgroundColor: '#ea8e1dff',
    paddingVertical: 12,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
  },
  clearAllButtonText: {
    ...typography.textBold,
    color: '#fff',
    fontSize: 16,
  },
});

export default FulfilledWaterRequestsList;