import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, ActivityIndicator, Switch, RefreshControl } from 'react-native';
import { supabase } from '@/lib/supabase';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

type WaterRequests = Database['public']['Tables']['water_requests']['Row'];
type Volunteer = Database['public']['Tables']['profiles']['Row'];

const Tab = createMaterialTopTabNavigator();

const WaterRequestsScreen = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#EA1D25',
        tabBarInactiveTintColor: '#fff',
        tabBarLabelStyle: {
          ...typography.bodySmall
        },
        tabBarStyle: {
          backgroundColor: '#262626',
        },
        tabBarIndicatorStyle: {
          backgroundColor: '#EA1D25',
          height: 3,
        },
        tabBarAllowFontScaling: false
      }}
    >
      <Tab.Screen name="Requests" component={WaterRequestsList} />
      <Tab.Screen name="Volunteers" component={VolunteerAvailabilityScreen} />
    </Tab.Navigator>
  );
};

const WaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequests[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('water_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();

    // Set up real-time subscription
    const subscription = supabase
      .channel('water_requests_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_requests' }, fetchRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchRequests]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      weekday: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleResolveRequest = async (requestId: number) => {
    try {
      // Instead of updating the status, delete the request
      const { error } = await supabase
        .from('water_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      // Filter out the resolved request from the local state
      setRequests(current => current.filter(request => request.id !== requestId));
    } catch (error) {
      console.error('Error resolving water request:', error);
    }
  };

  const renderItem = ({ item }: { item: WaterRequests }) => (
    <View style={styles.cardContainer}>
      <View style={styles.headerContainer}>
        <CustomText style={styles.headerTitle}>Water</CustomText>
        <CustomText style={styles.headerDate}>{formatDate(item.created_at)}</CustomText>
      </View>

      <View style={styles.divider} />

      <View style={styles.infoRow}>
        <CustomText style={styles.infoLabel}>Field:</CustomText>
        <CustomText style={styles.infoValue}>{item.field_number}</CustomText>
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
          onPress={() => handleResolveRequest(item.id)}
        >
          <CustomText style={styles.resolveButtonText}>Resolved</CustomText>
          <MaterialIcons name="check" size={14} color="white" />
        </TouchableOpacity>
      )}
    </View>
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
          refreshing={loading}
          onRefresh={fetchRequests}
        />
      )}
    </View>
  );
};

// This would be part of the water-requests-new.tsx file above

const VolunteerAvailabilityScreen = () => {
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchVolunteers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_volunteer', true)
        .order('full_name');

      if (error) throw error;
      setVolunteers(data || []);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    }
  }, []);

  useEffect(() => {
    fetchVolunteers();
  }, [fetchVolunteers]);

  const toggleAvailability = async (volunteerId: string, currentAvailability: boolean | null) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_available: !currentAvailability })
        .eq('id', volunteerId);

      if (error) throw error;

      setVolunteers(volunteers.map(volunteer =>
        volunteer.id === volunteerId
          ? { ...volunteer, is_available: !currentAvailability }
          : volunteer
      ));
    } catch (error) {
      console.error('Error updating volunteer availability:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchVolunteers();
    setRefreshing(false);
  }, [fetchVolunteers]);

  const renderVolunteerItem = ({ item }: { item: Volunteer }) => (
    <View style={styles.volunteerItem}>
      <View style={styles.volunteerInfo}>
        <CustomText style={styles.volunteerName}>{item.full_name || 'Unnamed Volunteer'}</CustomText>
        <CustomText style={[styles.availabilityText,
        { color: item.is_available ? '#59DE07' : '#EA1D25' }]}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </CustomText>
      </View>
      <Switch
        value={!!item.is_available}
        onValueChange={() => toggleAvailability(item.id, item.is_available)}
        trackColor={{ false: "#fff", true: "whitesmoke" }}
        thumbColor={item.is_available ? "#59DE07" : "#828282"}
      />
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={volunteers}
        renderItem={renderVolunteerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.volunteerList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#EA1D25']}
            tintColor="#EA1D25"
          />
        }
      />
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  // Loading and empty 
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
    color: '#fff'
  },
  // Card styles
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 3,
    paddingBottom: 15
  },
  cardContainer: {
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    backgroundColor: '#262626',
    borderWidth: 0
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
    ...typography.textLarge,
    color: '#CCCCCC',
  },
  infoValue: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  statusPending: {
    color: '#EA1D25', // Red color for pending status
    ...typography.textLargeSemiBold
  },
  resolveButton: {
    backgroundColor: '#73BF44',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center'
  },
  resolveButtonText: {
    ...typography.textBold,
    color: '#fff',
    marginRight: 5
  },
  // Volunteer screen
  volunteerList: {
    padding: 15,
  },
  volunteerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#262626',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  volunteerInfo: {
    flex: 1,
  },
  volunteerName: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  availabilityText: {
    ...typography.text,
    marginTop: 5,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
});

export default WaterRequestsScreen;