import { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import { Tables } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

type Vendor = Tables<'vendors'>;

const SponsorScreen = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSponsors();
  }, []);

  const fetchSponsors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('vendors').select('*').eq('type', 'sponsor').order('name');

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      setError('Failed to load vendors. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVendorPress = (website: string | null) => {
    if (website) {
      Linking.openURL(website);
    }
  };

  const renderVendorItem = ({ item }: { item: Vendor }) => (
    <TouchableOpacity
      style={styles.vendorItem}
      onPress={() => handleVendorPress(item.website)}
      disabled={!item.website}>
      <View style={styles.vendorContent}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.vendorImage} resizeMode="contain" />
        ) : (
          <View style={styles.vendorImagePlaceholder}>
            <FontAwesome5 name="home" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.vendorInfo}>
          <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.vendorName}>
            {item.name}
          </CustomText>
          {item.website && (
            <View style={styles.websiteContainer}>
              <FontAwesome5 name="link" size={14} color="#2871FF" style={styles.websiteIcon} />
              <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.websiteText}>
                Visit website
              </CustomText>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <FontAwesome5 name="exclamation-circle" size={40} color="#EA1D25" />
        <CustomText style={styles.errorText}>{error}</CustomText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSponsors}>
          <CustomText style={styles.retryButtonText}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={vendors}
        renderItem={renderVendorItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={<CustomText style={styles.emptyText}>No vendors available at the moment.</CustomText>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f8f8',
    flex: 1,
  },
  emptyText: {
    ...typography.text,
    color: '#666',
    marginTop: 40,
    textAlign: 'center',
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
  listContainer: {
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    flex: 1,
    justifyContent: 'center',
  },
  retryButton: {
    backgroundColor: '#EA1D25',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  retryButtonText: {
    ...typography.textMedium,
    color: 'white',
  },
  vendorContent: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  vendorImage: {
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 60,
    width: 60,
  },
  vendorImagePlaceholder: {
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    height: 60,
    justifyContent: 'center',
    width: 60,
  },
  vendorInfo: {
    flex: 1,
    marginLeft: 16,
  },
  vendorItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    elevation: 2,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vendorName: {
    ...typography.textLargeBold,
    color: '#333',
    marginBottom: 4,
  },
  websiteContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 6,
  },
  websiteIcon: {
    marginRight: 6,
  },
  websiteText: {
    ...typography.textSmall,
    color: '#2871FF',
  },
});

export default SponsorScreen;
