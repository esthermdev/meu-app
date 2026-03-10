import { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import LoadingIndicator from '@/components/LoadingIndicator';
import { images } from '@/constants';
const FieldMap = () => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {loading && <LoadingIndicator message="Loading map..." />}
      <ScrollView contentContainerStyle={styles.scrollContainer} maximumZoomScale={3}>
        <Image
          source={images.fieldMap}
          resizeMode="contain"
          style={styles.image}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          fadeDuration={300}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  image: {
    height: '100%',
    width: '100%',
  },
  loadingContainer: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  scrollContainer: {
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'center',
  },
});

export default FieldMap;
