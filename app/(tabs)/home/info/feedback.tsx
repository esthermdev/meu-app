import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';

import PrimaryButton from '@/components/buttons/PrimaryButton';
import CustomText from '@/components/CustomText';
import { fonts, typography } from '@/constants/Typography';
import { supabase } from '@/lib/supabase';

const FeedbackScreen = () => {
  const [subject, setSubject] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = async () => {
    if (subject.trim() === '' || message.trim() === '') {
      Alert.alert('Error', 'Please fill in both subject and message fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('feedback').insert([{ subject, message, display: true }]);

      if (error) throw error;

      Alert.alert('Success', 'Your feedback has been submitted. Thank you!');
      setSubject('');
      setMessage('');
      console.log('Feedback submitted successfully:', { subject, message });
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      enabled={Platform.OS === 'ios'}
      style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.content}>
            <CustomText style={styles.label}>Subject:</CustomText>
            <TextInput
              style={styles.input}
              value={subject}
              onChangeText={setSubject}
              placeholder="Enter subject"
              placeholderTextColor={'#999'}
              allowFontScaling={false}
            />
            <CustomText style={styles.label}>Message:</CustomText>
            <TextInput
              style={[styles.input, styles.messageInput]}
              value={message}
              onChangeText={setMessage}
              placeholder="Send in your requests or feedback here..."
              multiline
              allowFontScaling={false}
              placeholderTextColor={'#999'}
            />
            <PrimaryButton title="Submit" disabled={isSubmitting} onPress={handleSubmit} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flex: 1,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  label: {
    ...typography.textLargeBold,
    marginBottom: 5,
  },
  input: {
    borderColor: '#ccc',
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 15,
    padding: 10,
    ...typography.text,
  },
  messageInput: {
    height: 150,
    textAlignVertical: 'top',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  noteHeader: {
    fontFamily: fonts.bold,
    fontSize: 16,
    marginBottom: 10,
    marginTop: 20,
  },
  noteText: {
    color: 'gray',
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#EA1D25',
    borderRadius: 100,
    marginBottom: 20,
    padding: 15,
  },
  submitButtonText: {
    color: '#fff',
    fontFamily: fonts.bold,
    fontSize: 16,
  },
});

export default FeedbackScreen;
