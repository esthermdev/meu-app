import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { Link } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';

export default function StandingsIndex() {
  const { divisions, loading, error, refreshing, refreshDivisions } = useDivisions();

  if (loading && !refreshing) {
    return <LoadingIndicator message='Loading Standings...' />;
  }


  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>Error loading divisions: {error}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refreshDivisions}
          colors={['#EA1D25']} // Android
          tintColor="#EA1D25" // iOS
        />
      }
    >
      <View style={styles.content}>
        {divisions.length > 0 ? divisions.map((division) => (
          <Link
            key={division.id}
            href={{
              pathname: '/standings/[division]',
              params: { division: division.id, divisionName: division.title }
            }}
            asChild
          >
            <TouchableOpacity>
              <View style={[styles.card, { borderColor: division.color, borderBottomWidth: 4 }]}>
                <CustomText style={[styles.title, { color: division.color, textDecorationColor: division.color }]}>{division.title}</CustomText>
              </View>
            </TouchableOpacity>
          </Link>
        )) : (
          <ComingSoonPlaceholder 
            message="Divisions coming soon!"
            iconName="leaderboard"
          />
        )}
      </View>
    </ScrollView>
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
    ...typography.textMedium
  },
});