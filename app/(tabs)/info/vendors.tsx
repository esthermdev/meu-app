import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Linking, SafeAreaView, Image } from 'react-native';
import { supabase } from '@/lib/supabase';
import { FontAwesome5 } from '@expo/vector-icons';
import { Tables } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

type Vendor = Tables<'vendors'>;

const VendorsScreen = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('name');

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
      disabled={!item.website}
    >
      <View style={styles.vendorContent}>
        {item.avatar_url ? (
          <Image 
            source={{ uri: item.avatar_url }} 
            style={styles.vendorImage} 
            resizeMode="contain"
          />
        ) : (
          <View style={styles.vendorImagePlaceholder}>
            <FontAwesome5 name="home" size={24} color="#ccc" />
          </View>
        )}
        <View style={styles.vendorInfo}>
          <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.vendorName}>{item.name}</CustomText>
          {item.website && (
            <View style={styles.websiteContainer}>
              <FontAwesome5 name="link" size={14} color="#2871FF" style={styles.websiteIcon} />
              <CustomText allowFontScaling maxFontSizeMultiplier={1.2} style={styles.websiteText}>Visit website</CustomText>
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
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchVendors}
        >
          <CustomText style={styles.retryButtonText}>Retry</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={vendors}
        renderItem={renderVendorItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <CustomText style={styles.emptyText}>No vendors available at the moment.</CustomText>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    padding: 20,
  },
  errorText: {
    ...typography.textMedium,
    color: '#333',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#EA1D25',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    ...typography.textMedium,
    color: 'white',
  },
  listContainer: {
    padding: 20,
  },
  vendorItem: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginBottom: 10,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  vendorContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  vendorImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorInfo: {
    marginLeft: 16,
    flex: 1,
  },
  vendorName: {
    ...typography.textLargeBold,
    color: '#333',
    marginBottom: 4,
  },
  websiteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  websiteIcon: {
    marginRight: 6,
  },
  websiteText: {
    ...typography.textSmall,
    color: '#2871FF',
  },
  emptyText: {
    ...typography.text,
    color: '#666',
    textAlign: 'center',
    marginTop: 40,
  },
});

export default VendorsScreen;