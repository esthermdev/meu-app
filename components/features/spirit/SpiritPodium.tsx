import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

const PLACEHOLDER = require('@/assets/images/avatar-placeholder.png');

/** Gold, silver-blue, bronze-green — indexed by rank - 1. */
export const PODIUM_COLORS = ['#ED8C22', '#4357AD', '#276B5D'];

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
            <View style={styles.circleWrap}>
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
    justifyContent: 'center',
    paddingTop: 25,
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
  circle: {
    alignItems: 'center',
    borderRadius: 100,
    borderWidth: 1,
    height: 110,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    width: 110,
  },
  circleFirst: {
    borderRadius: 100,
    height: 120,
    width: 120,
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
    height: 30,
    justifyContent: 'center',
    width: 30,
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
    minWidth: 46,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  scoreBadgeText: {
    ...typography.textBold,
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
