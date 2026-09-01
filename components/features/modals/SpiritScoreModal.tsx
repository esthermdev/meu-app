import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import CustomText from '@/components/CustomText';
import { typography } from '@/constants/Typography';

import { MaterialCommunityIcons } from '@expo/vector-icons';

interface SpiritScoreModalProps {
  visible: boolean;
  opponentName: string;
  submitting: boolean;
  onSubmit: (score: number, comments: string) => void;
  onClose: () => void;
}

const SCORE_OPTIONS = [
  { value: 5, label: 'Excellent' },
  { value: 4, label: 'Very good' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Not so good' },
  { value: 1, label: 'Poor' },
];

const SpiritScoreModal: React.FC<SpiritScoreModalProps> = ({
  visible,
  opponentName,
  submitting,
  onSubmit,
  onClose,
}) => {
  const [score, setScore] = useState<number | null>(null);
  const [comments, setComments] = useState('');

  // Clear the form each time it opens so a previous game's entry never carries over.
  useEffect(() => {
    if (visible) {
      setScore(null);
      setComments('');
    }
  }, [visible]);

  // A score cannot be edited once saved, so confirm before writing it.
  const confirmSubmit = () => {
    if (score === null) return;

    Alert.alert(
      'Submit spirit score?',
      `You're giving ${opponentName} a ${score} out of 5.\n\nThis cannot be changed once submitted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Submit', style: 'default', onPress: () => onSubmit(score, comments) },
      ],
    );
  };

  return (
    <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.overlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.headerText}>
              <CustomText style={styles.label}>Spirit score for</CustomText>
              <CustomText style={styles.opponent}>{opponentName}</CustomText>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={10} disabled={submitting}>
              <MaterialCommunityIcons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.options}>
              {SCORE_OPTIONS.map((option) => {
                const isSelected = score === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    onPress={() => setScore(option.value)}
                    disabled={submitting}>
                    <View style={[styles.scoreBadge, isSelected && styles.scoreBadgeSelected]}>
                      <CustomText style={[styles.scoreValue, isSelected && styles.scoreValueSelected]}>
                        {option.value}
                      </CustomText>
                    </View>
                    <CustomText style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                      {option.label}
                    </CustomText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TextInput
              style={styles.commentsInput}
              placeholder="Comments (optional)"
              placeholderTextColor="#999"
              value={comments}
              onChangeText={setComments}
              multiline
              maxFontSizeMultiplier={1.1}
              editable={!submitting}
            />
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitButton, (score === null || submitting) && styles.submitButtonDisabled]}
            onPress={confirmSubmit}
            disabled={score === null || submitting}>
            <CustomText style={styles.submitButtonText}>{submitting ? 'Submitting…' : 'Submit Score'}</CustomText>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 5,
    maxHeight: '85%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: '100%',
  },
  header: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  label: {
    ...typography.textXSmall,
    color: '#888',
  },
  opponent: {
    ...typography.heading4,
    color: '#242424',
  },
  options: {
    gap: 8,
  },
  option: {
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    flexDirection: 'row',
    gap: 12,
    padding: 10,
  },
  optionSelected: {
    backgroundColor: '#FDF7EC',
    borderColor: '#E0AE43',
  },
  scoreBadge: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  scoreBadgeSelected: {
    backgroundColor: '#E0AE43',
  },
  scoreValue: {
    ...typography.textLargeBold,
    color: '#666',
  },
  scoreValueSelected: {
    color: '#fff',
  },
  optionLabel: {
    ...typography.textMedium,
    color: '#444',
  },
  optionLabelSelected: {
    color: '#242424',
  },
  commentsInput: {
    ...typography.text,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    color: '#242424',
    marginTop: 12,
    minHeight: 70,
    padding: 12,
    textAlignVertical: 'top',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#E0AE43',
    borderRadius: 8,
    marginTop: 16,
    padding: 14,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    ...typography.button,
    color: '#fff',
  },
});

export default SpiritScoreModal;
