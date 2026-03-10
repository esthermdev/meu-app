import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGameTypesByDivision } from '@/hooks/useScheduleConfig';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';
import ComingSoonPlaceholder from '@/components/ComingSoonPlaceholder';

export default function GameTypesScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;

  const { gametypes, loading, error } = useGameTypesByDivision(divisionId);

  const handleSelectGameType = (gameTypeId: number, gameTypeTitle: string, route: string) => {
    // Check if it's a pool play route
    if (route === 'poolplay') {
      router.push({
        pathname: `/(tabs)/schedule/[division]/[gameType]/poolplay`,
        params: {
          division: divisionId,
          divisionName,
          gameType: gameTypeId,
          gameTypeTitle,
        },
      });
    } else {
      // Otherwise use the dynamic [gameType] route
      router.push({
        pathname: `/(tabs)/schedule/[division]/[gameType]`,
        params: {
          division: divisionId,
          divisionName,
          gameType: gameTypeId,
          gameTypeTitle,
        },
      });
    }
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
        <Text style={styles.errorText}>Error loading game types: {error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {gametypes && gametypes.length > 0 ? (
        <View style={styles.content}>
          {gametypes.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={styles.gameTypeItem}
              onPress={() => handleSelectGameType(option.id, option.title, option.route)}>
              {option.icon && (
                <MaterialCommunityIcons name={option.icon as any} size={24} color="#EA1D25" style={styles.icon} />
              )}
              <CustomText style={styles.gameTypeText}>{option.title}</CustomText>
            </TouchableOpacity>
          ))}
        </View>
      ) : (
        <ComingSoonPlaceholder message="Pools and brackets coming soon!" iconName="account-tree" />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    gap: 10,
    padding: 20,
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium,
  },
  gameTypeItem: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    padding: 20,
  },
  gameTypeText: {
    ...typography.textLargeBold,
    color: '#000',
    flex: 1,
  },
  icon: {
    marginRight: 15,
  },
});
