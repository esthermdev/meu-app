import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import { Card } from '@/components/Card';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { supabase } from '@/lib/supabase';
import { CartRequestRow, CartRequestWithFieldNames, LocationType, ProfileRow, RequestStatus } from '@/types/requests';
import { getTimeColor } from '@/utils/getTimeColor';
import { getTimeSince } from '@/utils/getTimeSince';

import { Ionicons } from '@expo/vector-icons';

type CartListItem = {
  key: string;
  kind: 'current' | 'pending';
  request: CartRequestWithFieldNames;
};

const CartRequestsList = ({ registerRefreshCallback }: { registerRefreshCallback: (callback: () => void) => void }) => {
  const [currentRides, setCurrentRides] = useState<CartRequestWithFieldNames[]>([]);
  const [pendingRides, setPendingRides] = useState<CartRequestWithFieldNames[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [isPendingCollapsed, setIsPendingCollapsed] = useState<boolean>(false);
  const { profile } = useAuth() as { profile: ProfileRow };
  const fieldsMapRef = useRef<Record<number, string> | null>(null);

  const getFieldMap = useCallback(async () => {
    if (fieldsMapRef.current) {
      return fieldsMapRef.current;
    }

    const { data: fieldsData, error: fieldsError } = await supabase.from('fields').select('id, name');
    if (fieldsError) {
      throw fieldsError;
    }

    const fieldMap: Record<number, string> = {};
    fieldsData?.forEach((field) => {
      fieldMap[field.id] = field.name;
    });

    fieldsMapRef.current = fieldMap;
    return fieldMap;
  }, []);

  const fetchRequests = useCallback(
    async (isInitialLoad: boolean = false) => {
      try {
        if (isInitialLoad) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        const [fieldMap, pendingResult, currentResult] = await Promise.all([
          getFieldMap(),
          supabase.from('cart_requests').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
          supabase
            .from('cart_requests')
            .select('*')
            .eq('status', 'confirmed')
            .eq('driver', profile.id)
            .order('created_at', { ascending: false }),
        ]);

        if (pendingResult.error) {
          throw pendingResult.error;
        }
        if (currentResult.error) {
          throw currentResult.error;
        }

        const enhanceRequest = (request: CartRequestRow): CartRequestWithFieldNames => ({
          ...request,
          from_field_name: request.from_field_number ? fieldMap[request.from_field_number] : null,
          to_field_name: request.to_field_number ? fieldMap[request.to_field_number] : null,
        });

        const nextPending = (pendingResult.data || []).map(enhanceRequest);
        const nextCurrent = (currentResult.data || []).map(enhanceRequest);

        setCurrentRides(nextCurrent);
        setPendingRides(nextPending);

        console.log(`Loaded ${nextCurrent.length} current rides, ${nextPending.length} pending rides`);
      } catch (error) {
        console.error('Error fetching cart requests:', error);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getFieldMap, profile.id],
  );

  useEffect(() => {
    fetchRequests(true);
  }, [fetchRequests]);

  // Register the refresh callback with the parent
  useEffect(() => {
    registerRefreshCallback(() => fetchRequests(false));
  }, [registerRefreshCallback, fetchRequests]);

  const acceptRequest = async (requestId: number) => {
    try {
      const requestToMove = pendingRides.find((request) => request.id === requestId);
      if (requestToMove) {
        setPendingRides((prev) => prev.filter((request) => request.id !== requestId));
        setCurrentRides((prev) => [...prev, { ...requestToMove, status: 'confirmed', driver: profile.id }]);
      }

      const { data, error } = await supabase
        .from('cart_requests')
        .update({
          status: 'confirmed' as RequestStatus,
          driver: profile.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        fetchRequests(false);
        throw error;
      }

      if (!data || data.length === 0) {
        fetchRequests(false);
        Alert.alert('Request Unavailable', 'This request has already been accepted by another driver.');
      }
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    }
  };

  const removeRequest = async (requestId: number) => {
    try {
      setPendingRides((prev) => prev.filter((request) => request.id !== requestId));
      setCurrentRides((prev) => prev.filter((request) => request.id !== requestId));

      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'expired' as RequestStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        fetchRequests(false);
        throw error;
      }
    } catch (error) {
      console.error('Error removing request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const completeRide = async (requestId: number) => {
    try {
      setCurrentRides((prev) => prev.filter((request) => request.id !== requestId));

      const { error } = await supabase
        .from('cart_requests')
        .update({
          status: 'resolved' as RequestStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) {
        fetchRequests(false);
        throw error;
      }
    } catch (error) {
      console.error('Error completing ride:', error);
      Alert.alert('Error', 'Failed to complete the ride. Please try again.');
    }
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

  const getLocationLabel = (locationType: LocationType) => {
    switch (locationType) {
      case 'Field':
        return 'Field';
      case 'Entrance':
        return 'Main Entrance';
      case 'Tourney Central':
        return 'Tournament HQ';
      case 'Lot 1 (Grass)':
        return 'Parking Lot 1 (Grass)';
      case 'Lot 2 (Pavement)':
        return 'Parking Lot 2 (Pavement)';
      default:
        return locationType;
    }
  };

  const navigateToFieldMap = () => {
    router.push('/(tabs)/home/fieldmap');
  };

  const renderCurrentRide = ({ item }: { item: CartRequestWithFieldNames }) => {
    return (
      <Card style={[styles.cardContainer, styles.currentRideCard]}>
        <View style={styles.cardHeader}>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: '#73BF44' }]}>
            <CustomText style={styles.statusText}>Confirmed</CustomText>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint} />
            <View style={styles.routeLine} />
            <View style={styles.routePoint} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>From: </CustomText>
              {item.from_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.from_field_name || item.from_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.from_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              {item.to_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.to_field_name || item.to_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.to_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.passengerRow}>
          <CustomText style={styles.passengerLabel}>Passengers:</CustomText>
          <CustomText style={styles.passengerCount}>{item.passenger_count || 0}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Name:</CustomText>
          <CustomText style={styles.infoValue}>{item.requester || 'Anonymous'}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Created:</CustomText>
          <CustomText style={styles.infoValue}>{formatDate(item.created_at)}</CustomText>
        </View>

        {item.special_request && (
          <View style={styles.specialRequestContainer}>
            <CustomText style={styles.specialRequestLabel}>Special Request:</CustomText>
            <CustomText style={styles.specialRequestText}>{item.special_request}</CustomText>
          </View>
        )}

        <TouchableOpacity style={styles.completeButton} onPress={() => completeRide(item.id)}>
          <CustomText style={styles.completeButtonText}>Complete Ride</CustomText>
        </TouchableOpacity>
      </Card>
    );
  };

  const renderPendingRide = ({ item }: { item: CartRequestWithFieldNames }) => {
    const timeColor = getTimeColor(item.created_at, {
      recent: 5,
      moderate: 15,
    });

    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={styles.requestIdBadge}>
            <CustomText style={styles.requestIdText}>#{item.id}</CustomText>
          </View>
          <View style={styles.timeContainer}>
            <View style={[styles.timeIndicator, { backgroundColor: timeColor }]} />
            <CustomText style={styles.waitingTime}>{getTimeSince(item.created_at)}</CustomText>
          </View>
        </View>

        <View style={styles.locationsContainer}>
          <View style={styles.routeVisualization}>
            <View style={styles.routePoint} />
            <View style={styles.routeLine} />
            <View style={styles.routePoint} />
          </View>
          <View style={styles.routeInfo}>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>From: </CustomText>
              {item.from_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.from_field_name || item.from_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.from_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.locationInfo}>
              <CustomText style={styles.routeLabel}>To: </CustomText>
              {item.to_location === 'Field' ? (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    Field {item.to_field_name || item.to_field_number}
                  </CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={navigateToFieldMap}>
                  <CustomText style={[styles.locationText, styles.linkText]}>
                    {getLocationLabel(item.to_location)}
                  </CustomText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        <View style={styles.passengerRow}>
          <CustomText style={styles.passengerLabel}>Passengers:</CustomText>
          <CustomText style={styles.passengerCount}>{item.passenger_count || 0}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Name:</CustomText>
          <CustomText style={styles.infoValue}>{item.requester || 'Anonymous'}</CustomText>
        </View>

        <View style={styles.infoRow}>
          <CustomText style={styles.infoLabel}>Created:</CustomText>
          <CustomText style={styles.infoValue}>{formatDate(item.created_at)}</CustomText>
        </View>

        {item.special_request && (
          <View style={styles.specialRequestContainer}>
            <CustomText style={styles.specialRequestLabel}>Special Request:</CustomText>
            <CustomText style={styles.specialRequestText}>{item.special_request}</CustomText>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.acceptButton} onPress={() => acceptRequest(item.id)}>
            <CustomText style={styles.acceptButtonText}>Accept</CustomText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.removeButton} onPress={() => removeRequest(item.id)}>
            <CustomText style={styles.removeButtonText}>Remove</CustomText>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const listData = useMemo<CartListItem[]>(() => {
    const items: CartListItem[] = [];
    currentRides.forEach((request) => {
      items.push({ key: `current-${request.id}`, kind: 'current', request });
    });
    if (!isPendingCollapsed) {
      pendingRides.forEach((request) => {
        items.push({ key: `pending-${request.id}`, kind: 'pending', request });
      });
    }
    return items;
  }, [currentRides, isPendingCollapsed, pendingRides]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <CustomText style={styles.loadingText}>Loading cart requests...</CustomText>
      </View>
    );
  }

  const renderListItem = ({ item }: { item: CartListItem }) => {
    if (item.kind === 'current') {
      return renderCurrentRide({ item: item.request });
    }
    return renderPendingRide({ item: item.request });
  };

  return (
    <View style={styles.container}>
      {currentRides.length === 0 && pendingRides.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No cart requests available</CustomText>
        </View>
      ) : (
        <FlatList
          data={listData}
          renderItem={renderListItem}
          keyExtractor={(item) => item.key}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={8}
          removeClippedSubviews
          ListHeaderComponent={() => (
            <View>
              {currentRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <CustomText style={styles.sectionTitle}>Current Rides</CustomText>
                </View>
              )}

              {pendingRides.length > 0 && (
                <View style={styles.sectionContainer}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => setIsPendingCollapsed(!isPendingCollapsed)}>
                    <CustomText style={styles.sectionTitle}>Pending Rides ({pendingRides.length})</CustomText>
                    <Ionicons name={isPendingCollapsed ? 'chevron-down' : 'chevron-up'} size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={styles.listContainer}
          refreshing={refreshing}
          onRefresh={() => fetchRequests(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  acceptButton: {
    alignItems: 'center',
    backgroundColor: '#73BF44',
    borderRadius: 5,
    flex: 1,
    marginRight: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  acceptButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
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
  completeButton: {
    alignItems: 'center',
    backgroundColor: '#2E7D32',
    borderRadius: 5,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  completeButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  container: {
    backgroundColor: '#000',
    flex: 1,
    paddingTop: 10,
  },
  currentRideCard: {
    borderColor: '#73BF44',
    borderWidth: 2,
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
  infoLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  infoRow: {
    alignItems: 'center',
    borderBottomColor: '#CCCCCC66',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingBottom: 8,
  },
  infoValue: {
    ...typography.textSemiBold,
    color: '#CCCCCCBF',
  },
  linkText: {
    color: '#81afe4ff',
    textDecorationLine: 'underline',
  },
  listContainer: {
    paddingBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 3,
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
  locationInfo: {
    flexDirection: 'row',
  },
  locationText: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  locationsContainer: {
    borderBottomColor: '#CCCCCC66',
    borderBottomWidth: 1,
    flexDirection: 'row',
  },
  passengerCount: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  passengerLabel: {
    ...typography.text,
    color: '#CCCCCCB2',
  },
  passengerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  removeButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 5,
    flex: 1,
    marginLeft: 4,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  removeButtonText: {
    ...typography.textBold,
    color: '#fff',
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
  routeInfo: {
    flex: 1,
    gap: 10,
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  routeLabel: {
    ...typography.textLarge,
    color: '#CCCCCC',
  },
  routeLine: {
    backgroundColor: '#EA1D25',
    flex: 1,
    width: 2,
  },
  routePoint: {
    backgroundColor: '#EA1D25',
    borderRadius: 6,
    height: 10,
    width: 10,
  },
  routeVisualization: {
    alignItems: 'center',
    height: '60%',
    marginVertical: 'auto',
    paddingHorizontal: 8,
  },
  sectionContainer: {
    marginBottom: 10,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  sectionTitle: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  specialRequestContainer: {
    borderColor: '#EA1D25',
    borderLeftWidth: 3,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 8,
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
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    ...typography.textSmall,
    color: '#fff',
    fontWeight: 'bold',
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
  waitingTime: {
    ...typography.textMedium,
    color: '#CCCCCC',
  },
});

export default CartRequestsList;
