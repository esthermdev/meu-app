import React from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

interface LiveBadgeProps {
  /** Livestream URL opened when the badge is tapped. */
  url: string;
}

const openLivestream = (url: string) => {
  Linking.openURL(url).catch((error) => console.error('Error opening livestream link:', error));
};

/** Red "LIVE" pill shown on a game card while its livestream is on air. */
const LiveBadge: React.FC<LiveBadgeProps> = ({ url }) => (
  <TouchableOpacity
    style={styles.liveBadge}
    onPress={() => openLivestream(url)}
    accessibilityRole="link"
    accessibilityLabel="Watch livestream"
    hitSlop={8}>
    <View style={styles.liveDot} />
    <CustomText style={styles.liveText}>LIVE</CustomText>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  liveDot: {
    backgroundColor: '#fff',
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  liveText: {
    ...typography.textXSmallBold,
    color: '#fff',
    letterSpacing: 1,
  },
});

export default LiveBadge;
