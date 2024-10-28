import { View, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {

	return (
		<SafeAreaView edges={["top"]} style={{ backgroundColor: '#fff' }}>
			<View style={styles.container}>
				<View style={styles.content}>
					<TouchableOpacity style={styles.button} onPress={() => router.dismiss()}>
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
		paddingHorizontal: 20
	},
});

export default Header;
