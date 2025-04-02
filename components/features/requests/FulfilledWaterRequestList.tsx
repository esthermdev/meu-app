// components/features/requests/FulfilledWaterRequestList.tsx

import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { useIsFocused } from '@react-navigation/native';
import { Card } from '@/components/Card';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import { MaterialIcons } from '@expo/vector-icons';

// Define types based on your Supabase schema
type WaterRequest = Database['public']['Tables']['water_requests']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

const FulfilledWaterRequestsList = () => {
  const [requests, setRequests] = useState<WaterRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };
  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      fetchFulfilledRequests();
    }
  }, [isFocused]);

  useEffect(() => {
    fetchFulfilledRequests();
    const subscription = supabase
      .channel('water_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'water_requests' }, fetchFulfilledRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFulfilledRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('water_requests')
        .select('*, fields(name, location)')
        .eq('status', 'resolved') // Get requests that are resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as unknown as WaterRequest[]);
    } catch (error) {
      console.error('Error fetching fulfilled water requests:', error);
    } finally {
      setLoading(false);
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
      minute: '2-digit'
    });
  };
  
  // Calculate time since the water request was fulfilled
  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    
    const now = new Date();
    const updatedAt = new Date(dateString);
    const diffMs = now.getTime() - updatedAt.getTime();
    
    // Convert to minutes
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else {
      const diffHours = Math.floor(diffMins / 60);
      const remainingMins = diffMins % 60;
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ${remainingMins > 0 ? `${remainingMins} min${remainingMins !== 1 ? 's' : ''}` : ''} ago`;
    }
  };

  const deleteRequest = async (requestId: number) => {
    try {
      // Simply delete the record since it's already fulfilled
      const { error } = await supabase
        .from('water_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;
      
      // Update the local state by removing the deleted request
      setRequests(requests.filter(req => req.id !== requestId));
      
    } catch (error) {
      console.error('Error removing water request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const renderItem = ({ item }: { item: WaterRequest }) => {
    // Determine the color for the time indicator based on how long ago the request was fulfilled
    // Green for recently fulfilled (< 30 mins), yellow for moderate time (30-60 mins), red for long time (> 60 mins)
    const getTimeColor = (dateString: string | null) => {
      if (!dateString) return '#EA1D25'; // Default to red if unknown
      
      const now = new Date();
      const updatedAt = new Date(dateString);
      const diffMs = now.getTime() - updatedAt.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 30) return '#59DE07'; // Green
      if (diffMins < 60) return '#FFD600'; // Yellow
      return '#EA1D25'; // Red
    };
    
    const timeColor = getTimeColor(item.updated_at);
    
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <CustomText style={styles.waterTitle}>Water</CustomText>
          <View style={[styles.statusBadge, { backgroundColor: '#6EDF283D', borderColor: '#6EDF28', borderWidth: 1 }]}>
            <CustomText style={styles.statusText}>Resolved</CustomText>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Field:</CustomText>
            <CustomText style={styles.valueText}>Field {item.field_number}</CustomText>
          </View>
          
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Fulfilled:</CustomText>
            <View style={styles.timeContainer}>
              <View style={[styles.timeIndicator, { backgroundColor: timeColor }]} />
              <CustomText style={styles.timeText}>{getTimeSince(item.updated_at)}</CustomText>
            </View>
          </View>
          
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Request ID:</CustomText>
            <CustomText style={styles.valueText}>{item.id}</CustomText>
          </View>
          
          {item.volunteer && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>Volunteer:</CustomText>
              <CustomText style={styles.valueText}>{item.volunteer}</CustomText>
            </View>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteRequest(item.id)}
        >
          <CustomText style={styles.deleteButtonText}>Remove</CustomText>
        </TouchableOpacity>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <CustomText style={styles.loadingText}>Loading fulfilled water requests...</CustomText>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No fulfilled water requests found</CustomText>
        </View>
      ) : (
        <FlatList
          data={requests}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchFulfilledRequests}
        />
      )}
    </SafeAreaView>
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
    marginVertical: 12,
    backgroundColor: '#262626',
    borderWidth: 0
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66'
  },
  waterTitle: {
    ...typography.textLargeBold,
    color: '#fff',
    marginRight: 'auto'
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
  },
  statusText: {
    ...typography.text,
    color: '#fff'
  },
  infoSection: {
    gap: 8,
    marginVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC66',
    paddingBottom: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    ...typography.text,
    color: '#CCCCCC80',
  },
  valueText: {
    ...typography.textSemiBold,
    color: '#CCCCCCBF',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 5,
  },
  timeText: {
    ...typography.textSemiBold,
    color: '#fff',
  },
  deleteButton: {
    backgroundColor: '#EA1D25',
    paddingVertical: 8,
    borderRadius: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    marginTop: 5
  },
  deleteButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
});

export default FulfilledWaterRequestsList;