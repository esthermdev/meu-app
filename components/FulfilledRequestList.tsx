import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { capitalizeWords } from '../utils/capitalizeWords';
import { useAuth } from '../context/AuthProvider';
import { Database } from '@/database.types';

// Define types based on your Supabase schema
type MedicalRequest = Database['public']['Tables']['medical_requests']['Row'] & {
  trainer: {
    full_name: string | null;
  } | null;
};

type Profile = Database['public']['Tables']['profiles']['Row'];

const FulfilledRequestsList = () => {
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

  const getStatusColor = (status: string | null) => {
    if (!status) return '#D828FF';
    
    switch (status.toLowerCase()) {
      case 'pending':
        return '#28D4C0'; // Cyan for pending
      case 'confirmed':
        return '#59DE07'; // Green for confirmed
      case 'resolved':
        return '#00B0FB'; // Blue for resolved
      default:
        return '#D828FF'; // Purple for unknown status
    }
  };

  const getPriorityColor = (priority: string | null) => {
    if (!priority) return '#FFA500';
    
    switch (priority.toLowerCase()) {
      case 'high':
        return '#FF0000'; // Red for high priority
      case 'medium':
        return '#FFA500'; // Orange for medium priority
      case 'low':
        return '#008000'; // Green for low priority
      default:
        return '#FFA500'; // Orange as default
    }
  };

  const renderItem = ({ item }: { item: MedicalRequest }) => (
    <Card containerStyle={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{capitalizeWords(item.status || 'Unknown')}</Text>
          </View>
          <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority_level) }]}>
            <Text style={styles.priorityText}>{item.priority_level || 'Medium'}</Text>
          </View>
        </View>
        <View style={styles.fieldBadge}>
          <Ionicons name="location" size={16} color="white" />
          <Text style={styles.fieldText}>Field {item.field_number}</Text>
        </View>
      </View>

      <View style={styles.cardContent}>
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.labelText} maxFontSizeMultiplier={1}>Trainer:</Text>
            <Text style={[styles.valueText, { color: '#FF00FF' }]} maxFontSizeMultiplier={1}>
              {item.trainer ? item.trainer.full_name : 'Unassigned'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.labelText} maxFontSizeMultiplier={1}>Created:</Text>
            <Text style={styles.valueText} maxFontSizeMultiplier={1}>{formatDate(item.created_at)}</Text>
          </View>
          
          {/* For FulfilledRequestsList, keep the Updated timestamp */}
          {item.updated_at && item.updated_at !== item.created_at && (
            <View style={styles.infoRow}>
              <Text style={styles.labelText} maxFontSizeMultiplier={1}>Updated:</Text>
              <Text style={styles.valueText} maxFontSizeMultiplier={1}>{formatDate(item.updated_at)}</Text>
            </View>
          )}

          {/* Description of Emergency Section */}
          {item.description_of_emergency && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Emergency Description:</Text>
              <Text style={styles.descriptionText}>
                {item.description_of_emergency}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View style={styles.actionContainer}>
            {/* For FulfilledRequestsList.tsx */}
            {item.status === 'confirmed' && (
              <TouchableOpacity
                style={styles.resolveButton}
                onPress={() => markAsResolved(item.id)}
              >
                <Text style={styles.resolveButtonText}>Mark Resolved</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Card>
  );

  const markAsResolved = async (requestId: number) => {
    try {
      const { data, error } = await supabase
        .from('medical_requests')
        .update({
          status: 'resolved' as Database['public']['Enums']['request_status'],
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId)
        .select();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (data) {
        Alert.alert('Success', 'Medical request has been marked as resolved.');
        fetchFulfilledRequests(); // Refresh the list
      }
    } catch (error) {
      console.error('Error resolving request:', error);
      Alert.alert('Error', 'Failed to update the request. Please try again.');
    }
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
    backgroundColor: '#333243',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333243',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333243',
  },
  emptyText: {
    fontSize: 18,
    fontFamily: 'Outfit-Medium',
    color: '#B0B0B0',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Outfit-Regular',
    color: '#B0B0B0',
  },
  listContainer: {
    paddingVertical: 15,
  },
  cardContainer: {
    borderRadius: 10,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#1F1F2F',
    borderWidth: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  priorityText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  fieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#188F00',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  fieldText: {
    color: 'white',
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    marginLeft: 4,
  },
  cardContent: {
    flexDirection: 'column',
  },
  infoContainer: {
    width: '100%',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 5,
  },
  labelText: {
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#B0B0B0',
  },
  valueText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: 'white',
  },
  descriptionContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 5,
    borderLeftWidth: 3,
    borderLeftColor: '#EA1D25',
  },
  descriptionLabel: {
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#B0B0B0',
    marginBottom: 5,
  },
  descriptionText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: 'white',
    lineHeight: 20,
  },
  actionContainer: {
    marginTop: 12,
    alignItems: 'flex-end',
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  acceptButtonText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
  resolveButton: {
    backgroundColor: '#00B0FB',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  resolveButtonText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});

export default FulfilledRequestsList;