import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, View } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

type Profile = Database['public']['Tables']['profiles']['Row'];

type AvailabilityListProps = {
  roleKey: string;
  fallbackName: string;
};

const AvailabilityList = ({ roleKey, fallbackName }: AvailabilityListProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const fetchProfiles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*, profile_roles!inner(roles!inner(key))')
        .eq('profile_roles.roles.key', roleKey)
        .order('full_name');

      if (error) {
        throw error;
      }

      setProfiles(data || []);
    } catch (error) {
      console.error(`Error fetching ${roleKey} profiles:`, error);
    }
  }, [roleKey]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const toggleAvailability = async (profileId: string, currentAvailability: boolean | null) => {
    try {
      const nextAvailability = !currentAvailability;

      const { error } = await supabase.from('profiles').update({ is_available: nextAvailability }).eq('id', profileId);

      if (error) {
        throw error;
      }

      setProfiles((previous) =>
        previous.map((profile) =>
          profile.id === profileId ? { ...profile, is_available: nextAvailability } : profile,
        ),
      );
    } catch (error) {
      console.error(`Error updating ${roleKey} availability:`, error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfiles();
    setRefreshing(false);
  }, [fetchProfiles]);

  const renderProfileItem = ({ item }: { item: Profile }) => (
    <View style={styles.item}>
      <View style={styles.info}>
        <CustomText style={styles.name}>{item.full_name || fallbackName}</CustomText>
        <CustomText style={[styles.availabilityText, { color: item.is_available ? '#59DE07' : '#EA1D25' }]}>
          {item.is_available ? 'Available' : 'Unavailable'}
        </CustomText>
      </View>
      <Switch
        value={!!item.is_available}
        onValueChange={() => toggleAvailability(item.id, item.is_available)}
        trackColor={{ false: '#fff', true: 'whitesmoke' }}
        thumbColor={item.is_available ? '#59DE07' : '#828282'}
      />
    </View>
  );

  return (
    <View style={styles.screenContainer}>
      <FlatList
        data={profiles}
        renderItem={renderProfileItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#EA1D25']} tintColor="#EA1D25" />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  availabilityText: {
    ...typography.text,
    marginTop: 5,
  },
  info: {
    flex: 1,
  },
  item: {
    alignItems: 'center',
    backgroundColor: '#262626',
    borderRadius: 10,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  list: {
    paddingBottom: 15,
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  name: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  screenContainer: {
    backgroundColor: '#000',
    flex: 1,
  },
});

export default AvailabilityList;
