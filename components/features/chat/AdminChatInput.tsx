import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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

interface AdminChatInputProps {
  onSend: (content: string | null, imageUrl: string | null) => Promise<void>;
  onPickImage: () => Promise<string | null>;
  uploading: boolean;
}

export default function AdminChatInput({ onSend, onPickImage, uploading }: AdminChatInputProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const inputRef = useRef<TextInput>(null);

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

    const showSub = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardOpen(true);
      setKeyboardHeight(event.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpen(false);
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || sending || uploading) return;
    const wasInputFocused = inputRef.current?.isFocused() ?? false;

    setSending(true);
    try {
      await onSend(trimmed, null);
      setText('');
    } finally {
      setSending(false);
      if (wasInputFocused) {
        requestAnimationFrame(() => inputRef.current?.focus());
      }
    }
  };

  const handleImagePick = async () => {
    if (sending || uploading) return;
    const imageUrl = await onPickImage();
    if (!imageUrl) return;

    setSending(true);
    try {
      const caption = text.trim() || null;
      await onSend(caption, imageUrl);
      setText('');
    } finally {
      setSending(false);
    }
  };

  const isDisabled = sending || uploading;
  const bottomInset =
    Platform.OS === 'android'
      ? Math.max(insets.bottom, initialWindowMetrics?.insets.bottom ?? 0, 8)
      : Math.max(insets.bottom, 8);
  const bottomPadding = keyboardOpen ? (Platform.OS === 'android' ? 57 : 8) : bottomInset;
  const keyboardLift = Platform.OS === 'android' ? keyboardHeight : 0;

  return (
    <View style={[styles.container, { marginBottom: keyboardLift, paddingBottom: bottomPadding }]}>
      <TouchableOpacity style={styles.iconButton} onPress={handleImagePick} disabled={isDisabled}>
        {uploading ? (
          <ActivityIndicator size="small" color="#EA1D25" />
        ) : (
          <MaterialCommunityIcons name="image-plus" size={24} color="#EA1D25" />
        )}
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor="#999"
        multiline
        blurOnSubmit={false}
        maxLength={1000}
        editable={!uploading}
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
