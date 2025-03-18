// announcements.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

const AnnouncementScreen = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Send Announcement</Text>
        <Text style={styles.description}>
          This will send a push notification to all users and appear in the announcements section.
        </Text>
        
        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter title"
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
        
        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#333243',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontFamily: 'GeistBold',
    marginBottom: 10,
    color: '#fff'
  },
  description: {
    fontSize: 14,
    fontFamily: 'GeistRegular',
    marginBottom: 20,
    color: '#ccc'
  },
  label: {
    fontSize: 16,
    fontFamily: 'GeistMedium',
    marginBottom: 5,
    color: '#fff'
  },
  input: {
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontFamily: 'GeistRegular',
  },
  messageInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: '#EA1D25',
    padding: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
  },
  submitButtonText: {
    color: 'white',
    fontFamily: 'GeistBold',
    fontSize: 16,
  },
});

export default AnnouncementScreen;