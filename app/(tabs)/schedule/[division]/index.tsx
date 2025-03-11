// @ts-nocheck
import { useScheduleOptions } from '@/hooks/useScheduleConfig';
import { useLocalSearchParams, Link } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ListRenderItem } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Database } from '@/database.types';

type ScheduleOption = Database['public']['Tables']['schedule_options']['Row'];

export default function DivisionScreen() {
  const { division } = useLocalSearchParams();
  const { scheduleOptions } = useScheduleOptions(Number(division))
  
  const renderItem: ListRenderItem<ScheduleOption> = ({ item }) => (
    <TouchableOpacity
      style={[styles.optionButton, { backgroundColor: item.bg_color }]}
      onPress={() => router.push({
        pathname: `schedule/[division]/${item.route}`,
        params: {
          division: Number(division),
        }
      })}
      activeOpacity={0.6}
    >
      <FontAwesome6 name={item.icon} size={22} color={item.icon_color} style={styles.icon}/>
      <Text style={[styles.optionButtonText, { color: item.icon_color }]} maxFontSizeMultiplier={1}>{item.title}</Text>
      <FontAwesome6 name="chevron-right" size={20} color={item.icon_color} />
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
    backgroundColor: 'white',
    padding: 25
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 12,
    borderRadius: 12
  },
  icon: {
    marginRight: 15,
  },
  optionButtonText: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Outfit-SemiBold',
  },
});
