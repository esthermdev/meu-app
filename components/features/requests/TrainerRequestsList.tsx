// components/medical/RequestsList.tsx
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useTrainerRequestsSubscription } from '@/hooks/realtime/useRequestSubscriptions';
import { supabase } from '@/lib/supabase';
import { MedicalRequestWithRelations, ProfileRow, RequestStatus } from '@/types/requests';
import { getTimeSince } from '@/utils/getTimeSince';

import { MaterialIcons } from '@expo/vector-icons';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const TrainerRequestsList = () => {
  const [requests, setRequests] = useState<MedicalRequestWithRelations[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { profile } = useAuth() as { profile: ProfileRow };

  const fetchRequests = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const { data, error } = await supabase
        .from('medical_requests')
        .select('*, trainer:profiles(full_name), fields:fields(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as MedicalRequestWithRelations[]);
      console.log(`Loaded ${data?.length || 0} trainer requests`);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

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

      if (payload.new.status !== 'pending') {
        setRequests((current) => current.filter((request) => request.id !== requestId));
        return false;
      }

      return true;
    },
    [],
  );

  useTrainerRequestsSubscription(fetchRequests, { onPayload: handleSubscriptionPayload });

  const resolveRequest = async (requestId: number) => {
    try {
      // Optimistic update - remove from local state immediately
      setRequests((prev) => prev.filter((request) => request.id !== requestId));

      const { data, error } = await supabase
        .from('medical_requests')
        .update({
          status: 'resolved' as RequestStatus,
          assigned_to: profile.id,
          trainer: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        // Revert optimistic update on error
        fetchRequests(false);
        throw error;
      }

      if (!data) {
        // Revert optimistic update if request was already taken
        fetchRequests(false);
        Alert.alert('Request Unavailable', 'This request has already been handled by another trainer.');
      }
    } catch (error) {
      console.error('Error resolving request:', error);
      Alert.alert('Error', 'Failed to resolve the request. Please try again.');
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

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return { backgroundColor: '#ED8C22' }; // Default orange for medium

    switch (priority.toLowerCase()) {
      case 'high':
        return {
          backgroundColor: '#EA1D253D',
          borderColor: '#EA1D25',
          borderWidth: 1,
        }; // Red for high priority
      case 'medium':
        return {
          backgroundColor: '#ED8C223D',
          borderColor: '#ED8C22',
          borderWidth: 1,
        }; // Orange for medium priority
      case 'low':
        return {
          backgroundColor: '#0080003D',
          borderColor: '#008000',
          borderWidth: 1,
        }; // Green for low priority
      default:
        return { backgroundColor: '#FFA500' }; // Orange as default
    }
  };

  const renderItem = ({ item }: { item: MedicalRequestWithRelations }) => {
    const timeColor = getTimeColor(item.created_at);

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
              <CustomText style={styles.labelText}>WAITING</CustomText>
              <View style={styles.timeContainer}>
                <View style={[styles.timeIndicator, { backgroundColor: timeColor }]} />
                <CustomText style={styles.timeText}>{getTimeSince(item.created_at)}</CustomText>
              </View>
            </View>
          </View>
        </View>

        {item.description_of_emergency && (
          <View style={styles.descriptionContainer}>
            <CustomText style={styles.descriptionLabel}>Description of Emergency:</CustomText>
            <CustomText style={styles.descriptionText}>{item.description_of_emergency}</CustomText>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.resolveButton} onPress={() => resolveRequest(item.id)}>
            <CustomText style={styles.buttonText}>Resolved</CustomText>
            <MaterialIcons name="check" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <CustomText style={styles.loadingText}>Loading requests...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={requests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={
          requests.length === 0 ? [styles.listContainer, styles.emptyListContainer] : styles.listContainer
        }
        refreshing={refreshing}
        onRefresh={() => fetchRequests(false)}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <CustomText style={styles.emptyText}>No pending requests</CustomText>
          </View>
        }
      />
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
  },
  trainerInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsInfo: {
    flex: 1,
  },
  detailsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    ...typography.textSmall,
    color: '#CCCCCCB2',
  },
  valueText: {
    ...typography.textSemiBold,
    color: '#fff',
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
    ...typography.textMedium,
    color: '#CCCCCC',
  },
  trainerNameText: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  descriptionContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#CCCCCC66',
  },
  descriptionLabel: {
    ...typography.text,
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
  resolveButton: {
    alignItems: 'center',
    backgroundColor: '#73BF44',
    borderBottomStartRadius: 5,
    borderBottomEndRadius: 5,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonText: {
    ...typography.textBold,
    color: '#fff',
    marginRight: 5,
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
});

export default TrainerRequestsList;
