/**
 * Incident report screen for workers with active micro-insurance coverage.
 * Accessible from "My Shifts" on any post-checkout approved application.
 */

import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const INCIDENT_TYPES = [
  'On-site injury',
  'Equipment / property damage',
  'Harassment or unsafe environment',
  'Non-payment or underpayment',
  'Business no-show / cancellation',
  'Other',
];

export default function IncidentReportScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const router             = useRouter();
  const { profile }        = useAuthStore();

  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription]   = useState('');
  const [submitting, setSubmitting]      = useState(false);

  async function handleSubmit() {
    if (!selectedType) {
      Alert.alert('Select incident type', 'Please choose the type of incident.');
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert('Add more detail', 'Please describe what happened (at least 10 characters).');
      return;
    }
    if (!profile) return;

    setSubmitting(true);
    const { error } = await supabase.from('incident_reports').insert({
      application_id: applicationId,
      worker_id:      profile.id,
      incident_type:  selectedType,
      description:    description.trim(),
    });
    setSubmitting(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Report Submitted',
        'Our team will review your incident report within 48 hours. You will be notified of any updates.',
        [{ text: 'OK', onPress: () => router.back() }],
      );
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">Report an Incident</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          We take all reports seriously. Our team reviews within 48 hours.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
        {/* Insurance notice */}
        <View className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-5 flex-row">
          <Text className="text-xl mr-3">🛡️</Text>
          <View className="flex-1">
            <Text className="font-semibold text-blue-800 text-sm">MicroShield Coverage Active</Text>
            <Text className="text-xs text-blue-700 mt-0.5 leading-4">
              You are covered up to ₱50,000 for on-site injuries. Submit an incident report to initiate a claim review.
            </Text>
          </View>
        </View>

        {/* Incident type */}
        <View className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-800 mb-3">Type of Incident</Text>
          {INCIDENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedType(type)}
              className={`flex-row items-center py-3 border-b border-gray-50 last:border-0`}
            >
              <View
                className={`w-5 h-5 rounded-full border-2 mr-3 items-center justify-center ${
                  selectedType === type ? 'border-primary-600' : 'border-gray-300'
                }`}
              >
                {selectedType === type && (
                  <View className="w-2.5 h-2.5 rounded-full bg-primary-600" />
                )}
              </View>
              <Text className={`text-sm ${selectedType === type ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View className="bg-white rounded-2xl p-4 mb-6 border border-gray-100">
          <Text className="text-sm font-semibold text-gray-800 mb-2">What Happened?</Text>
          <TextInput
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-base min-h-28"
            placeholder="Describe the incident in detail — when, where, and what occurred..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
          />
          <Text className="text-xs text-gray-400 mt-1 text-right">{description.length}/2000</Text>
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center ${submitting ? 'bg-gray-300' : 'bg-primary-600'}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold">Submit Report</Text>
          )}
        </TouchableOpacity>

        <Text className="text-xs text-gray-400 text-center mt-3 leading-4">
          Submitting a false report may result in account suspension.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
