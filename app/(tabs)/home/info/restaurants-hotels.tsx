import { useEffect, useState } from 'react';
import { Linking, SectionList, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { Tables } from '@/database.types';
import { supabase } from '@/lib/supabase';

import { FontAwesome } from '@expo/vector-icons';

// Define types for our data structure
type Restaurant = Tables<'restaurants'>;
type SectionData = {
  title: string;
  data: Restaurant[];
};

const RestaurantsHotelsScreen = () => {
  const [data, setData] = useState<SectionData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRestaurantsHotels();
  }, []);

  const fetchRestaurantsHotels = async () => {
    try {
      const { data, error } = await supabase.from('restaurants').select('*').order('name');

      if (error) throw error;

      // Group the data by category
      const groupedData: Record<string, Restaurant[]> = {};

      data?.forEach((item) => {
        const category = item.category || 'Uncategorized';
        if (!groupedData[category]) {
          groupedData[category] = [];
        }
        groupedData[category].push(item);
      });

      // Convert to the format needed for SectionList
      const sectionListData = Object.keys(groupedData).map((category) => ({
        title: category,
        data: groupedData[category],
      }));

      setData(sectionListData);
    } catch (error) {
      console.error('Error fetching restaurants and hotels:', error);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: Restaurant }) => (
    <TouchableOpacity style={styles.item} onPress={() => (item.website ? Linking.openURL(item.website) : null)}>
      <View style={styles.itemContent}>
        <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.itemName}>
          {item.name}
        </CustomText>
        {item.discount && (
          <View style={styles.discountContainer}>
            <FontAwesome name="tag" size={14} color="#EA1D25" />
            <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.itemDiscount}>
              {item.discount}
            </CustomText>
          </View>
        )}
      </View>

      {item.website && (
        <View style={styles.websiteContainer}>
          <FontAwesome name="external-link" size={16} color="#2871FF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: SectionData }) => (
    <View style={styles.sectionHeader}>
      <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.sectionHeaderText}>
        {section.title}
      </CustomText>
    </View>
  );

  if (loading) {
    return <LoadingIndicator message="Loading restaurants..." />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome name="exclamation-circle" size={40} color="#EA1D25" />
        <CustomText style={styles.errorText}>{error}</CustomText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchRestaurantsHotels}>
          <CustomText style={styles.retryButtonText}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SectionList
        sections={data}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        stickySectionHeadersEnabled={true}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    marginHorizontal: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  itemContent: {
    flex: 1,
  },
  itemName: {
    ...typography.textBold,
    color: '#333',
  },
  discountContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  itemDiscount: {
    ...typography.textSmall,
    color: '#EA1D25',
    marginLeft: 6,
  },
  websiteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 12,
  },
  sectionHeader: {
    backgroundColor: '#EA1D25',
    marginBottom: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sectionHeaderText: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  errorContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    ...typography.textMedium,
    color: '#333',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#EA1D25',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    ...typography.textSemiBold,
    color: 'white',
  },
  container: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    flex: 1,
    justifyContent: 'center',
  },
});

export default RestaurantsHotelsScreen;
