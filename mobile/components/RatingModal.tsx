import { useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator,
} from 'react-native';

const SCORE_LABELS = ['', 'Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

interface Props {
  visible: boolean;
  /** Display name of the person being rated */
  subjectName: string;
  /** "Worker" or "Business" — shown in the title */
  rateeLabel: string;
  onSubmit: (score: number, comment: string) => Promise<void>;
  onDismiss: () => void;
}

export default function RatingModal({
  visible, subjectName, rateeLabel, onSubmit, onDismiss,
}: Props) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleDismiss() {
    setScore(0);
    setComment('');
    onDismiss();
  }

  async function handleSubmit() {
    if (score === 0 || submitting) return;
    setSubmitting(true);
    await onSubmit(score, comment);
    setSubmitting(false);
    setScore(0);
    setComment('');
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleDismiss}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View className="bg-white rounded-t-3xl px-5 pt-5 pb-10">
          {/* Handle bar */}
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

          <Text className="text-lg font-bold text-gray-800 mb-1">
            Rate this {rateeLabel}
          </Text>
          <Text className="text-sm text-gray-500 mb-6">{subjectName}</Text>

          {/* Star selector */}
          <View className="flex-row justify-center gap-x-4 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setScore(star)}
                hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
              >
                <Text className={`text-4xl ${star <= score ? 'opacity-100' : 'opacity-25'}`}>
                  ⭐
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-center text-sm font-medium text-primary-600 mb-5 h-5">
            {score > 0 ? SCORE_LABELS[score] : ''}
          </Text>

          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-5"
            placeholder="Leave a comment (optional)..."
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={{ minHeight: 80 }}
          />

          <TouchableOpacity
            className={`rounded-xl py-4 items-center ${
              score > 0 ? 'bg-primary-600' : 'bg-gray-200'
            }`}
            onPress={handleSubmit}
            disabled={score === 0 || submitting}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text
                className={`font-semibold ${score > 0 ? 'text-white' : 'text-gray-400'}`}
              >
                Submit Rating
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleDismiss} className="items-center mt-3 py-2">
            <Text className="text-gray-400 text-sm">Skip for now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
