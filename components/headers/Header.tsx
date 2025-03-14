import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { images } from '@/constants';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthProvider';

const Header = () => {

	const { session } = useAuth();

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
					<TouchableOpacity onPress={() => router.navigate('/(tabs)/home')}>
						<MaterialCommunityIcons
							name='home-outline'
							size={32}
							color="#000"
						/>
					</TouchableOpacity>
					<Image 
						source={images.logoW}
						style={{ width: 40, height: 40 }}
					/>
          <TouchableOpacity  
            onPress={handleProfilePress}
          >
            <MaterialIcons
              name='person-outline'
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
		paddingHorizontal: 20,
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
});

export default Header;
