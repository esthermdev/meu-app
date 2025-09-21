// app/(tabs)/home/index.tsx
import { View, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import LargeCardButton from '@/components/buttons/LargeCardButton';
import FullWidthButton from '@/components/buttons/FullWidthButton';
import WaterRequestModal from '@/components/features/requests/WaterRequestModal';
import MyGamesButtonBackground from '@/components/MyGamesButtonBackground';
import CartRequestModal from '@/components/features/requests/CartRequestModal';
import CircleIconButton from '@/components/buttons/CircleIconButton';
import TrainerRequestModal from '@/components/features/requests/TrainerRequestModal';
import NotificationPrompt from '@/components/features/notifications/NotificationPrompt';

export default function HomeScreen() {

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large card buttons at the top */}
        {/* My Games Button with Custom Background */}
        <View style={{ gap: 15 }}>
          <LargeCardButton
            title="My Games"
            subtitle=""
            route="/(tabs)/home/mygames"
            renderCustomBackground={() => <MyGamesButtonBackground title="My Games" />}
          />
        
          <View style={styles.row}>
            <LargeCardButton
              title="Report"
              subtitle="Spirit Scores"
              icon={<MaterialCommunityIcons name="file-cancel" size={28} color="#fff" />}
              backgroundColor="#c3aa8d"
              route="https://docs.google.com/forms/d/15NrrAtvd2mt_RGdpkTYDTYHGXHP0RTiIJEI0GXFwfp4/viewform?edit_requested=true"
              disabled={true}
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
          <WaterRequestModal />
          <CartRequestModal />
          <TrainerRequestModal />
        </View>

        {/* Spacer to push content down */}
        <View style={styles.spacer} />
        {/* Bottom full-width buttons */}
        <View style={styles.bottomButtons}>
          <FullWidthButton
            title="Meet Our Volunteers"
            icon="account-group"
            backgroundColor="#e1f0ec"
            iconColor='#276B5D'
            route="/(tabs)/home/volunteers"
          />
          
          <FullWidthButton
            title="Donation"
            icon="heart"
            backgroundColor="#ffe9e9"
            iconColor='#FE0000'
            route='https://www.paypal.com/donate/?hosted_button_id=3HCQBB97LCV34'
          />
        </View>
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
    gap: 15
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
    gap: 15,
    marginTop: 'auto', // Pushes the buttons to the bottom
  },
});