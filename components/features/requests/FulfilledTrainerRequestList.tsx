import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@/components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthProvider';
import { useRequests } from '@/context/RequestsContext';
import { useIsFocused } from '@react-navigation/native';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

// Define types based on your Supabase schema
type MedicalRequest = Database['public']['Tables']['medical_requests']['Row'] & {
  trainer: {
    full_name: string | null;
  } | null;
  fields: {
    name: string;
  } | null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

const FulfilledTrainerRequestList = () => {
  const [requests, setRequests] = useState<MedicalRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { profile } = useAuth() as { profile: Profile };
  const isFocused = useIsFocused();

  // Effect that runs when the tab comes into focus
  useEffect(() => {
    if (isFocused) {
      fetchFulfilledRequests();
    }
  }, [isFocused]);

  // Regular effect for initial load and subscription
  useEffect(() => {
    fetchFulfilledRequests();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('fulfilled_trainer_requests_channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medical_requests'
        },
        (payload) => {
          console.log('Fulfilled trainer requests real-time update:', payload);
          fetchFulfilledRequests();
        }
      )
      .subscribe((status) => {
        console.log('Fulfilled trainer requests subscription status:', status);
      });

    return () => {
      console.log('Unsubscribing from fulfilled_trainer_requests_channel');
      subscription.unsubscribe();
    };
  }, [profile?.id]); // Add profile dependency to avoid stale closures

  const fetchFulfilledRequests = async () => {
    try {
      console.log('Fetching fulfilled trainer requests...');
      const { data, error } = await supabase
        .from('medical_requests')
        .select('*, trainer:profiles(full_name), fields:fields(name)')
        .in('status', ['confirmed', 'resolved']) // Get requests that are confirmed or resolved
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setRequests(data as MedicalRequest[]);
      console.log(`Loaded ${data?.length || 0} fulfilled trainer requests`);
    } catch (error) {
      console.error('Error fetching fulfilled requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteRequest = async (requestId: number) => {
    try {
      // Optimistic update - remove from local state immediately
      setRequests(prev => prev.filter(req => req.id !== requestId));

      const { error } = await supabase
        .from('medical_requests')
        .update({ status: 'expired' as Database['public']['Enums']['request_status'] })
        .eq('id', requestId);

      if (error) {
        // Revert optimistic update on error
        fetchFulfilledRequests();
        throw error;
      }
    } catch (error) {
      console.error('Error removing request:', error);
      Alert.alert('Error', 'Failed to remove the request. Please try again.');
    }
  };

  const clearAllRequests = async () => {
    Alert.alert(
      'Clear All Requests',
      'Are you sure you want to remove all fulfilled trainer requests?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Update all confirmed and resolved requests to expired
              const { error } = await supabase
                .from('medical_requests')
                .update({ status: 'expired' as Database['public']['Enums']['request_status'] })
                .in('status', ['confirmed', 'resolved']);

              if (error) throw error;

              // Clear the local state
              setRequests([]);

            } catch (error) {
              console.error('Error clearing all trainer requests:', error);
              Alert.alert('Error', 'Failed to clear all requests. Please try again.');
            }
          }
        }
      ]
    );
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
            <CustomText style={styles.priorityText}>{item.priority_level || 'Medium'}</CustomText>
          </View>
          <View style={[styles.statusBadge, { borderColor: statusBadge.color, borderWidth: 1, backgroundColor: '#73BF443D' }]}>
            <CustomText style={styles.statusText}>{statusBadge.text}</CustomText>
          </View>
          <View style={styles.fieldBadge}>
            <MaterialIcons name="location-on" size={14} color="#262626" />
            <CustomText style={styles.fieldText}>
            Field {item.fields?.name || `Field ${item.field_number}`}
            </CustomText>
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Request ID: </CustomText>
            <CustomText style={styles.valueText}>{item.id}</CustomText>
          </View>
          {item.team_name && (
            <View style={styles.infoRow}>
              <CustomText style={styles.labelText}>Team:</CustomText>
              <CustomText style={styles.valueText}>{item.team_name}</CustomText>
            </View>
          )}
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Trainer:</CustomText>
            <CustomText style={styles.trainerNameText}>{item.trainer ? item.trainer.full_name : 'Unassigned'}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Created:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.created_at)}</CustomText>
          </View>
          <View style={styles.infoRow}>
            <CustomText style={styles.labelText}>Updated:</CustomText>
            <CustomText style={styles.valueText}>{formatDate(item.updated_at)}</CustomText>
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
        <CustomText style={styles.loadingText}>Loading fulfilled requests...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <CustomText style={styles.emptyText}>No fulfilled requests found</CustomText>
        </View>
      ) : (
        <>
          <FlatList
            data={requests}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContainer}
          />
          <View style={styles.clearAllContainer}>
            <TouchableOpacity
              style={styles.clearAllButton}
              onPress={clearAllRequests}
            >
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
    paddingVertical: 2,
  },
  fieldText: {
    color: '#262626',
    ...typography.textBold,
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
  trainerNameText: {
    ...typography.textBold,
    color: '#fff',
  },
  valueText: {
    ...typography.textMedium,
    color: '#CCCCCCBF',
  },
  descriptionContainer: {
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 5,
    borderLeftWidth: 4,
    borderWidth: 0.5,
    borderColor: '#EA1D25',
    borderLeftColor: '#EA1D25',
    backgroundColor: '#262626',
  },
  descriptionLabel: {
    ...typography.text,
    color: '#CCCCCC80',
  },
  descriptionText: {
    ...typography.textMedium,
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
    ...typography.text,
    color: '#fff'
  },
  deleteButton: {
    backgroundColor: '#EA1D25',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButtonText: {
    ...typography.textBold,
    color: '#fff',
  },
  clearAllContainer: {
    paddingHorizontal: 15,
    paddingBottom: 35,
    paddingVertical: 20,
    marginBottom: 0,
    backgroundColor: '#242424',
    alignItems: 'center'
  },
  clearAllButton: {
    backgroundColor: '#ea8e1dff',
    paddingVertical: 12,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
  },
  clearAllButtonText: {
    ...typography.textBold,
    color: '#fff',
    fontSize: 16,
  },
});

export default FulfilledTrainerRequestList;