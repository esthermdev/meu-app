import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import LoadingIndicator from '@/components/LoadingIndicator';
import { fonts, typography } from '@/constants/Typography';

export default function ScheduleIndex() {
  const { divisions, loading, error } = useDivisions();

  const handleSelectDivision = (divisionId: number, divisionName: string) => {
    router.push({
      pathname: `/(tabs)/schedule/[division]`,
      params: { division: divisionId, divisionName }
    });
  };

  if (loading) {
    return (
      <LoadingIndicator message='Loading Divisions...' />
    );
  }

    if (error) {
      return (
        <View style={[styles.container, styles.centerContent]}>
          <Text style={styles.errorText}>Error loading divisions: {error}</Text>
        </View>
      );
    }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {divisions.map((division) => (
          <TouchableOpacity
            key={division.id}
            onPress={() => handleSelectDivision(division.id, division.title)}
          >
            <View style={[styles.card, { borderColor: division.color, borderBottomWidth: 4 }]}>
              <Text style={[styles.title, { color: division.color, textDecorationColor: division.color }]}>{division.title}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
  },
  title: {
    ...typography.h4,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});