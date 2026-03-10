import { View, Text, StyleSheet, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useDivisions } from '@/hooks/useScheduleConfig';
import LoadingIndicator from '@/components/LoadingIndicator';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';

export default function ScheduleIndex() {
  const { divisions, loading, error, refreshing, refreshDivisions } = useDivisions();

  const handleSelectDivision = (divisionId: number, divisionName: string) => {
    router.push({
      pathname: `/(tabs)/schedule/[division]`,
      params: { division: divisionId, divisionName },
    });
  };

  if (loading && !refreshing) {
    return <LoadingIndicator message="Loading Schedule..." />;
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
            <TouchableOpacity key={division.id} onPress={() => handleSelectDivision(division.id, division.title)}>
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
          ))
        ) : (
          <ComingSoonPlaceholder message="Divisions coming soon!" iconName="sports" />
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  content: {
    gap: 12,
    padding: 20,
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
  },
  title: {
    ...typography.heading4,
    textDecorationLine: 'underline',
  },
});
