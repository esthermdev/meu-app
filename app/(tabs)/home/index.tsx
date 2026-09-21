// app/(tabs)/home/index.tsx
import { useCallback, useRef, useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';

import CircleIconButton from '@/components/buttons/CircleIconButton';
import FullWidthButton from '@/components/buttons/FullWidthButton';
import LargeCardButton from '@/components/buttons/LargeCardButton';
import CustomText from '@/components/CustomText';
import CartRequestModal from '@/components/features/modals/CartRequestModal';
import TrainerRequestModal from '@/components/features/modals/TrainerRequestModal';
import WaterRequestModal from '@/components/features/modals/WaterRequestModal';
import NotificationPrompt from '@/components/features/notifications/NotificationPrompt';
import MyGamesButtonBackground from '@/components/MyGamesButtonBackground';
import { typography } from '@/constants/Typography';
import { useAuth } from '@/context/AuthProvider';
import { hasAnyRole } from '@/context/profileRoles';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

// How much of the Evergreen banner stays visible when it's tucked away:
// left padding (14) + pine-tree icon (18) + a little breathing room.
const BANNER_PEEK_WIDTH = 40;
const BANNER_HIDDEN_OFFSET = 300;
const BANNER_INITIAL_DELAY_MS = 300;
const BANNER_INITIAL_HOLD_MS = 500;
const BANNER_TAP_HOLD_MS = 1000;
const SLIDE_IN = { duration: 500, easing: Easing.out(Easing.cubic) };
const SLIDE_OUT = { duration: 400, easing: Easing.in(Easing.cubic) };

export default function HomeScreen() {
  // Trainer requests and spirit scoring are submitted on behalf of a whole team, so
  // they are limited to signed-in captains (and admins) rather than every player.
  // Both screens behind these buttons require a session, so a signed-out user never
  // sees them even if a stale profile is still in memory.
  const { profile, session } = useAuth();
  const canActForTeam = !!session && hasAnyRole(profile, ['captain', 'admin']);

  // Evergreen banner: slides fully in on focus, holds briefly, then tucks away so only the
  // pine-tree icon peeks out. Tapping the peek slides the full banner back in; tapping the
  // expanded banner opens the Evergreen page.
  const [bannerWidth, setBannerWidth] = useState(0);
  const translateX = useSharedValue(BANNER_HIDDEN_OFFSET);
  const bannerExpanded = useRef(false);
  const bannerTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearBannerTimers = useCallback(() => {
    bannerTimers.current.forEach(clearTimeout);
    bannerTimers.current = [];
  }, []);

  const collapseBanner = useCallback(() => {
    bannerExpanded.current = false;
    const peekOffset = Math.max(0, (bannerWidth || BANNER_HIDDEN_OFFSET) - BANNER_PEEK_WIDTH);
    translateX.value = withTiming(peekOffset, SLIDE_OUT);
  }, [bannerWidth, translateX]);

  const expandBanner = useCallback(
    (holdMs: number) => {
      clearBannerTimers();
      bannerExpanded.current = true;
      translateX.value = withTiming(0, SLIDE_IN);
      bannerTimers.current.push(setTimeout(collapseBanner, SLIDE_IN.duration + holdMs));
    },
    [clearBannerTimers, collapseBanner, translateX],
  );

  const onBannerPress = useCallback(() => {
    if (bannerExpanded.current) {
      router.push('/(tabs)/home/evergreen');
    } else {
      expandBanner(BANNER_TAP_HOLD_MS);
    }
  }, [expandBanner]);

  useFocusEffect(
    useCallback(() => {
      // Start fully off-screen, then slide in after a short beat.
      translateX.value = bannerWidth || BANNER_HIDDEN_OFFSET;
      bannerTimers.current.push(setTimeout(() => expandBanner(BANNER_INITIAL_HOLD_MS), BANNER_INITIAL_DELAY_MS));
      return clearBannerTimers;
    }, [bannerWidth, clearBannerTimers, expandBanner, translateX]),
  );

  const bannerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View>
          {/* My Games Button with Custom Background */}
          <View style={{ gap: 10 }}>
            <LargeCardButton
              title="My Games"
              subtitle=""
              route="/(tabs)/home/mygames"
              renderCustomBackground={() => <MyGamesButtonBackground title="My Games" />}
            />

            <View style={styles.row}>
              {canActForTeam && (
                <LargeCardButton
                  title="Spirit"
                  subtitle=""
                  icon={<MaterialCommunityIcons name="handshake-outline" size={28} color="#fff" />}
                  backgroundColor="#F7941D"
                  route="/(tabs)/home/spirit"
                  disabled={false}
                />
              )}

              {/* Watch Live button with background image and play button */}
              <LargeCardButton
                title="Watch Live"
                subtitle=""
                route="https://www.youtube.com/@maineultimate/streams"
                backgroundImage={require('@/assets/images/watch-live.jpg')}
              />
            </View>
          </View>

          {/* Circular icon buttons */}
          <View style={styles.utilsContainer}>
            <CircleIconButton icon="map" iconColor="#276B5D" label="Field Map" route="/(tabs)/home/fieldmap" />
            {canActForTeam && <TrainerRequestModal />}
            <CartRequestModal />
            <WaterRequestModal />
          </View>
        </View>

        <View>
          {/* Chat / Feedback card */}
          <TouchableOpacity style={styles.chatCard} onPress={() => router.push('/(tabs)/home/chat')}>
            <View style={styles.chatCardContent}>
              <View style={styles.chatCardText}>
                <CustomText style={styles.chatCardTitle}>Chat with the Team</CustomText>
                <CustomText style={styles.chatCardSubtitle}>
                  Need help? Chat with an admin or leave a suggestion for the team.
                </CustomText>
              </View>
              <View style={styles.chatCardIcon}>
                <MaterialCommunityIcons name="chat-processing" size={24} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>
          {/* Bottom full-width buttons */}
          <View style={styles.bottomButtons}>
            <FullWidthButton
              title="Volunteers"
              icon="crowd"
              backgroundColor="#"
              iconColor="#4357AD"
              route="/(tabs)/home/volunteers"
              style={{ flex: 1 }}
            />

            <FullWidthButton
              title="Donation"
              icon="heart"
              backgroundColor="#fff"
              iconColor="#FE0000"
              route="https://www.paypal.com/donate/?hosted_button_id=3HCQBB97LCV34"
              style={{ flex: 1 }}
            />
          </View>
          {/* <FullWidthButton
            title="Coaches Corner"
            icon="whistle"
            backgroundColor="#000"
            iconColor="#E0AE43"
            route={'/(tabs)/home/coachescorner'}
            style={{
              borderColor: '#000',
              alignItems: 'center',
              width: 'auto',
              marginTop: 14,
            }}
          /> */}
        </View>
        <NotificationPrompt />
      </ScrollView>

      {/* Peeking side banner → Evergreen (slides in on focus, then tucks away to a pine-tree peek) */}
      <Animated.View
        style={[styles.evergreenBanner, bannerAnimatedStyle]}
        onLayout={(e) => setBannerWidth(e.nativeEvent.layout.width)}>
        <TouchableOpacity
          style={styles.evergreenBannerInner}
          onPress={onBannerPress}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityLabel="Lobster Pot Merch"
          accessibilityHint="Tap once to reveal, tap again to open Evergreen">
          <MaterialCommunityIcons name="pine-tree" size={18} color="#fff" />
          <CustomText style={styles.evergreenBannerText}>Lobster Pot Merch!</CustomText>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  utilsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  chatCard: {
    backgroundColor: '#f6f6f6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  chatCardContent: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  chatCardText: {
    flex: 1,
    marginRight: 12,
  },
  chatCardTitle: {
    ...typography.textBold,
    marginBottom: 4,
  },
  chatCardSubtitle: {
    color: '#666',
    fontSize: 13,
  },
  chatCardIcon: {
    alignItems: 'center',
    backgroundColor: '#E53935',
    borderRadius: 25,
    paddingLeft: 1,
    paddingTop: 1,
    height: 50,
    justifyContent: 'center',
    width: 50,
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  evergreenBanner: {
    backgroundColor: '#276B5D',
    borderBottomLeftRadius: 14,
    borderTopLeftRadius: 14,
    elevation: 5,
    paddingHorizontal: 14,
    paddingVertical: 12,
    position: 'absolute',
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    top: '66%',
  },
  evergreenBannerInner: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  evergreenBannerText: {
    ...typography.button,
    color: '#fff',
  },
  spacer: {
    height: 40, // Adds some space before the bottom buttons
  },
});
