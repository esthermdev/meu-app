// app/(tabs)/home/evergreen.tsx
import { useState } from 'react';
import { Image, ImageSourcePropType, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Product {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
}

const PRODUCT_1: Product[] = [
  {
    id: 'jersey_1',
    name: 'Design 1',
    description: 'Teal - Short Sleeve',
    image: require('@/assets/images/jerseys/VL_Em_SS_Front.png'),
  },
  {
    id: 'jersey_2',
    name: 'Design 2',
    description: 'Teal - Tank Top',
    image: require('@/assets/images/jerseys/VL_Teal_Tank.png'),
  },
  {
    id: 'jersey_3',
    name: 'Design 3',
    description: 'Cream - Sunhoodie',
    image: require('@/assets/images/jerseys/VL_Cream_SH_Front.png'),
  },
  {
    id: 'jersey_4',
    name: 'Design 4',
    description: 'Cream - Tank Top',
    image: require('@/assets/images/jerseys/VL_Cream_Tank.png'),
  },
  {
    id: 'jersey_5',
    name: 'Design 5',
    description: 'Dark - Short Sleeve',
    image: require('@/assets/images/jerseys/VL_Dark_SS_Front.png'),
  },
  {
    id: 'jersey_6',
    name: 'Design 6',
    description: 'Orange - Sunhoodie',
    image: require('@/assets/images/jerseys/VL_Orange_SH_Front.png'),
  },
  {
    id: 'jersey_info',
    name: 'Infographic',
    description: 'More info...',
    image: require('@/assets/images/jerseys/VL_Classic_Cover.jpg'),
  },
];

const PRODUCT_2: Product[] = [
  {
    id: 'jersey_1',
    name: 'Design 1',
    description: 'Sunhoodie',
    image: require('@/assets/images/jerseys/LP_SH.png'),
  },
  {
    id: 'jersey_2',
    name: 'Design 2',
    description: 'Tank Top',
    image: require('@/assets/images/jerseys/LP_Tank.png'),
  },
  {
    id: 'jersey_3',
    name: 'Design 3',
    description: 'Shortsleeve',
    image: require('@/assets/images/jerseys/VL_LP_Teaser_Front.png'),
  },
  {
    id: 'jersey_4',
    name: 'Design 4',
    description: 'Back Design',
    image: require('@/assets/images/jerseys/VL_LP_Teaser_Back_v1.png'),
  },
  {
    id: 'jersey_info',
    name: 'Infographic',
    description: 'More info...',
    image: require('@/assets/images/jerseys/Lobsterpot_Cover.jpg'),
  },
];

const PRODUCT_3: Product[] = [
  {
    id: 'jersey_1',
    name: 'Design 1',
    description: 'Tank Top',
    image: require('@/assets/images/jerseys/Headlight_Tank.png'),
  },
  {
    id: 'jersey_2',
    name: 'Design 2',
    description: 'Shortsleeve',
    image: require('@/assets/images/jerseys/VL_Lighthouse_SS_Front.png'),
  },
  {
    id: 'jersey_3',
    name: 'Design 3',
    description: 'Sunhoodie',
    image: require('@/assets/images/jerseys/VL_Lighthouse_SH_Front.png'),
  },
  {
    id: 'jersey_info',
    name: 'Infographic',
    description: 'More info...',
    image: require('@/assets/images/jerseys/Headlight_Cover.jpg'),
  },
];

// Pinch-to-zoom + pan image. Pinch and pan run simultaneously on the UI thread for a smooth,
// lag-free response.
function ZoomableImage({ source }: { source: ImageSourcePropType }) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.max(1, Math.min(savedScale.value * e.scale, 5));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1) {
        scale.value = withTiming(1);
        savedScale.value = 1;
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const gesture = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={styles.zoomContainer}>
        <Animated.Image source={source} style={[styles.zoomImage, animatedStyle]} resizeMode="contain" />
      </Animated.View>
    </GestureDetector>
  );
}

export default function EvergreenScreen() {
  const [selected, setSelected] = useState<Product | null>(null);
  const insets = useSafeAreaInsets();

  // const openOrderForm = () => {
  //   Linking.openURL(ORDER_FORM_URL);
  // };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.logoCircle}>
          <Image source={require('@/assets/icons/evergreen_meu.png')} style={styles.logo} resizeMode="cover" />
        </View>

        {/* Order button */}
        {/* <TouchableOpacity style={styles.orderButton} onPress={openOrderForm} activeOpacity={0.85}> */}
        <View style={styles.orderButton}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#fff" />
          <CustomText style={styles.orderButtonText}>Check out the Merch Tent!</CustomText>
        </View>
        {/* </TouchableOpacity> */}

        {/* Product gallery */}
        <CustomText variant="textSmall" style={styles.sectionHint}>
          Swipe to browse — tap an image to enlarge.
        </CustomText>

        <View style={styles.section}>
          <CustomText variant="heading4" style={styles.sectionTitle}>
            Vacationland Classic
          </CustomText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {PRODUCT_1.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelected(product)}>
                <View style={styles.cardImageWrapper}>
                  <Image source={product.image} style={styles.cardImage} resizeMode="cover" />
                </View>
                <View style={styles.cardBody}>
                  <CustomText>{product.description}</CustomText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <CustomText variant="heading4" style={styles.sectionTitle}>
            Lobster Pot Limited Edition
          </CustomText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {PRODUCT_2.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelected(product)}>
                <View style={styles.cardImageWrapper}>
                  <Image source={product.image} style={styles.cardImage} resizeMode="cover" />
                </View>
                <View style={styles.cardBody}>
                  <CustomText>{product.description}</CustomText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <CustomText variant="heading4" style={styles.sectionTitle}>
            Headlight Lighthouse
          </CustomText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {PRODUCT_3.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelected(product)}>
                <View style={styles.cardImageWrapper}>
                  <Image source={product.image} style={styles.cardImage} resizeMode="cover" />
                </View>
                <View style={styles.cardBody}>
                  <CustomText>{product.description}</CustomText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pre-order note */}
        {/* <View style={styles.noteCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#276B5D" />
          <CustomText variant="text" style={styles.noteText}>
            Pre-orders are available now. Pick them up at{' '}
            <CustomText style={styles.noteEmphasis}>Vacationland (Aug 8/9)</CustomText>.
          </CustomText>
        </View> */}
      </ScrollView>

      {/* Enlarged image modal */}
      <Modal visible={selected !== null} animationType="fade" onRequestClose={() => setSelected(null)}>
        <GestureHandlerRootView style={styles.modalRoot}>
          <TouchableOpacity
            style={[styles.modalClose, { top: insets.top + 12 }]}
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {selected && (
            <>
              <ZoomableImage key={selected.id} source={selected.image} />
              <View style={[styles.modalBody, { paddingBottom: insets.bottom + 20 }]}>
                <CustomText variant="text" style={styles.modalDescription}>
                  {selected.description}
                </CustomText>
                <CustomText variant="caption" style={styles.modalHint}>
                  Pinch to zoom · drag to move.
                </CustomText>
              </View>
            </>
          )}
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const CARD_WIDTH = 260;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderColor: '#eee',
    borderRadius: 14,
    borderWidth: 1,
    elevation: 2,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    width: CARD_WIDTH,
  },
  cardBody: {
    gap: 4,
    padding: 12,
  },
  cardDescription: {
    color: '#666',
  },
  cardImage: {
    height: '100%',
    width: '100%',
  },
  cardImageWrapper: {
    backgroundColor: '#f4f8f6',
    height: CARD_WIDTH,
    width: '100%',
  },
  cardTitle: {
    ...typography.textBold,
    color: '#276B5D',
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
  },
  gallery: {
    gap: 14,
    paddingRight: 20,
  },
  logo: {
    height: '100%',
    width: '100%',
  },
  logoCircle: {
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#f1f0e9',
    borderColor: '#276B5D',
    borderRadius: 20,
    borderWidth: 2,
    height: 80,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 150,
  },
  modalBody: {
    backgroundColor: '#000',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalClose: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    position: 'absolute',
    right: 16,
    width: 40,
    zIndex: 1,
  },
  modalDescription: {
    color: '#f2f2f2',
  },
  modalHint: {
    color: '#8a8a8a',
  },
  modalRoot: {
    backgroundColor: '#000',
    flex: 1,
  },
  noteCard: {
    alignItems: 'flex-start',
    backgroundColor: '#f4f8f6',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 10,
    padding: 16,
  },
  noteEmphasis: {
    ...typography.textBold,
    color: '#276B5D',
  },
  noteText: {
    color: '#444',
    flex: 1,
  },
  orderButton: {
    alignItems: 'center',
    backgroundColor: '#276B5D',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 14,
  },
  orderButtonText: {
    ...typography.button,
    color: '#fff',
  },
  section: {
    gap: 10,
  },
  sectionHint: {
    color: '#888',
  },
  sectionTitle: {
    color: '#276B5D',
    textDecorationLine: 'underline',
  },
  zoomContainer: {
    alignItems: 'center',
    backgroundColor: '#000',
    flex: 1,
    justifyContent: 'center',
    overflow: 'hidden',
    width: '100%',
  },
  zoomImage: {
    height: '100%',
    width: '100%',
  },
});
