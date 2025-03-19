import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/database.types';

type FAQ = Tables<'faq'>;

const FAQItem = ({ item }: { item: FAQ }) => (
  <View style={styles.faqItem}>
    <Text style={styles.question}>{item.question}</Text>
    <Text style={styles.answer}>{item.answer}</Text>
  </View>
);

const FAQScreen = () => {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchFAQs();
  }, []);

  const fetchFAQs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faq')
        .select('*')
        .order('id', { ascending: true });

      if (error) {
        throw error;
      }

      setFaqs(data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centeredContainer]}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={faqs}
        renderItem={({ item }) => <FAQItem item={item} />}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No FAQs available at the moment.</Text>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centeredContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 20,
  },
  faqItem: {
    marginBottom: 24,
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EA1D25',
  },
  question: {
    fontFamily: 'GeistBold',
    fontSize: 18,
    color: '#EA1D25',
    marginBottom: 8,
  },
  answer: {
    fontFamily: 'GeistRegular',
    fontSize: 16,
    color: '#333',
    lineHeight: 22,
  },
  emptyText: {
    fontFamily: 'GeistRegular',
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default FAQScreen;