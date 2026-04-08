// app/(tabs)/home/index.tsx
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

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

import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen() {
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
              <LargeCardButton
                title="Spirit"
                subtitle=""
                icon={<MaterialCommunityIcons name="handshake-outline" size={28} color="#fff" />}
                backgroundColor="#F7941D"
                route="/(tabs)/home/spirit"
              />

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
            <TrainerRequestModal />
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
  spacer: {
    height: 40, // Adds some space before the bottom buttons
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
  chatCard: {
    backgroundColor: '#edebebff',
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
});
