import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useTrainerRequestsSubscription } from '@/hooks/realtime/useRequestSubscriptions';
import { supabase } from '@/lib/supabase';
import { MedicalRequestWithRelations, RequestStatus } from '@/types/requests';

import { MaterialIcons } from '@expo/vector-icons';

const FulfilledTrainerRequestList = () => {
  const [requests, setRequests] = useState<MedicalRequestWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFulfilledRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*, trainer:profiles(full_name), fields:fields(name)')
        .in('status', ['confirmed', 'resolved']) // Get requests that are confirmed or resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as MedicalRequestWithRelations[]);
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchFulfilledRequests();
  }, [fetchFulfilledRequests]);

  // Set up real-time subscription
  useTrainerRequestsSubscription(fetchFulfilledRequests);

  const deleteRequest = async (requestId: number) => {
    try {
      // Optimistic update - remove from local state immediately
      setRequests((prev) => prev.filter((req) => req.id !== requestId));

      const { error } = await supabase
        .from('medical_requests')
        .update({
          status: 'expired' as RequestStatus,
        })
        .eq('id', requestId);

      if (error) {
        // Revert optimistic update on error
        fetchFulfilledRequests();
        throw error;
      }
    } catch (error) {
      console.error('Error removing request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const clearAllRequests = async () => {
    Alert.alert('Clear All Requests', 'Are you sure you want to remove all fulfilled trainer requests?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            // Update all confirmed and resolved requests to expired
            const { error } = await supabase
              .from('medical_requests')
              .update({
                status: 'expired' as RequestStatus,
              })
              .in('status', ['confirmed', 'resolved']);

            if (error) throw error;

            // Clear the local state
            setRequests([]);
          } catch (error) {
            console.error('Error clearing all trainer requests:', error);
            Alert.alert('Error', 'Failed to clear all requests. Please try again.');
          }
        },
      },
    ]);
  };

  const formatDateMilitary = (dateString: string | null) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);
    const month = date.toLocaleString('en-US', { month: 'short' }).toUpperCase();
    const day = String(date.getDate()).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${month} ${day}, ${year} - ${hours}:${minutes}`;
  };

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return { backgroundColor: '#ED8C22' }; // Default orange for medium

    switch (priority.toLowerCase()) {
      case 'high':
        return {
          backgroundColor: '#EA1D253D',
          borderColor: '#EA1D25',
          borderWidth: 1,
          opacity: 0.3,
        }; // Red for high priority
      case 'medium':
        return {
          backgroundColor: '#ED8C223D',
          borderColor: '#ED8C22',
          borderWidth: 1,
          opacity: 0.3,
        }; // Orange for medium priority
      case 'low':
        return {
          backgroundColor: '#0080003D',
          borderColor: '#008000',
          borderWidth: 1,
          opacity: 0.3,
        }; // Green for low priority
      default:
        return { backgroundColor: '#FFA500' }; // Orange as default
    }
  };

  const renderItem = ({ item }: { item: MedicalRequestWithRelations }) => {
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.headerBadgesContainer}>
            <View style={styles.requestIdBadge}>
              <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
            </View>
            <View style={[styles.priorityBadge, getPriorityColor(item.priority_level)]}>
              <CustomText style={styles.priorityText}>{item.priority_level || 'Medium'}</CustomText>
            </View>
          </View>
          <View style={styles.fieldBadge}>
            <MaterialIcons name="location-on" size={14} color="#262626" />
            <CustomText style={styles.fieldText}>Field {item.fields?.name || `Field ${item.field_number}`}</CustomText>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.trainerInfo}>
            <CustomText style={styles.labelText}>TRAINER</CustomText>
            <CustomText style={styles.trainerNameText}>
              {item.trainer ? item.trainer.full_name : 'Unassigned'}
            </CustomText>
          </View>
          <View style={styles.detailsInfo}>
            {item.team_name && (
              <View style={styles.detailsRow}>
                <CustomText style={styles.labelText}>TEAM</CustomText>
                <CustomText style={styles.valueText}>{item.team_name}</CustomText>
              </View>
            )}
            <View style={styles.detailsRow}>
              <CustomText style={styles.labelText}>UPDATED</CustomText>
              <CustomText style={styles.valueText}>{formatDateMilitary(item.updated_at)}</CustomText>
            </View>
          </View>
        </View>

        {item.description_of_emergency && (
          <View style={styles.descriptionContainer}>
            <CustomText style={styles.descriptionLabel}>Emergency Description:</CustomText>
            <CustomText style={styles.descriptionText}>{item.description_of_emergency}</CustomText>
          </View>
        )}

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
        <CustomText style={styles.loadingText}>Loading all trainer requests...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No trainer requests found</CustomText>
        </View>
      ) : (
        <>
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
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
  headerBadgesContainer: {
    flexDirection: 'row',
    gap: 5,
  },
  requestIdBadge: {
    backgroundColor: 'rgba(145,145,255,0.38)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#919191',
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  requestIdText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  priorityBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  priorityText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
  },
  fieldBadge: {
    alignItems: 'center',
    backgroundColor: '#DDCF9B',
    borderRadius: 3,
    flexDirection: 'row',
    paddingLeft: 2,
    paddingRight: 3,
    paddingVertical: 2,
  },
  fieldText: {
    color: '#262626',
    ...typography.textBold,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    gap: 5,
  },
  trainerInfo: {
    flex: 1,
  },
  detailsInfo: {
    flex: 2,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 5,
  },
  labelText: {
    flex: 0.8,
    ...typography.textSmall,
    color: '#CCCCCCB2',
  },
  valueText: {
    flex: 2,
    alignSelf: 'flex-start',
    ...typography.textSmallBold,
    color: '#fff',
  },
  trainerNameText: {
    ...typography.textSmallBold,
    color: '#fff',
  },
  descriptionContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC66',
  },
  descriptionLabel: {
    ...typography.textSmall,
    color: '#CCCCCCB2',
  },
  descriptionText: {
    ...typography.textMedium,
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
    flexDirection: 'row',
    justifyContent: 'center',
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
  listContainer: {
    paddingBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 3,
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
  statusBadge: {
    borderRadius: 20,
    marginLeft: 5,
    marginRight: 'auto',
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  statusText: {
    ...typography.text,
    color: '#fff',
  },
});

export default FulfilledTrainerRequestList;
