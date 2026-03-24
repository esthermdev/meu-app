import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { useCartRequestsSubscription } from '@/hooks/realtime/useRequestSubscriptions';
import { supabase } from '@/lib/supabase';
import { CartRequestWithDriver, LocationType, ProfileRow, RequestStatus } from '@/types/requests';

import Ionicons from '@expo/vector-icons/Ionicons';

type FulfilledCartListItem =
  | {
      key: string;
      kind: 'section-header';
      title: string;
      count: number;
      collapsed: boolean;
      onToggle: () => void;
    }
  | {
      key: string;
      kind: 'ride';
      request: CartRequestWithDriver;
    };

const FulfilledCartRequestsList = () => {
  const [confirmedRides, setConfirmedRides] = useState<CartRequestWithDriver[]>([]);
  const [completedRides, setCompletedRides] = useState<CartRequestWithDriver[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const { profile } = useAuth() as { profile: ProfileRow };

  // Collapsible section states
  const [confirmedCollapsed, setConfirmedCollapsed] = useState<boolean>(true);
  const [completedCollapsed, setCompletedCollapsed] = useState<boolean>(true);
  const [loadingRequests, setLoadingRequests] = useState<Set<number>>(new Set());

  const driverName = profile.full_name;

  const fetchAllRequests = useCallback(async (isInitialLoad: boolean = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      const [requestsResult, fieldsResult] = await Promise.all([
        supabase
          .from('cart_requests')
          .select('*, driver:profiles!cart_requests_driver_fkey(full_name)')
          .in('status', ['confirmed', 'resolved'])
          .order('updated_at', { ascending: false }),
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
        confirmed: [] as CartRequestWithDriver[],
        completed: [] as CartRequestWithDriver[],
      };

      requestsResult.data.forEach((request) => {
        const enhancedRequest = {
          ...request,
          from_field_name: request.from_field_number ? fieldMap[request.from_field_number] : null,
          to_field_name: request.to_field_number ? fieldMap[request.to_field_number] : null,
        };

        switch (request.status) {
          case 'confirmed':
            categorizedRequests.confirmed.push(enhancedRequest);
            break;
          case 'resolved':
            categorizedRequests.completed.push(enhancedRequest);
            break;
        }
      });

      setConfirmedRides(categorizedRequests.confirmed);
      setCompletedRides(categorizedRequests.completed);
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRequests(true);
  }, [fetchAllRequests]);

  useCartRequestsSubscription(fetchAllRequests);

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

      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'expired' as RequestStatus,
        })
        .eq('id', requestId);

      if (error) throw error;

      setConfirmedRides((prev) => prev.filter((req) => req.id !== requestId));
      setCompletedRides((prev) => prev.filter((req) => req.id !== requestId));
    } catch (error) {
      console.error('Error removing request:', error);
      fetchAllRequests(false);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    } finally {
      setLoadingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const clearAllRequests = async () => {
    Alert.alert('Clear All Requests', 'Are you sure you want to remove all ongoing and completed rides?', [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Clear All',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase
              .from('cart_requests')
              .update({
                status: 'expired' as RequestStatus,
              })
              .in('status', ['confirmed', 'resolved']);

            if (error) throw error;

            setConfirmedRides([]);
            setCompletedRides([]);
          } catch (error) {
            console.error('Error clearing fulfilled cart requests:', error);
            Alert.alert('Error', 'Failed to clear all requests. Please try again.');
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CartRequestWithDriver }) => {
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
          style={[styles.deleteButton, isLoading && styles.buttonDisabled]}
          onPress={() => {
            if (!isLoading) {
              deleteRequest(item.id);
            }
          }}
          disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <CustomText style={styles.deleteButtonText}>Remove</CustomText>
          )}
        </TouchableOpacity>
      </Card>
    );
  };

  const listData = useMemo<FulfilledCartListItem[]>(() => {
    const items: FulfilledCartListItem[] = [];

    if (confirmedRides.length > 0) {
      items.push({
        key: 'section-ongoing',
        kind: 'section-header',
        title: 'Ongoing Rides',
        count: confirmedRides.length,
        collapsed: confirmedCollapsed,
        onToggle: () => setConfirmedCollapsed((current) => !current),
      });

      if (!confirmedCollapsed) {
        confirmedRides.forEach((request) => {
          items.push({ key: `confirmed-${request.id}`, kind: 'ride', request });
        });
      }
    }

    if (completedRides.length > 0) {
      items.push({
        key: 'section-completed',
        kind: 'section-header',
        title: 'Completed Rides',
        count: completedRides.length,
        collapsed: completedCollapsed,
        onToggle: () => setCompletedCollapsed((current) => !current),
      });

      if (!completedCollapsed) {
        completedRides.forEach((request) => {
          items.push({ key: `completed-${request.id}`, kind: 'ride', request });
        });
      }
    }

    return items;
  }, [completedCollapsed, completedRides, confirmedCollapsed, confirmedRides]);

  const renderListItem = ({ item }: { item: FulfilledCartListItem }) => {
    if (item.kind === 'section-header') {
      return (
        <TouchableOpacity style={styles.sectionHeader} onPress={item.onToggle}>
          <CustomText style={styles.sectionTitle}>
            {item.title} ({item.count})
          </CustomText>
          <Ionicons name={item.collapsed ? 'chevron-down' : 'chevron-up'} size={20} color="#fff" />
        </TouchableOpacity>
      );
    }

    return renderItem({ item: item.request });
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
    <View style={styles.container}>
      {listData.length === 0 ? (
        <FlatList
          data={listData}
          renderItem={renderListItem}
          keyExtractor={(item) => item.key}
          contentContainerStyle={[styles.listContainer, styles.emptyListContainer]}
          refreshing={refreshing}
          onRefresh={() => fetchAllRequests(false)}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CustomText style={styles.emptyText}>No transport requests found</CustomText>
            </View>
          }
        />
      ) : (
        <>
          <FlatList
            data={listData}
            renderItem={renderListItem}
            keyExtractor={(item) => item.key}
            contentContainerStyle={styles.listContainer}
            refreshing={refreshing}
            onRefresh={() => fetchAllRequests(false)}
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
  emptyListContainer: {
    flexGrow: 1,
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
    padding: 15,
  },
  cardContainer: {
    backgroundColor: '#262626',
    borderRadius: 12,
    borderWidth: 0,
    marginBottom: 10,
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
  clearAllContainer: {
    alignItems: 'center',
    backgroundColor: '#242424',
    marginBottom: 0,
    paddingBottom: 35,
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  sectionHeader: {
    alignItems: 'center',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
});

export default FulfilledCartRequestsList;
