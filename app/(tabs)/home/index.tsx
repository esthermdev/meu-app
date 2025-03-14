// app/(tabs)/home/index.tsx
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import LargeCardButton from '@/components/buttons/LargeCardButton';
import CircleIconButton from '@/components/buttons/CircleIconButton';
import FullWidthButton from '@/components/buttons/FullWidthButton';
import WaterRequestButton from '@/components/buttons/WaterRequestButton';
import MyGamesBackground from '@/components/MyGamesBackground';

// Get screen dimensions
const { height } = Dimensions.get('window');

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
              backgroundImage={require('@/assets/images/background-image.jpg')}
            />
          </View>
        </View>

        {/* Circular icon buttons */}
        <View style={styles.utilsContainer}>
          <WaterRequestButton />
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
            route="/(tabs)/info"
          />
          
          <FullWidthButton
            title="Donation"
            icon="heart"
            backgroundColor="#ffe9e9"
            iconColor='#FE0000'
            route="/(tabs)/info"
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
  },
  spacer: {
    height: 40, // Adds some space before the bottom buttons
  },
  bottomButtons: {
    gap: 10,
    marginTop: 'auto', // Pushes the buttons to the bottom
  },
});