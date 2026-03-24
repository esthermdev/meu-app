// components/features/requests/FulfilledWaterRequestList.tsx

import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useWaterRequestsSubscription } from '@/hooks/realtime/useRequestSubscriptions';
import { supabase } from '@/lib/supabase';
import { WaterRequestWithField } from '@/types/requests';

import { useIsFocused } from '@react-navigation/native';

const FulfilledWaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequestWithField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchFulfilledRequests();
    }
  }, [isFocused]);

  const fetchFulfilledRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('water_requests')
        .select('*, fields(name, location)')
        .eq('status', 'resolved') // Get requests that are resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as unknown as WaterRequestWithField[]);
    } catch (error) {
      console.error('Error fetching fulfilled water requests:', error);
    } finally {
      setLoading(false);
    }
  };

  // Set up real-time subscription
  useWaterRequestsSubscription(fetchFulfilledRequests);

  const deleteRequest = async (requestId: number) => {
    try {
      // Simply delete the record since it's already fulfilled
      const { error } = await supabase.from('water_requests').delete().eq('id', requestId);

      if (error) throw error;

      // Update the local state by removing the deleted request
      setRequests(requests.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error('Error removing water request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const clearAllRequests = async () => {
    Alert.alert('Clear All Requests', 'Are you sure you want to remove all fulfilled water requests?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            // Delete all fulfilled requests
            const { error } = await supabase.from('water_requests').delete().eq('status', 'resolved');

            if (error) throw error;

            // Clear the local state
            setRequests([]);
          } catch (error) {
            console.error('Error clearing all water requests:', error);
            Alert.alert('Error', 'Failed to clear all requests. Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: WaterRequestWithField }) => {
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.waterTitle}>Water</CustomText>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: '#6EDF283D',
                borderColor: '#6EDF28',
                borderWidth: 1,
              },
            ]}>
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

        <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRequest(item.id)}>
          <CustomText style={styles.deleteButtonText}>Remove</CustomText>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <CustomText style={styles.loadingText}>Loading all water requests...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No water requests found</CustomText>
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
            <TouchableOpacity style={styles.clearAllButton} onPress={clearAllRequests}>
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
    backgroundColor: '#000',
    flex: 1,
  },
  // Loading and empty
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
  emptyText: {
    ...typography.textMedium,
    color: '#B0B0B0',
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.textBold,
    color: '#fff',
  },
  // Card styles
  listContainer: {
    paddingBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 3,
  },
  cardContainer: {
    backgroundColor: '#262626',
    borderRadius: 12,
    borderWidth: 0,
    marginVertical: 12,
    padding: 10,
  },
  cardHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66',
    flexDirection: 'row',
    paddingBottom: 8,
  },
  waterTitle: {
    ...typography.textLargeBold,
    color: '#fff',
    marginRight: 'auto',
  },
  requestIdBadge: {
    backgroundColor: '#EA1D25',
    borderRadius: 12,
    marginRight: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  requestIdText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    ...typography.text,
    color: '#fff',
  },
  infoSection: {
    borderBottomColor: '#CCCCCC66',
    borderBottomWidth: 1,
    gap: 8,
    marginVertical: 8,
    paddingBottom: 8,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    alignItems: 'center',
    flexDirection: 'row',
  },
  timeIndicator: {
    borderRadius: 4,
    height: 8,
    marginRight: 5,
    width: 8,
  },
  timeText: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 5,
    marginTop: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  deleteButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  clearAllContainer: {
    alignItems: 'center',
    backgroundColor: '#242424',
    marginBottom: 0,
    paddingBottom: 35,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  clearAllButton: {
    alignItems: 'center',
    backgroundColor: '#ea8e1dff',
    borderRadius: 8,
    paddingVertical: 12,
    width: 200,
  },
  clearAllButtonText: {
    ...typography.textBold,
    color: '#fff',
    fontSize: 16,
  },
});

export default FulfilledWaterRequestsList;
