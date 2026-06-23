import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  Alert, ActivityIndicator, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

type IDType = 'drivers_license' | 'passport' | 'umid';

const ID_OPTIONS: { key: IDType; label: string; requiresBack: boolean }[] = [
  { key: 'drivers_license', label: "Driver's License", requiresBack: true  },
  { key: 'passport',        label: 'Passport',          requiresBack: false },
  { key: 'umid',            label: 'UMID',              requiresBack: true  },
];

export default function KYCScreen() {
  const router = useRouter();
  const { profile, fetchProfile } = useAuthStore();

  const [idType, setIdType]       = useState<IDType>('drivers_license');
  const [frontUri, setFrontUri]   = useState<string | null>(null);
  const [backUri, setBackUri]     = useState<string | null>(null);
  const [tin, setTin]             = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedOption = ID_OPTIONS.find((o) => o.key === idType)!;

  async function pickImage(side: 'front' | 'back') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload your ID.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.75,
    });

    if (!result.canceled && result.assets[0]) {
      if (side === 'front') setFrontUri(result.assets[0].uri);
      else setBackUri(result.assets[0].uri);
    }
  }

  async function uploadImage(uri: string, storagePath: string): Promise<void> {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(storagePath, blob, { contentType: 'image/jpeg', upsert: true });

    if (error) throw new Error(`Upload failed: ${error.message}`);
  }

  async function handleSubmit() {
    if (!profile) return;

    if (!frontUri) {
      Alert.alert('Required', 'Please upload a photo of the front of your ID.');
      return;
    }
    if (selectedOption.requiresBack && !backUri) {
      Alert.alert('Required', 'Please upload a photo of the back of your ID.');
      return;
    }
    if (!tin.trim()) {
      Alert.alert('Required', 'Please enter your TIN (Tax Identification Number).');
      return;
    }

    setSubmitting(true);
    try {
      const frontPath = `${profile.id}/front.jpg`;
      const backPath  = `${profile.id}/back.jpg`;

      await uploadImage(frontUri, frontPath);
      if (backUri) await uploadImage(backUri, backPath);

      const documentMeta = JSON.stringify({
        id_type: idType,
        front:   frontPath,
        ...(backUri && { back: backPath }),
        tin:     tin.trim(),
      });

      const { error } = await supabase
        .from('profiles')
        .update({ kyc_document_url: documentMeta, kyc_status: 'pending' })
        .eq('id', profile.id);

      if (error) throw new Error(error.message);

      // Refresh local profile so the banner on the profile screen updates
      await fetchProfile(profile.id);

      Alert.alert(
        'Documents Submitted',
        'Our team will review your identity within 1–2 business days. You will be notified of the result.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: unknown) {
      Alert.alert('Submission Failed', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <View className="flex-1 bg-gray-50">
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-3">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-800">Verify Your Identity</Text>
        <Text className="text-sm text-gray-500 mt-1">
          Verification unlocks higher-paying shifts and builds your trust score.
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Step 1 — ID Type */}
        <SectionHeader step={1} title="Government ID Type" />
        <View className="bg-white rounded-2xl p-4 mb-5 gap-y-2">
          {ID_OPTIONS.map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                setIdType(key);
                setBackUri(null); // reset back photo when ID type changes
              }}
              className={`flex-row items-center px-4 py-3 rounded-xl border ${
                idType === key ? 'bg-primary-50 border-primary-600' : 'border-gray-200'
              }`}
            >
              <View
                className={`w-4 h-4 rounded-full border-2 mr-3 ${
                  idType === key ? 'bg-primary-600 border-primary-600' : 'border-gray-300'
                }`}
              />
              <Text
                className={`font-medium ${
                  idType === key ? 'text-primary-700' : 'text-gray-700'
                }`}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Step 2 — Photos */}
        <SectionHeader step={2} title="Upload ID Photos" />
        <View className="bg-white rounded-2xl p-4 mb-1">
          <Text className="text-xs text-gray-400 mb-4">
            Ensure the ID is fully visible, well-lit, and unobstructed.
          </Text>
          <View className="gap-y-4">
            <PhotoPicker
              label="Front of ID"
              uri={frontUri}
              onPick={() => pickImage('front')}
            />
            {selectedOption.requiresBack && (
              <PhotoPicker
                label="Back of ID"
                uri={backUri}
                onPick={() => pickImage('back')}
              />
            )}
          </View>
        </View>
        <Text className="text-xs text-gray-400 px-1 mb-5">
          Maximum file size: 5 MB per photo.
        </Text>

        {/* Step 3 — TIN */}
        <SectionHeader step={3} title="Tax Identification Number (TIN)" />
        <View className="bg-white rounded-2xl p-4 mb-5">
          <TextInput
            className="border border-gray-200 rounded-xl px-4 py-3 text-base"
            placeholder="e.g. 123-456-789"
            value={tin}
            onChangeText={setTin}
            keyboardType="numbers-and-punctuation"
            maxLength={20}
          />
          <Text className="text-xs text-gray-400 mt-2">
            Required for payroll compliance under DOLE guidelines.
          </Text>
        </View>

        {/* Privacy note */}
        <View className="bg-blue-50 rounded-2xl p-4 mb-6">
          <Text className="text-xs text-blue-700 leading-5">
            🔒  Your documents are encrypted and stored in a private, access-controlled vault.
            They are only reviewed by our verification team and are never visible to businesses
            or any third party.
          </Text>
        </View>

        <TouchableOpacity
          className={`rounded-xl py-4 items-center mb-8 ${submitting ? 'bg-gray-300' : 'bg-primary-600'}`}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Submit for Verification
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ─── Local sub-components ─────────────────────────────────────────────────────

function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <View className="flex-row items-center gap-x-2 mb-3">
      <View className="w-6 h-6 bg-primary-600 rounded-full items-center justify-center">
        <Text className="text-white text-xs font-bold">{step}</Text>
      </View>
      <Text className="font-semibold text-gray-800">{title}</Text>
    </View>
  );
}

function PhotoPicker({
  label, uri, onPick,
}: {
  label: string;
  uri: string | null;
  onPick: () => void;
}) {
  return (
    <View>
      <Text className="text-sm font-medium text-gray-700 mb-2">{label}</Text>
      <TouchableOpacity
        onPress={onPick}
        className={`border-2 border-dashed rounded-2xl overflow-hidden items-center justify-center ${
          uri ? 'border-primary-300' : 'border-gray-300'
        }`}
        style={{ height: 140 }}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View className="items-center">
            <Text className="text-3xl mb-1">📷</Text>
            <Text className="text-sm text-gray-500">Tap to select photo</Text>
          </View>
        )}
      </TouchableOpacity>
      {uri && (
        <TouchableOpacity onPress={onPick} className="mt-1">
          <Text className="text-xs text-primary-600 text-right">Replace photo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
