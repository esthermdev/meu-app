import { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, View } from 'react-native';

import CustomText from '@/components/CustomText';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';
import { VolunteerRow } from '@/types/database';

const Volunteers = () => {
  const [volunteers, setVolunteers] = useState<VolunteerRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('volunteers')
        .select(
          `
          id,
          badge,
          role,
          avatar_uri
        `,
        )
        .order('badge');

      if (error) {
        console.error('Error fetching volunteers:', error);
      } else {
        setVolunteers(data);
      }
    } catch (error) {
      console.error('Error fetching volunteers:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderItem = ({ item }: { item: VolunteerRow }) => (
    <View style={styles.itemContainer}>
      <Image
        style={styles.avatar}
        source={item.avatar_uri ? { uri: item.avatar_uri } : require('../../../assets/icons/placeholder_user.png')}
      />
      <CustomText style={styles.badgeText} allowFontScaling maxFontSizeMultiplier={1.1}>
        {item.badge}
      </CustomText>
      <CustomText style={styles.roleText} allowFontScaling maxFontSizeMultiplier={1.1}>
        {item.role}
      </CustomText>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <LoadingIndicator message="Loading volunteers..." />
      ) : (
        <FlatList
          data={volunteers}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  itemContainer: {
    alignItems: 'center',
    flex: 1,
    margin: 10,
    width: 100,
  },
  avatar: {
    borderRadius: 30,
    height: 60,
    marginBottom: 5,
    width: 60,
  },
  badgeText: {
    marginBottom: 2,
    textAlign: 'center',
    ...typography.textSmallBold,
  },
  roleText: {
    ...typography.textSmall,
    color: '#666',
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  listContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 10,
  },
});

export default Volunteers;
