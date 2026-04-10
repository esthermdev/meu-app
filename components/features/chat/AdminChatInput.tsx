import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { UploadImage } from '@/assets/svg';
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

    setText('');
    setSending(true);
    try {
      await onSend(trimmed, null);
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
  const bottomPadding = keyboardOpen ? (Platform.OS === 'android' ? 57 : 0) : bottomInset;
  const keyboardLift = Platform.OS === 'android' ? keyboardHeight : 12;

  return (
    <View style={[styles.wrapper, { marginBottom: keyboardLift }]}>
      {sending && (
        <View style={styles.sendingRow}>
          <ActivityIndicator size="small" color="#EA1D25" />
          <Text style={styles.sendingText}>Sending message...</Text>
        </View>
      )}
      <View style={[styles.container, { paddingBottom: bottomPadding }]}>
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.inputIconButton} onPress={handleImagePick} disabled={isDisabled}>
            {uploading ? (
              <ActivityIndicator size="small" color="#EA1D25" />
            ) : (
              <UploadImage width={16} height={16} color="#000" />
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
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: '#fff',
  },
  sendingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: 6,
  },
  sendingText: {
    color: '#666',
    fontFamily: fonts.regular,
    fontSize: fontSizes.sm,
  },
  container: {
    alignItems: 'flex-end',
    backgroundColor: '#fff',
    borderTopColor: '#E5E5E5',
    borderTopWidth: 1,
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 8,
  },
  inputWrapper: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    marginRight: 8,
    maxHeight: 100,
    minHeight: 40,
    paddingHorizontal: 6,
  },
  inputIconButton: {
    alignItems: 'center',
    alignSelf: 'flex-end',
    justifyContent: 'center',
    height: 36,
    width: 36,
    marginRight: -6,
    marginBottom: 3,
  },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSizes.md,
    paddingHorizontal: 8,
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
