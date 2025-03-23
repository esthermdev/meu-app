import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { fonts, typography } from '@/constants/Typography';

export default function UpdateScoresIndex() {
  const { divisions, loading, error } = useDivisions();

  const handleSelectDivision = (divisionId: number, divisionName: string) => {
    router.push({
      pathname: `/(user)/admin/update-scores/[division]`,
      params: { division: divisionId, divisionName }
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#EA1D25" />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading divisions: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {divisions.map((division) => (
        <TouchableOpacity
          key={division.id}
          style={[
            styles.divisionItem,
            { shadowColor: division.color }
          ]}
          onPress={() => handleSelectDivision(division.id, division.title)}
        >
          <Text style={styles.divisionText}>{division.title}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    gap: 12,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  divisionItem: {
    backgroundColor: '#262626',
    padding: 16,
    borderRadius: 12,
    shadowOpacity: 1,
    shadowRadius: 0,
    shadowOffset: {
      width: 0,
      height: 3
    }
  },
  divisionText: {
    color: '#fff',
    ...typography.h4,
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});