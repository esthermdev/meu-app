// app/(tabs)/home/evergreen.tsx
import { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Controls how a product image is cropped inside its card. The image is positioned absolutely
// inside the square card wrapper, so:
//   - width / height: zoom level as a percentage of the wrapper. 100% shows the whole image;
//     larger values crop tighter.
//   - top / bottom / left / right: which edge stays pinned (and by how much). Pin `bottom` and
//     `right` to focus on the bottom-right of the image; use negative values to push further out.
interface ImageCrop {
  width?: `${number}%`;
  height?: `${number}%`;
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

const DEFAULT_CROP: ImageCrop = {
  width: '130%',
  height: '120%',
  bottom: 0,
  right: 0,
};

interface Product {
  id: string;
  name: string;
  description: string;
  image: ImageSourcePropType;
  /** Optional per-image crop override. Falls back to DEFAULT_CROP. */
  crop?: ImageCrop;
}

const ORDER_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSejNuzSx-1FvnOseGjLXDRPw1ocJSsf40CO4aVe1KrUoArUcA/viewform';

const INTRO_IMAGE: Product = {
  id: 'lp26_collection',
  name: 'Lobster Pot 2026 Collection',
  description: 'Lobster Pot 2026 Collection',
  image: require('@/assets/images/lp_merch_26/LP26_Collection.jpg'),
};

const PRODUCT_1: Product[] = [
  {
    id: '1',
    name: 'Colorful Moose',
    description: 'Longsleeves - Colorful Moose',
    image: require('@/assets/images/lp_merch_26/LongSleeves_ColorfulMoose.png'),
    crop: { width: '130%', height: '120%', bottom: 0, right: 0 },
  },
  {
    id: '2',
    name: 'Mt. Katahdin',
    description: 'Shortsleeves - Mt. Katahdin',
    image: require('@/assets/images/lp_merch_26/Shortsleeves_MtKatahdin.png'),
    crop: { width: '100%', height: '130%', bottom: 10, right: 0 },
  },
  {
    id: '3',
    name: 'Lobster At Work X Light Trap',
    description: 'Reversible Tanks - Lobster At Work X Light Trap',
    image: require('@/assets/images/lp_merch_26/ReversibleTanks_LobsterAtWorkXLightTrap.png'),
    crop: { width: '130%', height: '120%', bottom: 0, right: 0 },
  },
  {
    id: '4',
    name: 'Lobster At Work X Light Trap - Back & Front',
    description: 'Reversible Tanks - Front & Back',
    image: require('@/assets/images/lp_merch_26/LAW_LT_4.jpg'),
    crop: { width: '100%', height: '100%' },
  },
];

const PRODUCT_2: Product[] = [
  {
    id: '1',
    name: 'Sunhoodie - Lighthouse Maps',
    description: 'Lighthouse Maps',
    image: require('@/assets/images/lp_merch_26/Sunhoodie_headlights.jpg'),
    crop: { width: '100%', height: '140%', bottom: 0, right: 0 },
  },
  {
    id: '2',
    name: 'Sunhoodie - Lobster Catch',
    description: 'Lobster Catch',
    image: require('@/assets/images/lp_merch_26/Sunhoodie_LobsterCatch.png'),
    crop: { width: '100%', height: '130%', bottom: 0, right: 0 },
  },
  {
    id: '3',
    name: 'Sunhoodie - LP Special Edition',
    description: 'LP Special Edition',
    image: require('@/assets/images/lp_merch_26/Sunhoodie_LP-official.png'),
    crop: { width: '120%', height: '100%', bottom: 10, right: 0 },
  },
];

const PRODUCT_3: Product[] = [
  {
    id: '1',
    name: 'LP Plain Black Pants',
    description: 'Pants - LP Plain Black',
    image: require('@/assets/images/lp_merch_26/Pants_LPPlainBlack.png'),
    crop: { width: '100%', height: '130%', bottom: 0, right: 0 },
  },
  {
    id: '2',
    name: 'LP Plain Black Shorts',
    description: 'Shorts - LP Plain Black',
    image: require('@/assets/images/lp_merch_26/Shorts_LPPlainShorts.png'),
    crop: { width: '130%', height: '120%', bottom: 0, right: 0 },
  },
  {
    id: '3',
    name: 'Underwater Shorts',
    description: 'Shorts - Underwater',
    image: require('@/assets/images/lp_merch_26/Shorts_Underwater.png'),
    crop: { width: '120%', height: '100%', bottom: 0, right: 0 },
  },
  {
    id: '4',
    name: 'String Bags',
    description: 'String Bags - Waterproof',
    image: require('@/assets/images/lp_merch_26/String_bags-waterproof.png'),
    crop: { width: '120%', height: '120%', bottom: 0, right: 0 },
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
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Fit the 3:4 intro image within the content width and ~45% of the screen height.
  const introWidth = Math.min(windowWidth - 40, (windowHeight * 0.45 * 3) / 4);
  const introHeight = (introWidth * 4) / 3;

  const openOrderForm = () => {
    Linking.openURL(ORDER_FORM_URL);
  };

  return (
    <>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.logoCircle}>
          <Image source={require('@/assets/icons/evergreen_meu.png')} style={styles.logo} resizeMode="cover" />
        </View>

        {/* Order button */}
        <TouchableOpacity style={styles.orderButton} onPress={openOrderForm} activeOpacity={0.85}>
          {/* <View style={styles.orderButton}> */}
          <MaterialCommunityIcons name="clipboard-text-outline" size={20} color="#fff" />
          <CustomText style={styles.orderButtonText}>Order Now!</CustomText>
          {/* </View> */}
        </TouchableOpacity>

        {/* Product gallery */}
        <CustomText variant="textSmall" style={styles.sectionHint}>
          Store will close on the 20th of September for online store exclusive items.
        </CustomText>
        <TouchableOpacity
          style={[styles.introImageWrapper, { width: introWidth, height: introHeight }]}
          activeOpacity={0.85}
          onPress={() => setSelected(INTRO_IMAGE)}
          accessibilityRole="imagebutton"
          accessibilityLabel="Lobster Pot 2026 collection overview. Tap to enlarge.">
          <Image source={INTRO_IMAGE.image} style={styles.introImage} resizeMode="contain" />
        </TouchableOpacity>
        <View style={styles.section}>
          <CustomText variant="heading4" style={styles.sectionTitle}>
            Tops
          </CustomText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {PRODUCT_1.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelected(product)}>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={product.image}
                    style={[styles.cardImage, product.crop ?? DEFAULT_CROP]}
                    resizeMode="cover"
                  />
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
            Sunhoodies
          </CustomText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {PRODUCT_2.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelected(product)}>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={product.image}
                    style={[styles.cardImage, product.crop ?? DEFAULT_CROP]}
                    resizeMode="cover"
                  />
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
            Bottoms & String Bags
          </CustomText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.gallery}>
            {PRODUCT_3.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => setSelected(product)}>
                <View style={styles.cardImageWrapper}>
                  <Image
                    source={product.image}
                    style={[styles.cardImage, product.crop ?? DEFAULT_CROP]}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.cardBody}>
                  <CustomText>{product.description}</CustomText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pre-order note */}
        <View style={styles.noteCard}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#276B5D" />
          <CustomText variant="text" style={styles.noteText}>
            Pre-orders are available now. Pick them up in the merch tent at{' '}
            <CustomText style={styles.noteEmphasis}>Lobster Pot (Oct 17/18)</CustomText>.
          </CustomText>
        </View>
      </ScrollView>

      {/* Enlarged image modal */}
      <Modal visible={selected !== null} animationType="fade" onRequestClose={() => setSelected(null)}>
        <GestureHandlerRootView style={styles.modalRoot}>
          <TouchableOpacity
            style={[styles.modalClose, { top: insets.top + 5 }]}
            onPress={() => setSelected(null)}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <MaterialCommunityIcons name="close" size={26} color="#fff" />
          </TouchableOpacity>
          {selected && (
            <>
              <ZoomableImage key={selected.id} source={selected.image} />
              <View style={[styles.modalBody, { paddingBottom: insets.bottom }]}>
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

const CARD_WIDTH = 250;

const styles = StyleSheet.create({
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
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  content: {
    gap: 20,
    padding: 20,
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
  logo: {
    height: '100%',
    width: '100%',
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
  sectionHint: {
    color: '#888',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: '#276B5D',
    textDecorationLine: 'underline',
  },
  introImageWrapper: {
    alignSelf: 'center',
    backgroundColor: '#f4f8f6',
    borderRadius: 14,
    overflow: 'hidden',
  },
  introImage: {
    height: '100%',
    width: '100%',
  },
  gallery: {
    gap: 14,
    paddingRight: 20,
  },
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
  cardImageWrapper: {
    backgroundColor: '#f4f8f6',
    height: CARD_WIDTH,
    overflow: 'hidden',
    width: '100%',
  },
  cardImage: {
    // Size and pinned edges come from each product's `crop` (see ImageCrop / DEFAULT_CROP).
    position: 'absolute',
  },
  cardBody: {
    gap: 4,
    padding: 12,
  },
  modalRoot: {
    backgroundColor: '#000',
    flex: 1,
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
  modalBody: {
    backgroundColor: '#000',
    gap: 6,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalDescription: {
    color: '#f2f2f2',
  },
  modalHint: {
    color: '#8a8a8a',
  },
  cardDescription: {
    color: '#666',
  },
  cardTitle: {
    ...typography.textBold,
    color: '#276B5D',
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
});
