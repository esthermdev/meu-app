import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

interface FeedbackItem {
  id: number;
  message: string;
  created_at: string;
}

export default function MiscInfoScreen() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('id, message, created_at')
        .eq('display', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading feedback:', error);
      } else {
        setFeedback((data || []).filter((item): item is FeedbackItem => item.message !== null));
      }
    } catch (error) {
      console.error('Error loading feedback:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFeedback();
    setRefreshing(false);
  }, [loadFeedback]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !refreshing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <CustomText style={styles.loadingText}>Loading feedback...</CustomText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={{ padding: 20, }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {feedback.length === 0 ? (
          <View style={styles.centerContent}>
            <CustomText style={styles.emptyText}>No feedback submitted yet</CustomText>
          </View>
        ) : (
          feedback.map((item) => (
            <View key={item.id} style={styles.feedbackCard}>
              <CustomText style={styles.feedbackMessage}>{item.message}</CustomText>
              <CustomText style={styles.dateText}>{formatDate(item.created_at)}</CustomText>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    ...typography.textMedium,
  },
  emptyText: {
    color: '#666',
    ...typography.textMedium,
    textAlign: 'center',
  },
  feedbackCard: {
    backgroundColor: '#262626',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  feedbackMessage: {
    color: '#fff',
    ...typography.textMedium,
    marginBottom: 8,
    lineHeight: 20,
  },
  dateText: {
    color: '#999',
    ...typography.textSmall,
    textAlign: 'right',
  },
});