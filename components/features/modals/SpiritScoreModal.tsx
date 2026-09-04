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

// Guidance follows the WFDF spirit rubric: "Good" is the expected norm, and
// scores above or below it should reflect something noticeably different.
const SCORE_OPTIONS = [
  {
    value: 5,
    label: 'Excellent',
    description:
      'Truly outstanding, well beyond the norm. They stayed calm and generous under pressure, resolved calls quickly and fairly, and made the game more enjoyable for everyone. Please add comments where applicable.',
  },
  {
    value: 4,
    label: 'Very good',
    description:
      'Better than the norm. They knew the rules well, avoided contentious calls, communicated respectfully and handled any disputes with care.',
  },
  {
    value: 3,
    label: 'Good',
    description:
      'The expected standard for a spirited game. They knew the rules, avoided dangerous contact, and resolved calls fairly and respectfully.',
  },
  {
    value: 2,
    label: 'Not so good',
    description:
      'Below the norm. Some avoidable fouls or contact, disputes that dragged on, or moments of frustration and poor communication, but nothing serious.',
  },
  {
    value: 1,
    label: 'Poor',
    description:
      'Well below the norm. Repeated dangerous play, unfair or intimidating calls, or disrespect towards players. Please add details in the comments so organisers can follow up.',
  },
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
                    disabled={submitting}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}
                    accessibilityLabel={`${option.value} out of 5, ${option.label}`}
                    accessibilityHint={option.description}>
                    <View style={styles.optionRow}>
                      <View style={[styles.scoreBadge, isSelected && styles.scoreBadgeSelected]}>
                        <CustomText style={[styles.scoreValue, isSelected && styles.scoreValueSelected]}>
                          {option.value}
                        </CustomText>
                      </View>
                      <CustomText style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                        {option.label}
                      </CustomText>
                    </View>
                    {/* Only the tapped rating shows its guidance, so the list stays compact. */}
                    {isSelected ? <CustomText style={styles.optionDescription}>{option.description}</CustomText> : null}
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
    backgroundColor: '#F5F5F5',
    borderColor: 'transparent',
    borderRadius: 10,
    borderWidth: 2,
    padding: 10,
  },
  optionSelected: {
    backgroundColor: '#FDF7EC',
    borderColor: '#ED8C22',
  },
  optionRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
  },
  optionDescription: {
    ...typography.textSmall,
    color: '#5C5C5C',
    lineHeight: 19,
    marginTop: 8,
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
    backgroundColor: '#ED8C22',
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
    backgroundColor: '#ED8C22',
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
