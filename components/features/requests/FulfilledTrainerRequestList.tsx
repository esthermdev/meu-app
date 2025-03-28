import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';

// Define types based on your Supabase schema
type MedicalRequest = Database['public']['Tables']['medical_requests']['Row'] & {
  trainer: {
    full_name: string | null;
  } | null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

const FulfilledTrainerRequestList = () => {
  const [requests, setRequests] = useState<MedicalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };

  useEffect(() => {
    fetchFulfilledRequests();
    const subscription = supabase
      .channel('medical_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_requests' }, fetchFulfilledRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchFulfilledRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*, trainer:profiles(full_name)')
        .in('status', ['confirmed', 'resolved']) // Get requests that are confirmed or resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as MedicalRequest[]);
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error);
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

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return { backgroundColor: '#ED8C22' }; // Default orange for medium
    
    switch (priority.toLowerCase()) {
      case 'high':
        return {
          backgroundColor: '#EA1D253D',
          borderColor: '#EA1D25',
          borderWidth: 1,
          opacity: 0.3
        }; // Red for high priority
      case 'medium':
        return { 
          backgroundColor: '#ED8C223D',
          borderColor: '#ED8C22',
          borderWidth: 1,
          opacity: 0.3
        }; // Orange for medium priority
      case 'low':
        return { 
          backgroundColor: '#0080003D',
          borderColor: '#008000',
          borderWidth: 1,
          opacity: 0.3
        }; // Green for low priority
      default:
        return { backgroundColor: '#FFA500' }; // Orange as default
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (status === 'resolved') {
      return {
        text: 'Resolved',
        color: '#73BF44' // Green for resolved
      };
    } else {
      return {
        text: 'Confirmed',
        color: '#28D4C0' // Cyan for confirmed
      };
    }
  };

  const renderItem = ({ item }: { item: MedicalRequest }) => {
    const statusBadge = getStatusBadge(item.status);
    
    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, getPriorityColor(item.priority_level) ]}>
            <Text style={styles.priorityText}>{item.priority_level || 'Medium'}</Text>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusBadge.color, borderWidth: 1, backgroundColor: '#73BF443D' }]}>
            <Text style={styles.statusText}>{statusBadge.text}</Text>
          </View>
          <View style={styles.fieldBadge}>
            <MaterialIcons name="location-on" size={14} color="#262626" />
            <Text style={styles.fieldText}>Field {item.field_number}</Text>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Request ID: </Text>
            <Text style={styles.valueText}>{item.id}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Trainer:</Text>
            <Text style={styles.trainerNameText}>{item.trainer ? item.trainer.full_name : 'Unassigned'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Created:</Text>
            <Text style={styles.valueText}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Updated:</Text>
            <Text style={styles.valueText}>{formatDate(item.updated_at)}</Text>
          </View>
        </View>

        {item.description_of_emergency && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionLabel}>Emergency Description:</Text>
            <Text style={styles.descriptionText}>
              {item.description_of_emergency}
            </Text>
          </View>
        )}
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <Text style={styles.loadingText}>Loading fulfilled requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No fulfilled requests found</Text>
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
    ...typography.bodyMedium,
    color: '#B0B0B0',
  },
  loadingText: {
    ...typography.bodyBold,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC66'
  },
  priorityBadge: {
    paddingHorizontal: 7,
    borderRadius: 20,
    paddingVertical: 2
  },
  priorityText: {
    color: 'white',
    ...typography.body
  },
  fieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDCF9B',
    borderRadius: 3,
    paddingLeft: 2,
    paddingRight: 3,
    paddingVertical: 2,
  },
  fieldText: {
    color: '#262626',
    ...typography.bodyBold,
  },
  infoSection: {
    gap: 8,
    marginVertical: 8
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelText: {
    ...typography.bodyMediumRegular,
    color: '#CCCCCC80',
  },
  trainerNameText: {
    ...typography.bodyMedium,
    color: '#fff',
  },
  valueText: {
    ...typography.bodyMedium,
    color: '#CCCCCCBF',
  },
  descriptionContainer: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 8,
    backgroundColor: '#262626',
    borderRadius: 5,
    borderLeftWidth: 4,
    borderWidth: 0.5,
    borderColor: '#EA1D25',
    borderLeftColor: '#EA1D25',
  },
  descriptionLabel: {
    ...typography.bodyMediumRegular,
    color: '#CCCCCC80',
  },
  descriptionText: {
    ...typography.bodyMediumRegular,
    color: '#fff',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    marginRight: 'auto',
    marginLeft: 5
  },
  statusText: {
    ...typography.body,
    color: '#fff'
  },
});

export default FulfilledTrainerRequestList;