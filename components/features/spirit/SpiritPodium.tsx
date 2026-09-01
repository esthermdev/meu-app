import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

const PLACEHOLDER = require('@/assets/images/avatar-placeholder.png');

/** Gold, silver-blue, bronze-green — indexed by rank - 1. */
export const PODIUM_COLORS = ['#E8871E', '#4357AD', '#276B5D'];

export interface SpiritPodiumEntry {
  teamId: number;
  name: string;
  avatarUri: string | null;
  avgScore: number | null;
  scoresReceived: number;
}

interface SpiritPodiumProps {
  entries: SpiritPodiumEntry[];
}

const SpiritPodium: React.FC<SpiritPodiumProps> = ({ entries }) => {
  // Entries arrive rank-ordered; render 2nd, 1st, 3rd so the winner sits centre stage.
  const slots: (SpiritPodiumEntry | undefined)[] = [entries[1], entries[0], entries[2]];

  return (
    <View style={styles.container}>
      {slots.map((entry, index) => {
        const isFirst = index === 1;
        const rank = isFirst ? 1 : index === 0 ? 2 : 3;

        if (!entry) {
          return <View key={`empty-${rank}`} style={styles.slot} />;
        }

        const color = PODIUM_COLORS[rank - 1];

        return (
          <View key={entry.teamId} style={[styles.slot, !isFirst && styles.slotLower]}>
            <View style={[styles.circleWrap, isFirst && styles.circleWrapFirst]}>
              <View style={[styles.circle, isFirst && styles.circleFirst, { borderColor: color }]}>
                <Image
                  source={entry.avatarUri ? { uri: entry.avatarUri } : PLACEHOLDER}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              </View>

              <View style={styles.badgeTop} pointerEvents="none">
                <View style={[styles.rankBadge, { backgroundColor: color }]}>
                  <CustomText style={styles.rankBadgeText}>{rank}</CustomText>
                </View>
              </View>

              <View style={styles.badgeBottom} pointerEvents="none">
                <View style={[styles.scoreBadge, { backgroundColor: color }]}>
                  <CustomText style={styles.scoreBadgeText}>
                    {entry.avgScore === null ? '—' : entry.avgScore.toFixed(1)}
                  </CustomText>
                </View>
              </View>
            </View>

            <CustomText style={styles.count}>
              {entry.scoresReceived} {entry.scoresReceived === 1 ? 'score' : 'scores'}
            </CustomText>
            <CustomText style={styles.name} numberOfLines={2}>
              {entry.name}
            </CustomText>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
    paddingBottom: 8,
    paddingTop: 20,
  },
  slot: {
    alignItems: 'center',
    flex: 1,
    gap: 2,
  },
  slotLower: {
    marginTop: 34,
  },
  circleWrap: {
    marginBottom: 16,
  },
  circleWrapFirst: {
    marginBottom: 18,
  },
  circle: {
    alignItems: 'center',
    borderRadius: 48,
    borderWidth: 2,
    height: 96,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 96,
  },
  circleFirst: {
    borderRadius: 55,
    height: 110,
    width: 110,
  },
  avatar: {
    height: '100%',
    width: '100%',
  },
  badgeTop: {
    alignItems: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: -16,
  },
  rankBadge: {
    alignItems: 'center',
    borderRadius: 17,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  rankBadgeText: {
    ...typography.textMedium,
    color: '#fff',
  },
  badgeBottom: {
    alignItems: 'center',
    bottom: -16,
    left: 0,
    position: 'absolute',
    right: 0,
  },
  scoreBadge: {
    alignItems: 'center',
    borderRadius: 16,
    justifyContent: 'center',
    minWidth: 58,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  scoreBadgeText: {
    ...typography.textLargeBold,
    color: '#fff',
  },
  count: {
    ...typography.textSmall,
    color: '#888',
  },
  name: {
    ...typography.textSmallBold,
    color: '#242424',
    textAlign: 'center',
  },
});

export default SpiritPodium;
