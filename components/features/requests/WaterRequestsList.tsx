import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import { getTimeSince } from '@/utils/getTimeSince';

type WaterRequests = Database['public']['Tables']['water_requests']['Row'] & {
  fields?: {
    name: string;
    location?: string;
  };
};

type Volunteer = Database['public']['Tables']['profiles']['Row'];

const WaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequests[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { profile } = useAuth() as { profile: Volunteer };
  const realtimeRefreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      setRequests(data as WaterRequests[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const scheduleRealtimeRefresh = useCallback(() => {
    if (realtimeRefreshTimeoutRef.current) {
      clearTimeout(realtimeRefreshTimeoutRef.current);
    }

    realtimeRefreshTimeoutRef.current = setTimeout(() => {
      fetchRequests(false);
    }, 250);
  }, [fetchRequests]);

  useEffect(() => {
    fetchRequests(true);

    const subscription = supabase
      .channel('water_requests_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'water_requests' },
        scheduleRealtimeRefresh,
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      if (realtimeRefreshTimeoutRef.current) {
        clearTimeout(realtimeRefreshTimeoutRef.current);
      }
    };
  }, [fetchRequests, scheduleRealtimeRefresh]);

  const handleResolveRequest = async (requestId: number) => {
    try {
      const { error } = await supabase
        .from('water_requests')
        .update({
          status: 'resolved' as Database['public']['Enums']['request_status'],
          volunteer: profile?.full_name || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      setRequests((current) => current.filter((request) => request.id !== requestId));
    } catch (error) {
      console.error('Error resolving water request:', error);
    }
  };

  const renderItem = ({ item }: { item: WaterRequests }) => (
    <Card style={styles.cardContainer}>
      <View style={styles.headerContainer}>
        <CustomText style={styles.headerTitle}>Water</CustomText>
        <CustomText style={styles.headerDate}>{getTimeSince(item.created_at)}</CustomText>
      </View>

      <View style={styles.divider} />

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

      {item.status === 'pending' && (
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => handleResolveRequest(item.id)}>
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
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No water requests</CustomText>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => fetchRequests(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
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
    color: '#fff',
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 3,
    paddingBottom: 15,
  },
  cardContainer: {
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    backgroundColor: '#262626',
    borderWidth: 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  headerDate: {
    ...typography.textLarge,
    color: '#aaa',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    backgroundColor: '#73BF44',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  resolveButtonText: {
    ...typography.textBold,
    color: '#fff',
    marginRight: 5,
  },
});

export default WaterRequestsList;
