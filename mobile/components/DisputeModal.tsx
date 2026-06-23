import { useState, useEffect } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import type { Dispute } from '../types';

const DISPUTE_REASONS = [
  'Underpayment / Non-payment',
  'Business cancelled without notice',
  'Unsafe or hostile work conditions',
  'Harassment or misconduct',
  'Inaccurate shift description',
  'Other',
] as const;

const STATUS_STYLES: Record<Dispute['status'], { bg: string; text: string; label: string }> = {
  open:         { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Open'         },
  under_review: { bg: 'bg-blue-100',   text: 'text-blue-700',   label: 'Under Review' },
  resolved:     { bg: 'bg-green-100',  text: 'text-green-700',  label: 'Resolved'     },
  dismissed:    { bg: 'bg-gray-100',   text: 'text-gray-500',   label: 'Dismissed'    },
};

interface Props {
  visible: boolean;
  applicationId: string;
  raisedBy: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function DisputeModal({
  visible, applicationId, raisedBy, onClose, onSubmitted,
}: Props) {
  const [existingDispute, setExistingDispute] = useState<Dispute | null | undefined>(undefined);
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch any existing dispute for this application when the modal opens
  useEffect(() => {
    if (!visible) return;
    setExistingDispute(undefined); // reset to loading state
    supabase
      .from('disputes')
      .select('*')
      .eq('application_id', applicationId)
      .eq('raised_by', raisedBy)
      .maybeSingle()
      .then(({ data }) => setExistingDispute(data));
  }, [visible, applicationId, raisedBy]);

  function handleClose() {
    setReason('');
    setDescription('');
    onClose();
  }

  async function handleSubmit() {
    if (!reason || !description.trim()) {
      Alert.alert('Required', 'Please select a reason and describe the issue.');
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('disputes').insert({
      application_id: applicationId,
      raised_by:      raisedBy,
      reason,
      description:    description.trim(),
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setReason('');
    setDescription('');
    Alert.alert(
      'Dispute Filed',
      'Our team will review your case within 24 hours. We will notify you of any updates.',
    );
    onSubmitted();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className="bg-white rounded-t-3xl px-5 pt-5 pb-10"
          style={{ maxHeight: '92%' }}
        >
          <View className="w-10 h-1 bg-gray-300 rounded-full self-center mb-5" />

          {/* Loading state */}
          {existingDispute === undefined && (
            <View className="items-center py-10">
              <ActivityIndicator color="#4F46E5" />
            </View>
          )}

          {/* Existing dispute view */}
          {existingDispute !== undefined && existingDispute !== null && (
            <ExistingDisputeView dispute={existingDispute} onClose={handleClose} />
          )}

          {/* New dispute form */}
          {existingDispute === null && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text className="text-lg font-bold text-gray-800 mb-1">Report an Issue</Text>
              <Text className="text-sm text-gray-500 mb-5">
                Our team reviews all disputes within 24 hours.
              </Text>

              <Text className="text-sm font-medium text-gray-700 mb-2">Reason</Text>
              <View className="gap-y-2 mb-5">
                {DISPUTE_REASONS.map((r) => (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setReason(r)}
                    className={`flex-row items-center px-4 py-3 rounded-xl border ${
                      reason === r
                        ? 'bg-red-50 border-red-400'
                        : 'border-gray-200'
                    }`}
                  >
                    <View
                      className={`w-4 h-4 rounded-full border-2 mr-3 ${
                        reason === r ? 'bg-red-500 border-red-500' : 'border-gray-300'
                      }`}
                    />
                    <Text
                      className={`text-sm flex-1 ${
                        reason === r ? 'text-red-700 font-medium' : 'text-gray-700'
                      }`}
                    >
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-sm font-medium text-gray-700 mb-2">
                Describe what happened
              </Text>
              <TextInput
                className="border border-gray-200 rounded-xl px-4 py-3 text-base mb-5"
                placeholder="Provide specific details — date, time, what occurred..."
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${
                  reason && description.trim() ? 'bg-red-500' : 'bg-gray-200'
                }`}
                onPress={handleSubmit}
                disabled={!reason || !description.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text
                    className={`font-semibold ${
                      reason && description.trim() ? 'text-white' : 'text-gray-400'
                    }`}
                  >
                    Submit Dispute
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handleClose} className="items-center mt-3 py-2">
                <Text className="text-gray-400 text-sm">Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function ExistingDisputeView({
  dispute, onClose,
}: {
  dispute: Dispute;
  onClose: () => void;
}) {
  const style = STATUS_STYLES[dispute.status];

  return (
    <View>
      <Text className="text-lg font-bold text-gray-800 mb-4">Your Dispute</Text>

      <View className={`rounded-xl px-3 py-1.5 self-start mb-4 ${style.bg}`}>
        <Text className={`text-xs font-semibold ${style.text}`}>{style.label}</Text>
      </View>

      <View className="bg-gray-50 rounded-2xl p-4 mb-4 gap-y-3">
        <View>
          <Text className="text-xs text-gray-400 mb-0.5">Reason</Text>
          <Text className="text-gray-800 font-medium">{dispute.reason}</Text>
        </View>
        {dispute.description ? (
          <View>
            <Text className="text-xs text-gray-400 mb-0.5">Description</Text>
            <Text className="text-gray-700 leading-5">{dispute.description}</Text>
          </View>
        ) : null}
      </View>

      {dispute.resolution_note ? (
        <View className="bg-green-50 border border-green-100 rounded-2xl p-4 mb-4">
          <Text className="text-xs text-green-700 font-semibold mb-1">Admin Resolution</Text>
          <Text className="text-gray-700 leading-5">{dispute.resolution_note}</Text>
        </View>
      ) : (
        <View className="bg-blue-50 rounded-2xl p-4 mb-4">
          <Text className="text-xs text-blue-700 leading-5">
            Our team is reviewing your case. You will be notified when there is an update.
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={onClose}
        className="bg-gray-100 rounded-xl py-4 items-center"
      >
        <Text className="text-gray-700 font-medium">Close</Text>
      </TouchableOpacity>
    </View>
  );
}
