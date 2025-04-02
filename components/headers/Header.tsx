import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { images } from '@/constants';
import { router, Href } from 'expo-router';
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
				<TouchableOpacity  
            onPress={handleProfilePress}
          >
            <MaterialIcons
              name='person'
              size={27}
              color="#EA1D25"
            />
          </TouchableOpacity>
					<TouchableOpacity onPress={() => router.navigate('/(tabs)/home')}>
						<Image 
							source={images.logoW}
							style={{ width: 40, height: 40 }}
						/>
					</TouchableOpacity>
					<TouchableOpacity onPress={() => router.navigate('/(tabs)/home/notifications' as Href<'/(tabs)/home/notifications'>)} style={{margin: 6}}>
						<MaterialCommunityIcons
							name='bell'
							size={20}
							color="#000"
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
		height: 50,
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
