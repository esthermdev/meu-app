import { View, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/AuthProvider';

const Header = () => {

	const { session, profile } = useAuth();

  const handleProfilePress = () => {
		if (!session) {
			router.navigate('/sign-in')
		} else {
			router.navigate('/(user)')
		}
  }

	return (
		<SafeAreaView edges={["top"]} style={{ backgroundColor: '#fff' }}>
			<View style={styles.container}>
				<View style={styles.content}>
					<TouchableOpacity style={styles.button} onPress={() => router.navigate('/(tabs)/home')}>
						<MaterialIcons name='home' size={32} />
					</TouchableOpacity>
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleProfilePress}
          >
            <MaterialIcons
              name='account-circle'
              size={32}
              color="#EA1D25"
            />
          </TouchableOpacity>
				</View>
			</View>
		</SafeAreaView>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: '#fff',
		height: 40,
		width: '100%',
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	button: {
		paddingHorizontal: 16
	},
});

export default Header;
