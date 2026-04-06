// components/features/requests/FulfilledWaterRequestList.tsx

import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useWaterRequestsSubscription } from '@/hooks/realtime/useRequestSubscriptions';
import { supabase } from '@/lib/supabase';
import { WaterRequestWithField } from '@/types/requests';

import { useIsFocused } from '@react-navigation/native';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const FulfilledWaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequestWithField[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const isFocused = useIsFocused();

  const fetchFulfilledRequests = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

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
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      fetchFulfilledRequests(true);
    }
  }, [fetchFulfilledRequests, isFocused]);

  const handleSubscriptionPayload = useCallback(
    (payload: RealtimePostgresChangesPayload<{ id: number; status: string | null }>) => {
      const requestId = payload.eventType === 'DELETE' ? payload.old.id : payload.new.id;

      if (!requestId) {
        return true;
      }

      if (payload.eventType === 'DELETE') {
        setRequests((current) => current.filter((request) => request.id !== requestId));
        return false;
      }

      if (payload.new.status !== 'resolved') {
        setRequests((current) => current.filter((request) => request.id !== requestId));
        return false;
      }

      return true;
    },
    [],
  );

  useWaterRequestsSubscription(fetchFulfilledRequests, { onPayload: handleSubscriptionPayload });

  const deleteRequest = async (requestId: number) => {
    try {
      // Simply delete the record since it's already fulfilled
      const { error } = await supabase.from('water_requests').delete().eq('id', requestId);

      if (error) throw error;

      // Update the local state by removing the deleted request
      setRequests((current) => current.filter((request) => request.id !== requestId));
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
            <CustomText style={styles.labelText}>FIELD</CustomText>
            <CustomText style={styles.valueText}>Field {item.field_number}</CustomText>
          </View>

          {item.volunteer && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>VOLUNTEER</CustomText>
              <CustomText style={styles.valueText}>{item.volunteer}</CustomText>
            </View>
          )}
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.deleteButton} onPress={() => deleteRequest(item.id)}>
            <CustomText style={styles.deleteButtonText}>Remove</CustomText>
          </TouchableOpacity>
        </View>
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
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[styles.listContainer, styles.emptyListContainer]}
          refreshing={refreshing}
          onRefresh={() => fetchFulfilledRequests(false)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomText style={styles.emptyText}>No water requests found</CustomText>
            </View>
          }
        />
      ) : (
        <>
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => fetchFulfilledRequests(false)}
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
  cardContainer: {
    backgroundColor: '#262626',
    borderRadius: 8,
    borderWidth: 0,
    marginBottom: 10,
    padding: 0,
  },
  cardHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  waterTitle: {
    ...typography.textSemiBold,
    color: '#fff',
    marginRight: 'auto',
  },
  statusBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  infoSection: {
    borderBottomColor: '#CCCCCC66',
    borderBottomWidth: 1,
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  labelText: {
    ...typography.textSmall,
    color: '#CCCCCCB2',
  },
  valueText: {
    ...typography.textSmallBold,
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderBottomStartRadius: 5,
    borderBottomEndRadius: 5,
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  deleteButtonText: {
    ...typography.textBold,
    color: '#fff',
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
  container: {
    backgroundColor: '#000',
    flex: 1,
  },
  listContainer: {
    padding: 15,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
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
