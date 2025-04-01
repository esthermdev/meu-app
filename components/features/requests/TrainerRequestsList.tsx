// components/medical/RequestsList.tsx
import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/Card'
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

// Define types based on your Supabase schema
type MedicalRequest = Database['public']['Tables']['medical_requests']['Row'] & {
  trainer: {
    full_name: string | null;
  } | null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

const TrainerRequestsList = () => {
  const [requests, setRequests] = useState<MedicalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };

  useEffect(() => {
    fetchRequests();
    const subscription = supabase
      .channel('medical_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medical_requests' }, fetchRequests)
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*, trainer:profiles(full_name)')
        .eq('status', 'pending') // Only show pending requests
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data as MedicalRequest[]);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveRequest = async (requestId: number) => {
    try {
      const { data, error } = await supabase
        .from('medical_requests')
        .update({
          status: 'resolved' as Database['public']['Enums']['request_status'],
          assigned_to: profile.id,
          trainer: profile.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .eq('status', 'pending')
        .select()
        .single();

      if (error) throw error;

      if (data) {
        fetchRequests();
      } else {
        Alert.alert('Request Unavailable', 'This request has already been handled by another trainer.');
      }
    } catch (error) {
      console.error('Error resolving request:', error);
      Alert.alert('Error', 'Failed to resolve the request. Please try again.');
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

  // Function to calculate time elapsed since request was created
  const getTimeSince = (dateString: string | null) => {
    if (!dateString) return 'Unknown';

    const now = new Date();
    const createdAt = new Date(dateString);
    const diffMs = now.getTime() - createdAt.getTime();

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
          borderWidth: 1
        }; // Red for high priority
      case 'medium':
        return {
          backgroundColor: '#ED8C223D',
          borderColor: '#ED8C22',
          borderWidth: 1
        }; // Orange for medium priority
      case 'low':
        return {
          backgroundColor: '#0080003D',
          borderColor: '#008000',
          borderWidth: 1
        }; // Green for low priority
      default:
        return { backgroundColor: '#FFA500' }; // Orange as default
    }
  };

  const renderItem = ({ item }: { item: MedicalRequest }) => {
    const timeColor = getTimeColor(item.created_at);

    return (
      <Card style={styles.cardContainer}>
        <View style={styles.cardHeader}>
          <View style={[styles.priorityBadge, getPriorityColor(item.priority_level)]}>
            <CustomText style={styles.priorityText}>{item.priority_level || 'Medium'}</CustomText>
          </View>
          <View style={styles.fieldBadge}>
            <MaterialIcons name="location-on" size={14} color="#262626" />
            <CustomText style={styles.fieldText}>Field {item.field_number}</CustomText>
          </View>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Request ID: </CustomText>
            <CustomText style={styles.valueText}>{item.id}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Waiting:</CustomText>
            <View style={styles.timeContainer}>
              <View style={[styles.timeIndicator, { backgroundColor: timeColor }]} />
              <CustomText style={styles.timeText}>{getTimeSince(item.created_at)}</CustomText>
            </View>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Trainer:</CustomText>
            <CustomText style={styles.trainerNameText}>{item.trainer ? item.trainer.full_name : 'Unassigned'}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Created:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.created_at)}</CustomText>
          </View>
        </View>

        {item.description_of_emergency && (
          <View style={styles.descriptionContainer}>
            <CustomText style={styles.descriptionLabel}>Emergency Description:</CustomText>
            <CustomText style={styles.descriptionText}>
              {item.description_of_emergency}
            </CustomText>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => resolveRequest(item.id)}
          >
            <CustomText style={styles.buttonText}>Resolved</CustomText>
            <MaterialIcons name="check" size={14} color="white" />
          </TouchableOpacity>
        </View>
      </Card>
    )
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
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No pending requests</CustomText>
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
  // Request card styles
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
    justifyContent: 'space-between',
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
    color: '#fff',
    ...typography.text
  },
  fieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DDCF9B',
    borderRadius: 3,
    paddingLeft: 2,
    paddingRight: 3,
    paddingVertical: 2
  },
  fieldText: {
    color: '#262626',
    ...typography.textBold,
  },
  infoSection: {
    gap: 8,
    marginVertical: 15
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
  trainerNameText: {
    ...typography.textBold,
    color: '#fff',
  },
  valueText: {
    ...typography.textMedium,
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
  descriptionContainer: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 15,
    backgroundColor: '#262626',
    borderRadius: 5,
    borderLeftWidth: 4,
    borderWidth: 0.5,
    borderColor: '#EA1D25',
    borderLeftColor: '#EA1D25',
  },
  descriptionLabel: {
    ...typography.text,
    color: '#CCCCCC80',
  },
  descriptionText: {
    ...typography.textMedium,
    color: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resolveButton: {
    flex: 1,
    backgroundColor: '#73BF44',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.textBold,
    color: '#fff',
    marginRight: 5,
  },
});

export default TrainerRequestsList;