// app/(tabs)/home/index.tsx
import { View, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LargeCardButton from '@/components/buttons/LargeCardButton';
import FullWidthButton from '@/components/buttons/FullWidthButton';
import WaterRequestModal from '@/components/features/modals/WaterRequestModal';
import MyGamesButtonBackground from '@/components/MyGamesButtonBackground';
import CartRequestModal from '@/components/features/modals/CartRequestModal';
import CircleIconButton from '@/components/buttons/CircleIconButton';
import TrainerRequestModal from '@/components/features/modals/TrainerRequestModal';
import NotificationPrompt from '@/components/features/notifications/NotificationPrompt';

export default function HomeScreen() {

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large card buttons at the top */}
        {/* My Games Button with Custom Background */}
        <View style={{ gap: 10 }}>
          <LargeCardButton
            title="My Gamesss"
            subtitle=""
            route="/(tabs)/home/mygames"
            renderCustomBackground={() => <MyGamesButtonBackground title="My Games" />}
          />
        
          <View style={styles.row}>
            <LargeCardButton
              title='Spirit'
              subtitle=''
              icon={<MaterialCommunityIcons name="handshake-outline" size={28} color="#fff" />}
              backgroundColor="#E0AE43"
              route='/(tabs)/home/spirit'
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
          <CircleIconButton 
            icon='map'
            label='Field Map'
            route="/(tabs)/home/fieldmap"
          />
          <TrainerRequestModal />
          <CartRequestModal />
          <WaterRequestModal />
        </View>

        {/* Spacer to push content down */}
        <View style={styles.spacer} />
        {/* Bottom full-width buttons */}
        <View style={styles.bottomButtons}>
          <FullWidthButton
            title="Volunteers"
            icon="crowd"
            backgroundColor="#"
            iconColor='#4357AD'
            route="/(tabs)/home/volunteers"
            style={{ flex: 1 }}
          />

          <FullWidthButton
            title="Donation"
            icon="heart"
            backgroundColor="#fff"
            iconColor='#FE0000'
            route='https://www.paypal.com/donate/?hosted_button_id=3HCQBB97LCV34'
            style={{ flex: 1 }}
          />
        </View>
        <FullWidthButton 
          title='Coaches Corner'
          icon='whistle'
          backgroundColor='#000'
          iconColor='#E0AE43'
          route={'/(tabs)/home/coachescorner'}
          style={{ borderColor: '#000', alignItems: 'center', width: 'auto', marginTop: 14 }}
        />
        <NotificationPrompt />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1, // This allows the content to grow to fill available space
    padding: 20,
    justifyContent: 'space-between',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10
  },
  utilsContainer: {
    flexDirection: 'row',
    paddingVertical: 15,
    justifyContent: 'space-between',
  },
  spacer: {
    height: 40, // Adds some space before the bottom buttons
  },
  bottomButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
  },
});