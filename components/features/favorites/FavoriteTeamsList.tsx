import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TeamWithDetails } from '@/hooks/useFavoriteTeams';
import { typography } from '@/constants/Typography';
import CustomText from '@/components/CustomText';

interface TeamListItemProps {
  item: TeamWithDetails;
  isFavorited: boolean;
  onToggleFavorite: (teamId: number) => Promise<{ success: boolean; isFavorited: boolean }>;
  onRefreshData: () => Promise<void>;
}

// src/components/TeamListItem.tsx
export const FavoriteTeamsList = React.memo(
  ({ item, isFavorited, onToggleFavorite, onRefreshData }: TeamListItemProps) => {
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

    const avatarUri = item?.avatar_uri || undefined;
    const avatarInitial = item.name?.[0]?.toUpperCase() || '?';

    return (
      <View style={styles.container}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
        ) : (
          <View style={styles.avatarFallback}>
            <CustomText style={styles.avatarFallbackText}>{avatarInitial}</CustomText>
          </View>
        )}
        <View style={styles.content}>
          <View style={{ flex: 1, gap: 5 }}>
            <CustomText style={styles.name} maxFontSizeMultiplier={1.2}>
              {item.name}
            </CustomText>
            <View
              style={[
                styles.divisionContainer,
                {
                  backgroundColor: item.division_details?.color_light || '#ffffff',
                  borderWidth: 1,
                  borderColor: item.division_details?.color,
                },
              ]}>
              <CustomText style={[styles.divisionText, { color: item.division_details?.color }]}>
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
        </View>
      </View>
    );
  },
);

FavoriteTeamsList.displayName = 'FavoriteTeamsList';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomColor: '#f0f0f0',
    borderBottomWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderColor: '#000',
    borderRadius: 25,
    borderWidth: 0.5,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  avatarFallbackText: {
    ...typography.textSemiBold,
    color: '#000',
  },
  avatarImage: {
    borderColor: '#000',
    borderRadius: 25,
    borderWidth: 0.5,
    height: 50,
    width: 50,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    gap: 10,
    marginLeft: 12,
  },
  divisionContainer: {
    alignSelf: 'flex-start',
    borderRadius: 100,
    paddingHorizontal: 7,
  },
  divisionText: {
    ...typography.caption,
  },
  favoriteIcon: {
    marginLeft: 'auto',
  },
  name: {
    ...typography.textSemiBold,
  },
});
