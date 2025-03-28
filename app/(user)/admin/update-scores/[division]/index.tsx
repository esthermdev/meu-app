import { View, Text, StyleSheet, TouchableOpacity, StatusBar, SafeAreaView, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useGametypes } from '@/hooks/useScheduleConfig';
import { fonts, typography } from '@/constants/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomAdminHeader } from '@/components/headers/CustomAdminHeader';

export default function GameTypesScreen() {
  const params = useLocalSearchParams();
  const divisionId = Number(params.division);
  const divisionName = params.divisionName as string;
  
  const { gametypes, loading, error } = useGametypes(divisionId);

  const insets = useSafeAreaInsets();
  
  // Calculate proper padding for Android
  const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  

  const handleSelectGameType = (gameTypeId: number, gameTypeTitle: string, route: string) => {
    // Check if it's a pool play route
    if (route === 'poolplay') {
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

      <StatusBar barStyle="light-content" backgroundColor="#EA1D25" />
      <View style={{ 
        paddingTop: Platform.OS === 'android' ? statusBarHeight : insets.top,
        backgroundColor: '#EA1D25' 
      }}>
        <CustomAdminHeader title={divisionName} />
      </View>
      
      <View style={styles.content}>
        {gametypes.map((option) => (
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
    padding: 20,
    gap: 12
  },
  gameTypeItem: {
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 15,
  },
  gameTypeText: {
    ...typography.bodyLarge,
    flex: 1,
    color: '#fff',
  },
  errorText: {
    color: '#EA1D25',
    fontSize: 16,
    fontFamily: fonts.medium,
  },
});