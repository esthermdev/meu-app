// app/(tabs)/home/index.tsx
import { View, StyleSheet, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import LargeCardButton from '@/components/buttons/LargeCardButton';
import FullWidthButton from '@/components/buttons/FullWidthButton';
import WaterRequestButton from '@/components/requests/WaterRequestButton';
import MyGamesBackground from '@/components/MyGamesBackground';
import CartRequestButton from '@/components/requests/CartRequestButton';
import CircleIconButton from '@/components/buttons/CircleIconButton';
import TrainerRequestButton from '@/components/requests/TrainerRequestButton';


export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Large card buttons at the top */}
        {/* My Games Button with Custom Background */}
        <View style={{ gap: 15 }}>
          <LargeCardButton
            title="My Games"
            route="/(tabs)/home/mygames"
            renderCustomBackground={() => <MyGamesBackground title="My Games" />}
          />
        
          <View style={styles.row}>
            <LargeCardButton
              title="Report Spirit Scores"
              icon={<FontAwesome5 name="handshake" size={28} color="#fff" />}
              backgroundColor="#d89647"
              route="/(tabs)/home"
            />
            
            {/* Watch Live button with background image and play button */}
            <LargeCardButton
              title="Watch Live"
              route="/(tabs)/home"
              backgroundImage={require('@/assets/images/background-image.png')}
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
          <WaterRequestButton />
          <CartRequestButton />
          <TrainerRequestButton />
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
    gap: 10,
    marginTop: 'auto', // Pushes the buttons to the bottom
  },
});