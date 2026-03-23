import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { supabase } from '@/lib/supabase';

import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Define types based on your Supabase schema
type CartRequest = Database['public']['Tables']['cart_requests']['Row'] & {
  driver: {
    full_name: string | null;
  } | null;
  from_field_name?: string | null;
  to_field_name?: string | null;
};
type Profile = Database['public']['Tables']['profiles']['Row'];
type LocationType = Database['public']['Enums']['location_type'];

const FulfilledCartRequestsList = ({
  registerRefreshCallback,
}: {
  registerRefreshCallback: (callback: () => void) => void;
}) => {
  const [requests, setRequests] = useState<CartRequest[]>([]);
  const [pendingRides, setPendingRides] = useState<CartRequest[]>([]);
  const [confirmedRides, setConfirmedRides] = useState<CartRequest[]>([]);
  const [completedRides, setCompletedRides] = useState<CartRequest[]>([]);
  const [expiredRides, setExpiredRides] = useState<CartRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };

  // Collapsible section states
  const [pendingCollapsed, setPendingCollapsed] = useState<boolean>(true);
  const [confirmedCollapsed, setConfirmedCollapsed] = useState<boolean>(true);
  const [completedCollapsed, setCompletedCollapsed] = useState<boolean>(true);
  const [expiredCollapsed, setExpiredCollapsed] = useState<boolean>(true); // Default collapsed
  const [loadingRequests, setLoadingRequests] = useState<Set<number>>(new Set());

  const driverName = profile.full_name;

  const fetchAllRequests = useCallback(async () => {
    try {
      const [requestsResult, fieldsResult] = await Promise.all([
        supabase
          .from('cart_requests')
          .select('*, driver:profiles!cart_requests_driver_fkey(full_name)')
          .in('status', ['pending', 'confirmed', 'resolved', 'expired'])
          .order('created_at', { ascending: false }),
        supabase.from('fields').select('id, name'),
      ]);

      if (requestsResult.error) throw requestsResult.error;
      if (fieldsResult.error) throw fieldsResult.error;

      // Create a mapping of field IDs to names
      const fieldMap: Record<number, string> = {};
      if (fieldsResult.data) {
        fieldsResult.data.forEach((field) => {
          fieldMap[field.id] = field.name;
        });
      }

      // Process and categorize requests in a single pass
      const categorizedRequests = {
        pending: [] as CartRequest[],
        confirmed: [] as CartRequest[],
        completed: [] as CartRequest[],
        expired: [] as CartRequest[],
        all: [] as CartRequest[],
      };

      requestsResult.data.forEach((request) => {
        const enhancedRequest = {
          ...request,
          from_field_name: request.from_field_number ? fieldMap[request.from_field_number] : null,
          to_field_name: request.to_field_number ? fieldMap[request.to_field_number] : null,
        };

        categorizedRequests.all.push(enhancedRequest);

        switch (request.status) {
          case 'pending':
            categorizedRequests.pending.push(enhancedRequest);
            break;
          case 'confirmed':
            categorizedRequests.confirmed.push(enhancedRequest);
            break;
          case 'resolved':
            categorizedRequests.completed.push(enhancedRequest);
            break;
          case 'expired':
            categorizedRequests.expired.push(enhancedRequest);
            break;
        }
      });

      setPendingRides(categorizedRequests.pending);
      setConfirmedRides(categorizedRequests.confirmed);
      setCompletedRides(categorizedRequests.completed);
      setExpiredRides(categorizedRequests.expired);
      setRequests(categorizedRequests.all);
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Collapsible section header component
  const CollapsibleSectionHeader = ({
    title,
    count,
    isCollapsed,
    onToggle,
  }: {
    title: string;
    count: number;
    isCollapsed: boolean;
    onToggle: () => void;
  }) => (
    <TouchableOpacity style={styles.sectionHeader} onPress={onToggle}>
      <CustomText style={styles.sectionTitle}>
        {title} ({count})
      </CustomText>
      <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={20} color="#fff" />
    </TouchableOpacity>
  );

  // Register the refresh callback with the parent
  useEffect(() => {
    registerRefreshCallback(fetchAllRequests);
  }, [registerRefreshCallback, fetchAllRequests]);

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

  const getLocationLabel = (locationType: LocationType) => {
    switch (locationType) {
      case 'Field':
        return 'Field';
      case 'Entrance':
        return 'Main Entrance';
      case 'Tourney Central':
        return 'Tourney Central';
      case 'Lot 1 (Grass)':
        return 'Lot 1 (Grass)';
      case 'Lot 2 (Pavement)':
        return 'Lot 2 (Pavement)';
      default:
        return locationType;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return {
          text: 'Pending',
          color: '#FFD600', // Yellow for pending
        };
      case 'confirmed':
        return {
          text: 'Confirmed',
          color: '#2196F3', // Blue for confirmed
        };
      case 'resolved':
        return {
          text: 'Completed',
          color: '#6EDF28', // Green for completed
        };
      case 'expired':
        return {
          text: 'Expired',
          color: '#EA1D25', // Red for expired
        };
      default:
        return {
          text: 'Unknown',
          color: '#666666', // Gray for unknown
        };
    }
  };

  const deleteRequest = async (requestId: number) => {
    try {
      setLoadingRequests((prev) => new Set(prev).add(requestId));

      // We'll just update the status to 'archived' to keep the record but hide it from the list
      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'expired' as Database['public']['Enums']['request_status'],
        })
        .eq('id', requestId);

      if (error) throw error;

      // Find which category the request is in and update local state immediately
      const requestToMove = requests.find((req) => req.id === requestId);
      if (requestToMove) {
        const updatedRequest = { ...requestToMove, status: 'expired' as const };

        // Remove from current category based on original status
        switch (requestToMove.status) {
          case 'pending':
            setPendingRides((prev) => prev.filter((req) => req.id !== requestId));
            break;
          case 'confirmed':
            setConfirmedRides((prev) => prev.filter((req) => req.id !== requestId));
            break;
          case 'resolved':
            setCompletedRides((prev) => prev.filter((req) => req.id !== requestId));
            break;
        }

        // Add to expired rides
        setExpiredRides((prev) => [updatedRequest, ...prev]);

        // Update the main requests array
        setRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)));
      }
    } catch (error) {
      console.error('Error removing request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    } finally {
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const unarchiveRequest = async (requestId: number) => {
    try {
      setLoadingRequests((prev) => new Set(prev).add(requestId));

      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'pending' as Database['public']['Enums']['request_status'],
        })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state immediately without refetching
      const requestToMove = expiredRides.find((req) => req.id === requestId);
      if (requestToMove) {
        const updatedRequest = { ...requestToMove, status: 'pending' as const };

        // Remove from expired and add to pending
        setExpiredRides((prev) => prev.filter((req) => req.id !== requestId));
        setPendingRides((prev) => [updatedRequest, ...prev]);

        // Update the main requests array
        setRequests((prev) => prev.map((req) => (req.id === requestId ? updatedRequest : req)));
      }
    } catch (error) {
      console.error('Error unarchiving request:', error);
      Alert.alert('Error', 'Failed to unarchive the request. Please try again.');
    } finally {
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const renderItem = ({ item }: { item: CartRequest }) => {
    const statusBadge = getStatusBadge(item.status);
    const isLoading = loadingRequests.has(item.id);

    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                borderColor: statusBadge.color,
                borderWidth: 1,
                backgroundColor: `${statusBadge.color}3D`,
              },
            ]}>
            <CustomText style={styles.statusText}>{statusBadge.text}</CustomText>
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
              <CustomText style={styles.routeLabel}>From: </CustomText>
              <CustomText style={styles.locationText}>
                {item.from_location === 'Field'
                  ? `Field ${item.from_field_name || item.from_field_number}`
                  : getLocationLabel(item.from_location)}
              </CustomText>
            </View>

            {/* To section */}
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              <CustomText style={styles.locationText}>
                {item.to_location === 'Field'
                  ? `Field ${item.to_field_name || item.to_field_number}`
                  : getLocationLabel(item.to_location)}
              </CustomText>
            </View>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Passengers:</CustomText>
            <CustomText style={styles.valueText}>{item.passenger_count || 0}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Name:</CustomText>
            <CustomText style={styles.valueText}>{item.requester || 'Anonymous'}</CustomText>
          </View>
          {item.status !== 'pending' && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>Driver:</CustomText>
              <CustomText style={styles.driverText}>{item.driver ? item.driver.full_name : driverName}</CustomText>
            </View>
          )}
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>{item.status === 'pending' ? 'Created:' : 'Completed:'}</CustomText>
            <CustomText style={styles.valueText}>
              {item.status === 'pending' ? formatDate(item.created_at) : formatDate(item.updated_at)}
            </CustomText>
          </View>
        </View>

        {item.special_request && (
          <View style={styles.specialRequestContainer}>
            <CustomText style={styles.specialRequestLabel}>Special Request:</CustomText>
            <CustomText style={styles.specialRequestText}>{item.special_request}</CustomText>
          </View>
        )}

        <TouchableOpacity
          style={[
            item.status === 'expired' ? styles.unarchiveButton : styles.deleteButton,
            isLoading && styles.buttonDisabled,
          ]}
          onPress={() => {
            if (!isLoading) {
              if (item.status === 'expired') {
                unarchiveRequest(item.id);
              } else {
                deleteRequest(item.id);
              }
            }
          }}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <CustomText style={styles.deleteButtonText}>
              {item.status === 'expired' ? 'Unarchive' : 'Remove'}
            </CustomText>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <CustomText style={styles.loadingText}>Loading all cart requests...</CustomText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No transport requests found</CustomText>
        </View>
      ) : (
        <FlatList
          data={[]}
          renderItem={() => null}
          ListHeaderComponent={() => (
            <View>
              {/* Pending Rides Section */}
              {pendingRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Pending Rides"
                    count={pendingRides.length}
                    isCollapsed={pendingCollapsed}
                    onToggle={() => setPendingCollapsed(!pendingCollapsed)}
                  />
                  {!pendingCollapsed && pendingRides.map((item) => <View key={item.id}>{renderItem({ item })}</View>)}
                </View>
              )}

              {/* Confirmed Rides Section */}
              {confirmedRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Ongoing Rides"
                    count={confirmedRides.length}
                    isCollapsed={confirmedCollapsed}
                    onToggle={() => setConfirmedCollapsed(!confirmedCollapsed)}
                  />
                  {!confirmedCollapsed &&
                    confirmedRides.map((item) => <View key={item.id}>{renderItem({ item })}</View>)}
                </View>
              )}

              {/* Completed Rides Section */}
              {completedRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Completed Rides"
                    count={completedRides.length}
                    isCollapsed={completedCollapsed}
                    onToggle={() => setCompletedCollapsed(!completedCollapsed)}
                  />
                  {!completedCollapsed &&
                    completedRides.map((item) => <View key={item.id}>{renderItem({ item })}</View>)}
                </View>
              )}

              {/* Expired Rides Section */}
              {expiredRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CollapsibleSectionHeader
                    title="Archived"
                    count={expiredRides.length}
                    isCollapsed={expiredCollapsed}
                    onToggle={() => setExpiredCollapsed(!expiredCollapsed)}
                  />
                  {!expiredCollapsed && expiredRides.map((item) => <View key={item.id}>{renderItem({ item })}</View>)}
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </SafeAreaView>
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
    marginTop: 15,
    padding: 10,
  },
  cardHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  requestIdBadge: {
    backgroundColor: '#EA1D25',
    borderRadius: 12,
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
  locationsContainer: {
    borderBottomColor: '#CCCCCC66',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  routeVisualization: {
    alignItems: 'center',
    height: '60%',
    marginVertical: 'auto',
    paddingHorizontal: 8,
  },
  routeInfo: {
    flex: 1,
    gap: 10,
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  locationInfo: {
    flexDirection: 'row',
  },
  routeLabel: {
    ...typography.textLarge,
    color: '#CCCCCC',
  },
  locationText: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  routePoint: {
    backgroundColor: '#EA1D25',
    borderRadius: 6,
    height: 10,
    width: 10,
  },
  routeLine: {
    backgroundColor: '#EA1D25',
    flex: 1, // Makes the line fill the space between the points
    width: 2,
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
  driverText: {
    ...typography.textBold,
    color: '#fff',
  },
  specialRequestContainer: {
    borderColor: '#EA1D25',
    borderLeftWidth: 3,
    borderRadius: 5,
    borderWidth: 1,
    marginVertical: 8,
    padding: 7,
  },
  specialRequestLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  specialRequestText: {
    ...typography.textMedium,
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
  unarchiveButton: {
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 5,
    marginTop: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
});

export default FulfilledCartRequestsList;
