import { useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

export function useChatImageUpload(conversationId: string | null) {
  const [uploading, setUploading] = useState(false);

  const pickAndUploadImage = async (): Promise<string | null> => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library to send images.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return null;

    const asset = result.assets[0];
    const fileExt = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const fileName = `${conversationId ?? 'pending'}/${Date.now()}.${fileExt}`;

    setUploading(true);
    try {
      // Use FormData approach for React Native (fetch blob is unreliable)
      const formData = new FormData();
      formData.append('file', {
        uri: asset.uri,
        name: `${Date.now()}.${fileExt}`,
        type: asset.mimeType ?? `image/${fileExt}`,
      } as any);

      const { error: uploadError } = await supabase.storage.from('chat-images').upload(fileName, formData, {
        contentType: 'multipart/form-data',
        upsert: false,
      });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        Alert.alert('Upload failed', 'Could not upload image. Please try again.');
        return null;
      }

      const { data: urlData } = supabase.storage.from('chat-images').getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      Alert.alert('Upload failed', 'Could not upload image. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { pickAndUploadImage, uploading };
}
