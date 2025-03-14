// @ts-nocheck
import { useScheduleOptions } from '@/hooks/useScheduleConfig';
import { useLocalSearchParams, Link } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Database } from '@/database.types';
import { typography } from '@/constants/Typography';

type ScheduleOption = Database['public']['Tables']['schedule_options']['Row'];

export default function DivisionScreen() {
  const { divisionId } = useDivisions();
  const { scheduleOptions } = useScheduleOptions(divisionId)
  
  const renderItem: ListRenderItem<ScheduleOption> = ({ item }) => (
    <TouchableOpacity
      style={styles.optionButton}
      onPress={() => router.push({
        pathname: `schedule/[division]/${item.route}`,
        params: {
          division: divisionId,
        }
      })}
      activeOpacity={0.6}
    >
      <FontAwesome6 name={item.icon} size={22} style={styles.icon}/>
      <Text style={styles.optionButtonText} maxFontSizeMultiplier={1}>{item.title}</Text>
      <FontAwesome6 name="chevron-right" size={20} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList<ScheduleOption>
        data={scheduleOptions}
        renderItem={renderItem}
        keyExtractor={(item) => item.route}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  optionButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12
  },
  icon: {
    marginRight: 15,
    color: '#EA1D25'
  },
  optionButtonText: {
    ...typography.bodyLarge,
    flex: 1,
    color: '#000',
  },
});
