// components/medical/RequestsList.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Card } from '@rneui/themed';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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

const RequestsList = () => {
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
        Alert.alert('Success', 'Medical request has been marked as resolved.');
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

  const renderItem = ({ item }: { item: MedicalRequest }) => (
    <Card containerStyle={styles.cardContainer}>
      <View style={styles.cardHeader}>
        <View style={[styles.priorityBadge, getPriorityColor(item.priority_level)]}>
          <Text style={styles.priorityText}>{item.priority_level || 'Medium'}</Text>
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
        {item.updated_at && item.updated_at !== item.created_at && (
          <View style={styles.infoRow}>
            <Text style={styles.labelText}>Updated:</Text>
            <Text style={styles.valueText}>{formatDate(item.updated_at)}</Text>
          </View>
        )}
      </View>

      {item.description_of_emergency && (
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionLabel}>Emergency Description:</Text>
          <Text style={styles.descriptionText}>
            {item.description_of_emergency}
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.resolveButton}
          onPress={() => resolveRequest(item.id)}
        >
          <Text style={styles.buttonText}>Resolved</Text>
          <MaterialIcons name="check" size={14} color="white" />
        </TouchableOpacity>
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
        <Text style={styles.loadingText}>Loading requests...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {requests.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No pending requests</Text>
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
  listContainer: {
    paddingVertical: 3,
  },
  cardContainer: {
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 20,
    marginVertical: 12,
    backgroundColor: '#262626',
    borderWidth: 0
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#CCCCCC'
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
    paddingVertical: 2
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
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  resolveButton: {
    flex: 1,
    backgroundColor: '#73BF44',
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    ...typography.bodyMedium,
    color: '#fff',
    marginRight: 5,
  },
});

export default RequestsList;