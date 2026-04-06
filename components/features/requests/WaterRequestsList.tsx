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
      <View style={styles.headerContainer}>
        <CustomText style={styles.headerTitle}>Water</CustomText>
        <CustomText style={styles.headerDate}>{getTimeSince(item.created_at)}</CustomText>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoSection}>
        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Field:</CustomText>
          <Link href="/(tabs)/home/fieldmap" asChild>
            <TouchableOpacity>
              <CustomText style={[styles.infoValue, styles.fieldLink]}>
                {item.fields?.name || `Field ${item.field_number}`}
              </CustomText>
            </TouchableOpacity>
          </Link>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Status:</CustomText>
          <CustomText style={[styles.infoValue, styles.statusPending]}>
            {item.status === 'pending' ? 'Pending' : item.status}
          </CustomText>
        </View>
      </View>

      {item.status === 'pending' && (
        <TouchableOpacity style={styles.resolveButton} onPress={() => resolveRequest(item.id)}>
          <CustomText style={styles.resolveButtonText}>Resolved</CustomText>
          <MaterialIcons name="check" size={14} color="white" />
        </TouchableOpacity>
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
    borderRadius: 12,
    borderWidth: 0,
    padding: 10,
    marginBottom: 10,
  },
  headerContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitle: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  headerDate: {
    ...typography.textMedium,
    color: '#aaa',
  },
  divider: {
    backgroundColor: '#444',
    height: 1,
    marginVertical: 5,
  },
  infoSection: {
    borderBottomColor: '#CCCCCC66',
    borderBottomWidth: 1,
    gap: 5,
    paddingBottom: 5,
  },
  infoRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoLabel: {
    ...typography.text,
    color: '#CCCCCC',
  },
  infoValue: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  fieldLink: {
    color: '#4A9EFF',
    textDecorationLine: 'underline',
  },
  statusPending: {
    color: '#FFD600',
    ...typography.textSemiBold,
  },
  resolveButton: {
    alignItems: 'center',
    backgroundColor: '#73BF44',
    borderRadius: 5,
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
