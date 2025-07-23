import React, { useEffect, useState } from 'react';
import { Database } from '@/database.types';
import { View, StyleSheet, FlatList } from 'react-native';
import { Avatar } from '@rneui/base';
import { supabase } from '@/lib/supabase';
import { typography } from '@/constants/Typography';
import LoadingIndicator from '@/components/LoadingIndicator';
import CustomText from '@/components/CustomText';

type VolunteersRow = Database['public']['Tables']['volunteers']['Row'];

const Volunteers = () => {
	const [volunteers, setVolunteers] = useState<VolunteersRow[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchVolunteers();
	}, []);

	const fetchVolunteers = async () => {
		setIsLoading(true);
		try {
			const { data, error } = await supabase
				.from('volunteers')
				.select(`
					id,
					badge,
					role,
					avatar_uri,
					email
				`)
				.order('badge');

			if (error) {
				console.error('Error fetching volunteers:', error);
			} else {
				setVolunteers(data);
			}
		} catch (error) {
			console.error('Error fetching volunteers:', error);
		} finally {
			setIsLoading(false);
		}
	};

	const renderItem = ({ item }: { item: VolunteersRow }) => (
		<View style={styles.itemContainer}>
			<Avatar
				containerStyle={styles.avatar}
				size={60}
				rounded
				source={item.avatar_uri ? { uri: item.avatar_uri } : require('../../../assets/icons/placeholder_user.png')}
				placeholderStyle={{ backgroundColor: 'transparent' }}
			/>
			<CustomText style={styles.badgeText} allowFontScaling maxFontSizeMultiplier={1.1}>{item.badge}</CustomText>
			<CustomText style={styles.roleText} allowFontScaling maxFontSizeMultiplier={1.1}>{item.role}</CustomText>
		</View>
	);

	return (
		<View style={styles.container}>
			{isLoading ? (
				<LoadingIndicator message='Loading volunteers...' />
			) : (
				<FlatList
					data={volunteers}
					renderItem={renderItem}
					keyExtractor={(item) => item.id.toString()}
					numColumns={3}
				/>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	listContainer: {
		paddingTop: 10,
		paddingHorizontal: 10,
		flexDirection: 'row',
	},
	itemContainer: {
		flex: 1,
		width: 100,
		alignItems: 'center',
		margin: 10
	},
	avatar: {
		marginBottom: 5,
	},
	badgeText: {
		textAlign: 'center',
		marginBottom: 2,
		...typography.textSmallBold
	},
	roleText: {
		...typography.textSmall,
		textAlign: 'center',
		color: '#666',
	},
});

export default Volunteers;