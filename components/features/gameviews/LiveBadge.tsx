import React, { useEffect } from 'react';
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface LiveBadgeProps {
  /** Livestream URL opened when the badge is tapped. */
  url: string;
}

const DOT_SIZE = 7;
const PULSE_DURATION_MS = 1800;

const openLivestream = (url: string) => {
  Linking.openURL(url).catch((error) => console.error('Error opening livestream link:', error));
};

/** Red "LIVE" pill shown on a game card while its livestream is on air. */
const LiveBadge: React.FC<LiveBadgeProps> = ({ url }) => {
  // 0 -> 1 over each pulse: a halo grows out from the dot and fades away.
  const pulse = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: PULSE_DURATION_MS, easing: Easing.out(Easing.cubic) }),
      -1,
      false,
    );
    return () => cancelAnimation(pulse);
  }, [pulse]);

  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.8 * (1 - pulse.value),
    transform: [{ scale: 1 + 1.6 * pulse.value }],
  }));

  return (
    <TouchableOpacity
      style={styles.liveBadge}
      onPress={() => openLivestream(url)}
      accessibilityRole="link"
      accessibilityLabel="Watch livestream"
      hitSlop={8}>
      <View style={styles.dotContainer}>
        <Animated.View style={[styles.liveHalo, haloStyle]} />
        <View style={styles.liveDot} />
      </View>
      <CustomText style={styles.liveText}>LIVE</CustomText>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  liveBadge: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 20,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  dotContainer: {
    alignItems: 'center',
    height: DOT_SIZE,
    justifyContent: 'center',
    width: DOT_SIZE,
  },
  liveHalo: {
    backgroundColor: '#fff',
    borderRadius: DOT_SIZE / 2,
    height: DOT_SIZE,
    position: 'absolute',
    width: DOT_SIZE,
  },
  liveDot: {
    backgroundColor: '#fff',
    borderRadius: DOT_SIZE / 2,
    height: DOT_SIZE,
    width: DOT_SIZE,
  },
  liveText: {
    ...typography.textXSmallBold,
    color: '#fff',
    letterSpacing: 1,
  },
});

export default LiveBadge;
