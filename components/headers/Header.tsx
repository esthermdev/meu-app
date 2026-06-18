import { Image, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Href, router } from 'expo-router';

import { images } from '@/constants';
import { useNotifications } from '@/context/NotificationsProvider';

import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const Header = () => {
  const { unreadCount } = useNotifications();
  const hasUnread = unreadCount > 0;

  const handleInfoPress = () => {
    router.push('/(tabs)/home/info' as Href);
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: '#fff' }}>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.side}>
            <TouchableOpacity onPress={handleInfoPress}>
              <MaterialIcons name="info" size={23} style={{ margin: 3 }} color="#EA1D25" />
            </TouchableOpacity>
          </View>
          <View style={styles.center}>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/home')}>
              <Image source={images.logoW} style={{ width: 40, height: 40 }} />
            </TouchableOpacity>
          </View>
          <View style={[styles.side, { justifyContent: 'flex-end', gap: 10 }]}>
            <TouchableOpacity onPress={() => router.navigate('/(tabs)/home/chat' as Href)}>
              <MaterialCommunityIcons name="chat" size={20} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.navigate('/(tabs)/home/notifications' as Href)}
              style={[styles.bellButton]}>
              <MaterialCommunityIcons
                name={hasUnread ? 'bell-ring' : 'bell'}
                size={20}
                color={hasUnread ? '#f88d3b' : '#000'}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    height: 50,
    paddingHorizontal: 15,
    width: '100%',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  side: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  center: {
    alignItems: 'center',
  },
  bellButton: {
    margin: 6,
    padding: 4,
  },
});

export default Header;
