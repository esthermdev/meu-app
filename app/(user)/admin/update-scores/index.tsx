// app/(user)/admin/update-scores/index.tsx
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { fonts } from '@/constants/Typography';

export default function UpdateScoresDivisionsScreen() {
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
            { borderLeftColor: division.color || '#EA1D25' }
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
    padding: 20
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  divisionItem: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  divisionText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.medium,
    textAlign: 'center',
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});