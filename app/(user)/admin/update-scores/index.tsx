import { View, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { router } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

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
        <CustomText style={styles.errorText}>Error loading divisions: {error}</CustomText>
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
            Platform.OS === 'android' ? { borderBottomColor: division.color } : { shadowColor: division.color }
          ]}
          onPress={() => handleSelectDivision(division.id, division.title)}
        >
          <CustomText style={styles.divisionText}>{division.title}</CustomText>
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
    ...Platform.select({
      ios: {
        shadowOpacity: 1,
        shadowRadius: 0,
        shadowOffset: {
          width: 0,
          height: 3
        }
      },
      android: {
        // On Android, use both elevation AND a bottom border to simulate the line effect
        elevation: 4, // General shadow
        borderBottomWidth: 3, // This creates the line effect
      }
    })
  },
  divisionText: {
    color: '#fff',
    ...typography.textLargeSemiBold,
    textAlign: 'center',
    textDecorationLine: 'underline'
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium
  },
});