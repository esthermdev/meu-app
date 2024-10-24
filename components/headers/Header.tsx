import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

const Header = () => {

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<TouchableOpacity style={styles.button} onPress={() => router.push('/(tabs)')}>
					<MaterialIcons name='home' size={25} />
				</TouchableOpacity>
				<TouchableOpacity style={styles.button} onPress={() => router.push('/(admin)')}>
					<MaterialIcons name='manage-accounts'
						size={25}
						color='#EA1D25'
					/>
				</TouchableOpacity>
			</View>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		backgroundColor: 'white',
		height: 56,
		width: '100%',
	},
	content: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	button: {
		paddingHorizontal: 20
	},
});

export default Header;
