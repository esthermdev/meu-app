import React, {useEffect, useState} from 'react';
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { ListItem, Avatar } from '@rneui/themed';
import { Ionicons } from '@expo/vector-icons';
import { TeamWithDetails } from '@/hooks/useFavorites';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

interface TeamListItemProps {
  item: TeamWithDetails;
  isFavorited: boolean;
  onToggleFavorite: (teamId: number) => Promise<{ success: boolean; isFavorited: boolean }>;
  onRefreshData: () => Promise<void>;
}

// src/components/TeamListItem.tsx
export const FavoriteTeamsList = React.memo(({ 
  item, 
  isFavorited, 
  onToggleFavorite,
  onRefreshData,
}: TeamListItemProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [localIsFavorited, setLocalIsFavorited] = useState(isFavorited);

  // Update local state when prop changes
  useEffect(() => {
    setLocalIsFavorited(isFavorited);
  }, [isFavorited]);

  const handleToggleFavorite = async () => {
    try {
      setIsLoading(true);
      const result = await onToggleFavorite(item.id);
      
      if (result.success) {
        // If the toggle was successful, refresh the data
        await onRefreshData();
      }
      
      // Update local state based on the result
      setLocalIsFavorited(result.isFavorited);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ListItem containerStyle={styles.container}>
      <Avatar
        size={50}
        rounded
        title={item.name[0]}
        titleStyle={{ color: '#000' }}
        source={{ uri: item?.avatar_uri || undefined }}
        avatarStyle={{ borderColor: '#000', borderWidth: 0.5 }}
        containerStyle={{ backgroundColor: '#fff' }}
      />
      <ListItem.Content style={styles.content}>
        <View style={{ flex: 1, gap: 5 }}>
          <ListItem.Title style={styles.name} maxFontSizeMultiplier={1.2}>
            {item.name}
          </ListItem.Title>
          <View style={[
            styles.divisionContainer, 
            { 
              backgroundColor: item.division_details?.color_light || '#ffffff', 
              borderWidth: 1, 
              borderColor: item.division_details?.color 
            }
          ]}>
            <CustomText style={[
              styles.divisionText, 
              { color: item.division_details?.color }
            ]}>
              {item.division_details?.title || 'Unknown'}
            </CustomText>
          </View>
        </View>
        {isLoading ? (
          <ActivityIndicator size="small" color="#EA1D25" style={styles.favoriteIcon} />
        ) : (
          <Ionicons
            name={localIsFavorited ? 'heart' : 'heart-outline'}
            onPress={handleToggleFavorite}
            size={24}
            color={localIsFavorited ? '#EA1D25' : '#8F8DAA'}
            style={styles.favoriteIcon}
            disabled={isLoading}
          />
        )}
      </ListItem.Content>
    </ListItem>
  );
});

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  name: {
    ...typography.textSemiBold,
  },
  divisionContainer: {
    borderRadius: 100,
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
  },
  divisionText: {
    ...typography.caption,
  },
  favoriteIcon: {
    marginLeft: 'auto',
  },
});