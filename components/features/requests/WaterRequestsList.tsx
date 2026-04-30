import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useWaterRequestsSubscription } from '@/hooks/realtime/useRequestSubscriptions';
import { supabase } from '@/lib/supabase';
import { ProfileRow, RequestStatus, WaterRequestWithField } from '@/types/requests';
import { getTimeSince } from '@/utils/getTimeSince';

import { MaterialIcons } from '@expo/vector-icons';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

const WaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequestWithField[]>([]);
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
        .from('water_requests')
        .select('*, fields(name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setRequests(data as WaterRequestWithField[]);
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

  useWaterRequestsSubscription(fetchRequests, { onPayload: handleSubscriptionPayload });

  const resolveRequest = async (requestId: number) => {
    try {
      setRequests((current) => current.filter((request) => request.id !== requestId));

      const { data, error } = await supabase
        .from('water_requests')
        .update({
          status: 'resolved' as RequestStatus,
          volunteer: profile?.full_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) {
        fetchRequests(false);
        throw error;
      }

      if (!data) {
        fetchRequests(false);
        Alert.alert('Request Unavailable', 'This request has already been handled by another volunteer.');
      }
    } catch (error) {
      console.error('Error resolving water request:', error);
      fetchRequests(false);
      Alert.alert('Error', 'Failed to resolve the request. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: WaterRequestWithField }) => (
    <Card style={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <CustomText style={styles.waterTitle}>Water</CustomText>
        <CustomText style={styles.headerDate}>{getTimeSince(item.created_at)}</CustomText>
      </View>

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>FIELD</CustomText>
          <Link href="/(tabs)/home/fieldmap" asChild>
            <TouchableOpacity>
              <CustomText style={[styles.infoValue, styles.fieldLink]}>
                {item.fields?.name || `Field ${item.field_number}`}
              </CustomText>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>STATUS</CustomText>
          <CustomText style={[styles.infoValue, styles.statusPending]}>
            {item.status === 'pending' ? 'Pending' : item.status}
          </CustomText>
        </View>
      </View>

      {item.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.resolveButton} onPress={() => resolveRequest(item.id)}>
            <CustomText style={styles.resolveButtonText}>Resolved</CustomText>
            <MaterialIcons name="check" size={14} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );

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
            <CustomText style={styles.emptyText}>No water requests</CustomText>
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
  waterTitle: {
    ...typography.textSemiBold,
    color: '#fff',
    marginRight: 'auto',
  },
  headerDate: {
    ...typography.textMedium,
    color: '#CCCCCC',
  },
  infoSection: {
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
  infoLabel: {
    ...typography.textSmall,
    color: '#CCCCCCB2',
  },
  infoValue: {
    ...typography.textSmallBold,
    color: '#fff',
  },
  fieldLink: {
    color: '#81afe4ff',
    textDecorationLine: 'underline',
  },
  statusPending: {
    color: '#FFD600',
    ...typography.textSmallBold,
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
  resolveButtonText: {
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

export default WaterRequestsList;
