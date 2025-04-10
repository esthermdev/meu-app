import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGametypes } from '@/hooks/useScheduleConfig';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';


export default function GameTypesScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;

  const { gametypes, loading, error } = useGametypes(divisionId);

  const handleSelectGameType = (gameTypeId: number, gameTypeTitle: string, route: string) => {
    // Check if it's a pool play route
    if (route === 'poolplay') {
      router.push({
        pathname: `/(tabs)/schedule/[division]/[gameType]/poolplay`,
        params: {
          division: divisionId,
          divisionName,
          gameType: gameTypeId,
          gameTypeTitle
        }
      });
    } else {
      // Otherwise use the dynamic [gameType] route
      router.push({
        pathname: `/(tabs)/schedule/[division]/[gameType]`,
        params: {
          division: divisionId,
          divisionName,
          gameType: gameTypeId,
          gameTypeTitle
        }
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
      <View style={styles.content}>
        {gametypes ? gametypes.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.gameTypeItem}
            onPress={() => handleSelectGameType(option.id, option.title, option.route)}
          >
            {option.icon && (
              <MaterialCommunityIcons
                name={option.icon as any}
                size={24}
                color='#EA1D25'
                style={styles.icon}
              />
            )}
            <CustomText style={styles.gameTypeText}>{option.title}</CustomText>
          </TouchableOpacity>
        )) : (
          <View>
            <Text style={styles.errorText}>No games available</Text>
          </View>)
        }
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
    gap: 10
  },
  gameTypeItem: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 15,
  },
  gameTypeText: {
    ...typography.textLargeBold,
    flex: 1,
    color: '#000',
  },
  errorText: {
    color: '#EA1D25',
    ...typography.textMedium
  },
});