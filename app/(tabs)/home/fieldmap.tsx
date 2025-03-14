// fieldmap.tsx
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import LoadingIndicator from '@/components/LoadingIndicator';
import { images } from '@/constants';
const FieldMap = () => {
  const [loading, setLoading] = useState(true);

  return (
    <View style={styles.container}>
      {loading && <LoadingIndicator message="Loading map..." />}
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        maximumZoomScale={3}
      >
        <Image
          source={images.fieldMap}
          resizeMode='contain'
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
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  image: {
    width: '100%',
    height: '100%',
  }
});

export default FieldMap;