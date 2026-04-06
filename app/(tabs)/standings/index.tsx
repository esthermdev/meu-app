import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Link } from 'expo-router';

import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';
import CustomText from '@/components/CustomText';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import { useDivisions } from '@/hooks/useScheduleConfig';

export default function StandingsIndex() {
  const { divisions, loading, error, refreshing, refreshDivisions } = useDivisions();

  if (loading && !refreshing) {
    return <LoadingIndicator message="Loading Standings..." />;
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
      }>
      <View style={styles.content}>
        {divisions.length > 0 ? (
          divisions.map((division) => (
            <Link
              key={division.id}
              href={{
                pathname: '/standings/[division]',
                params: { division: division.id, divisionName: division.title },
              }}
              asChild>
              <TouchableOpacity>
                <View style={[styles.card, { borderColor: division.color, borderBottomWidth: 4 }]}>
                  <CustomText
                    style={[
                      styles.title,
                      {
                        color: division.color,
                        textDecorationColor: division.color,
                      },
                    ]}>
                    {division.title}
                  </CustomText>
                </View>
              </TouchableOpacity>
            </Link>
          ))
        ) : (
          <ComingSoonPlaceholder message="Divisions coming soon!" iconName="leaderboard" />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
  },
  content: {
    gap: 12,
    padding: 20,
  },
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    ...typography.heading4,
    textDecorationLine: 'underline',
  },
});
