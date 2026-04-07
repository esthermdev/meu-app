import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { fonts, fontSizes } from '@/constants/Typography';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { initialWindowMetrics, useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatInputProps {
  onSend: (content: string | null, imageUrl: string | null) => Promise<void>;
  onPickImage: () => Promise<string | null>;
  uploading: boolean;
  onClear?: () => Promise<void>;
  safeAreaBottom?: boolean;
}

export default function ChatInput({ onSend, onPickImage, uploading, onClear, safeAreaBottom = true }: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  // Use initialWindowMetrics as fallback for Android devices where
  // useSafeAreaInsets returns 0 incorrectly (Pixel 9 / Android 15+)
  const bottomInset =
    Platform.OS === 'android' ? Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0) : insets.bottom;

  // Track keyboard on iOS for padding animation, and on Android to drop nav bar inset
  useEffect(() => {
    if (Platform.OS === 'ios') {
      const showSub = Keyboard.addListener('keyboardWillShow', () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardOpen(true);
      });
      const hideSub = Keyboard.addListener('keyboardWillHide', () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardOpen(false);
      });
      return () => {
        showSub.remove();
        hideSub.remove();
      };
    }
    // Android: use Did events (Will events don't fire on Android)
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardOpen(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardOpen(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed && !uploading) return;
    setSending(true);
    try {
      await onSend(trimmed || null, null);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const handleImagePick = async () => {
    const imageUrl = await onPickImage();
    if (imageUrl) {
      setSending(true);
      try {
        // Send image with any existing text as caption
        const caption = text.trim() || null;
        await onSend(caption, imageUrl);
        setText('');
      } finally {
        setSending(false);
      }
    }
  };

  const handleClear = () => {
    if (!onClear) return;
    Alert.alert('Clear Messages', 'Are you sure you want to delete all messages in this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear All', style: 'destructive', onPress: onClear },
    ]);
  };

  const isDisabled = sending || uploading;

  const getBottomPadding = () => {
    if (!safeAreaBottom) return 8;
    // When keyboard is open, nav bar is behind keyboard — no inset needed
    if (keyboardOpen) return 8;
    // Keyboard closed: apply safe area for nav bar / home indicator
    return Math.max(bottomInset, 8);
  };

  return (
    <View style={[styles.container, { paddingBottom: getBottomPadding() }]}>
      <TouchableOpacity style={styles.iconButton} onPress={handleImagePick} disabled={isDisabled}>
        {uploading ? (
          <ActivityIndicator size="small" color="#EA1D25" />
        ) : (
          <MaterialCommunityIcons name="image-plus" size={24} color="#EA1D25" />
        )}
      </TouchableOpacity>

      {onClear && (
        <TouchableOpacity style={styles.iconButton} onPress={handleClear} disabled={isDisabled}>
          <MaterialCommunityIcons name="delete-outline" size={22} color="#999" />
        </TouchableOpacity>
      )}

      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor="#999"
        multiline
        maxLength={1000}
        editable={!isDisabled}
      />

      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || isDisabled) && styles.sendButtonDisabled]}
        onPress={handleSend}
        disabled={!text.trim() || isDisabled}>
        {sending ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <MaterialCommunityIcons name="send" size={20} color="#fff" />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  iconButton: {
    alignItems: 'center',
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
    maxHeight: 100,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
});
