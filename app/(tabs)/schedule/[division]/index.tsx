import { useScheduleOptions } from '@/hooks/useScheduleConfig';
import { useLocalSearchParams, Link } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

export default function DivisionScreen() {
  const { division, divisionName } = useLocalSearchParams();

  const { scheduleOptions } = useScheduleOptions(Number(division))

  return (
    <View style={styles.container}>
      <Text>Details of division Id: {division} </Text>
      <Link
        href={{
          pathname: "/schedule/[division]/[poolplay]",
          params: { division: Number(division), poolplay: Number(division) }
        }}>
        View pool play games
      </Link>
      <Link
        href={{
          pathname: "/schedule/[division]/championship-bracket",
          params: { division: Number(division) }
        }}
      >
        View championship bracket games
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
