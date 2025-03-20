import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useScheduleOptions } from '@/hooks/useScheduleConfig';
import { fonts } from '@/constants/Typography';
import { CustomUpdateScoresHeader } from '@/components/headers/CustomUpdateScoresHeader';
import LoadingIndicator from '@/components/LoadingIndicator';

export default function GameTypesScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;
  
  const { scheduleOptions, loading, error } = useScheduleOptions(divisionId);

  const handleSelectGameType = (gameTypeId: number, gameTypeTitle: string, route: string) => {
    // Check if it's a pool play route
    if (route === '[poolplay]') {
      router.push({
        pathname: `/(user)/admin/update-scores/[division]/[gameType]/poolplay`,
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
        pathname: `/(user)/admin/update-scores/[division]/[gameType]`,
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
      <LoadingIndicator message='Loading divisions...'/>
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
      <StatusBar barStyle="light-content" backgroundColor="#EA1D25" />

      <SafeAreaView style={{ backgroundColor: "#EA1D25" }}>
        <CustomUpdateScoresHeader title={divisionName} />
      </SafeAreaView>

      <View style={styles.content}>
        {scheduleOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.gameTypeItem}
            onPress={() => handleSelectGameType(option.id, option.title, option.route)}
          >
            {option.icon && (
              <MaterialCommunityIcons 
                name={option.icon as any} 
                size={24} 
                color={option.icon_color || '#FF3B30'} 
                style={styles.icon} 
              />
            )}
            <Text style={styles.gameTypeText}>{option.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EA1D25',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontFamily: fonts.semiBold,
  },
  content: {
    padding: 16,
  },
  gameTypeItem: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  gameTypeText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});