import { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Card } from '@/components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import { useTrainerRequestsSubscription } from '@/hooks/subscriptions/useRequestsSubscriptions';

// Define types based on your Supabase schema
type MedicalRequest = Database['public']['Tables']['medical_requests']['Row'] & {
  trainer: {
    full_name: string | null;
  } | null;
  fields: {
    name: string;
  } | null;
};

const FulfilledTrainerRequestList = () => {
  const [requests, setRequests] = useState<MedicalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchFulfilledRequests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*, trainer:profiles(full_name), fields:fields(name)')
        .in('status', ['confirmed', 'resolved']) // Get requests that are confirmed or resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as MedicalRequest[]);
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
          status: 'expired' as Database['public']['Enums']['request_status'],
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
    Alert.alert(
      'Clear All Requests',
      'Are you sure you want to remove all fulfilled trainer requests?',
      [
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
                  status: 'expired' as Database['public']['Enums']['request_status'],
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
      ],
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  const getStatusBadge = (status: string | null) => {
    if (status === 'resolved') {
      return {
        text: 'Resolved',
        color: '#73BF44', // Green for resolved
      };
    } else {
      return {
        text: 'Confirmed',
        color: '#28D4C0', // Cyan for confirmed
      };
    }
  };

  const renderItem = ({ item }: { item: MedicalRequest }) => {
    const statusBadge = getStatusBadge(item.status);

    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, getPriorityColor(item.priority_level)]}>
            <CustomText style={styles.priorityText}>{item.priority_level || 'Medium'}</CustomText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: statusBadge.color,
                borderWidth: 1,
                backgroundColor: '#73BF443D',
              },
            ]}>
            <CustomText style={styles.statusText}>{statusBadge.text}</CustomText>
          </View>
          <View style={styles.fieldBadge}>
            <MaterialIcons name="location-on" size={14} color="#262626" />
            <CustomText style={styles.fieldText}>
              Field {item.fields?.name || `Field ${item.field_number}`}
            </CustomText>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Request ID: </CustomText>
            <CustomText style={styles.valueText}>{item.id}</CustomText>
          </View>
          {item.team_name && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>Team:</CustomText>
              <CustomText style={styles.valueText}>{item.team_name}</CustomText>
            </View>
          )}
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Trainer:</CustomText>
            <CustomText style={styles.trainerNameText}>
              {item.trainer ? item.trainer.full_name : 'Unassigned'}
            </CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Created:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.created_at)}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Updated:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.updated_at)}</CustomText>
          </View>
        </View>

        {item.description_of_emergency && (
          <View style={styles.descriptionContainer}>
            <CustomText style={styles.descriptionLabel}>Emergency Description:</CustomText>
            <CustomText style={styles.descriptionText}>{item.description_of_emergency}</CustomText>
          </View>
        )}

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
    marginTop: 12,
    padding: 10,
  },
  cardHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66',
    flexDirection: 'row',
    paddingBottom: 8,
  },
  priorityBadge: {
    borderRadius: 20,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  priorityText: {
    color: '#fff',
    ...typography.text,
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
  trainerNameText: {
    ...typography.textBold,
    color: '#fff',
  },
  valueText: {
    ...typography.textMedium,
    color: '#CCCCCCBF',
  },
  descriptionContainer: {
    backgroundColor: '#262626',
    borderColor: '#EA1D25',
    borderLeftColor: '#EA1D25',
    borderLeftWidth: 4,
    borderRadius: 5,
    borderWidth: 0.5,
    marginBottom: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  descriptionLabel: {
    ...typography.text,
    color: '#CCCCCC80',
  },
  descriptionText: {
    ...typography.textMedium,
    color: '#fff',
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
  deleteButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
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

export default FulfilledTrainerRequestList;
