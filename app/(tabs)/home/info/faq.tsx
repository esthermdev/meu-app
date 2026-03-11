import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Tables } from '@/database.types';
import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

type FAQ = Tables<'faq'>;

const FAQItem = ({ item }: { item: FAQ }) => (
  <View style={styles.faqItem}>
    <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.question}>
      {item.question}
    </CustomText>
    <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.answer}>
      {item.answer}
    </CustomText>
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
      const { data, error } = await supabase.from('faq').select('*').order('id', { ascending: true });

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
        ListEmptyComponent={<CustomText style={styles.emptyText}>No FAQs available at the moment.</CustomText>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  answer: {
    ...typography.text,
    color: '#333',
    lineHeight: 22,
  },
  centeredContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  emptyText: {
    ...typography.textMedium,
    color: '#666',
    marginTop: 40,
    textAlign: 'center',
  },
  faqItem: {
    backgroundColor: '#f9f9f9',
    borderLeftColor: '#EA1D25',
    borderLeftWidth: 4,
    borderRadius: 10,
    marginBottom: 24,
    padding: 16,
  },
  listContainer: {
    padding: 20,
  },
  question: {
    ...typography.textLargeBold,
    color: '#EA1D25',
    marginBottom: 8,
  },
});

export default FAQScreen;
