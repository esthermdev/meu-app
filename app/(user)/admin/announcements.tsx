// announcements.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import PrimaryButton from '@/components/buttons/PrimaryButton';
import { typography } from '@/constants/Typography';

const AnnouncementScreen = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!title.trim() || !message.trim()) {
      Alert.alert('Error', 'Please enter both title and message');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('announcement', {
        body: { title, message },
      });

      if (error) throw error;

      // Show success alert with an option to view notifications
      Alert.alert(
        'Success', 
        'Announcement sent successfully',
        [
          { text: 'OK', onPress: () => {
            setTitle('');
            setMessage('');
          }},
        ]
      );
    } catch (error) {
      console.error('Error sending announcement:', error);
      Alert.alert('Error', 'Failed to send announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.content}>           
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Enter subject title"
              placeholderTextColor="#999"
              editable={!loading}
            />
            
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Enter message"
              placeholderTextColor="#999"
              multiline
              editable={!loading}
            />
            
            <PrimaryButton onPress={handleSubmit} title='Post' />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  keyboardAvoidView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    ...typography.bodyMediumBold,
    marginBottom: 8,
    color: '#fff'
  },
  input: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    ...typography.bodyMediumRegular
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
});

export default AnnouncementScreen;