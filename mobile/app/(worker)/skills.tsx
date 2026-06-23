/**
 * Worker skill management screen.
 * Workers select skills from the global list and optionally upload a
 * certification document for each skill to earn the "Certified" badge.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Alert,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import type { Skill, Certification } from '../../types';

export default function SkillsScreen() {
  const router   = useRouter();
  const { profile } = useAuthStore();

  const [allSkills,  setAllSkills]  = useState<Skill[]>([]);
  const [myCerts,    setMyCerts]    = useState<Certification[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [uploading,  setUploading]  = useState<number | null>(null); // skill_id being uploaded

  const load = useCallback(async () => {
    if (!profile) return;
    const [{ data: skills }, { data: certs }] = await Promise.all([
      supabase.from('skills').select('*').order('category').order('name'),
      supabase.from('certifications').select('*').eq('worker_id', profile.id),
    ]);
    setAllSkills(skills ?? []);
    setMyCerts(certs ?? []);
    setLoading(false);
  }, [profile]);

  useEffect(() => { load(); }, [load]);

  function certForSkill(skillId: number): Certification | undefined {
    return myCerts.find((c) => c.skill_id === skillId);
  }

  async function handleUploadCert(skill: Skill) {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.75,
      allowsEditing: true,
      aspect: [4, 3],
    });
    if (result.canceled || !result.assets[0] || !profile) return;

    setUploading(skill.id);
    try {
      const asset    = result.assets[0];
      const ext      = asset.uri.split('.').pop() ?? 'jpg';
      const path     = `${profile.id}/${skill.id}.${ext}`;
      const response = await fetch(asset.uri);
      const blob     = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('certifications')
        .upload(path, blob, { contentType: `image/${ext}`, upsert: true });

      if (uploadError) throw uploadError;

      const { error: upsertError } = await supabase
        .from('certifications')
        .upsert({
          worker_id:   profile.id,
          skill_id:    skill.id,
          file_path:   path,
          is_verified: false,
        }, { onConflict: 'worker_id,skill_id' });

      if (upsertError) throw upsertError;

      await load();
      Alert.alert('Uploaded', `Your certificate for ${skill.name} is under review.`);
    } catch (e: unknown) {
      Alert.alert('Upload Failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setUploading(null);
    }
  }

  async function handleRemoveCert(cert: Certification) {
    Alert.alert('Remove Certificate', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          await supabase.storage.from('certifications').remove([cert.file_path]);
          await supabase.from('certifications').delete().eq('id', cert.id);
          await load();
        },
      },
    ]);
  }

  // Group skills by category for display
  const categories = [...new Set(allSkills.map((s) => s.category))];

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator color="#4F46E5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-5 pt-14 pb-4 border-b border-gray-100">
        <TouchableOpacity onPress={() => router.back()} className="mb-2">
          <Text className="text-primary-600 font-medium">← Back</Text>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-gray-800">My Skills</Text>
        <Text className="text-sm text-gray-500 mt-0.5">
          Upload certificates to earn the Certified badge
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {categories.map((category) => (
          <View key={category} className="mb-5">
            <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {category}
            </Text>
            <View className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              {allSkills
                .filter((s) => s.category === category)
                .map((skill, idx, arr) => {
                  const cert    = certForSkill(skill.id);
                  const isLast  = idx === arr.length - 1;
                  const busy    = uploading === skill.id;

                  return (
                    <View
                      key={skill.id}
                      className={`px-4 py-3.5 flex-row items-center justify-between ${
                        !isLast ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      <View className="flex-1 mr-3">
                        <Text className="text-sm font-medium text-gray-800">{skill.name}</Text>
                        {cert && (
                          <CertStatusBadge isVerified={cert.is_verified} />
                        )}
                      </View>

                      {cert ? (
                        <TouchableOpacity
                          onPress={() => handleRemoveCert(cert)}
                          className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50"
                        >
                          <Text className="text-xs text-red-500 font-medium">Remove</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleUploadCert(skill)}
                          disabled={busy}
                          className="px-3 py-1.5 rounded-lg border border-primary-200 bg-primary-50"
                        >
                          {busy ? (
                            <ActivityIndicator size="small" color="#4F46E5" />
                          ) : (
                            <Text className="text-xs text-primary-600 font-medium">+ Cert</Text>
                          )}
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                })}
            </View>
          </View>
        ))}

        {categories.length === 0 && (
          <View className="items-center py-16">
            <Text className="text-3xl mb-2">🛠️</Text>
            <Text className="text-gray-500">No skills available yet.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function CertStatusBadge({ isVerified }: { isVerified: boolean }) {
  return isVerified ? (
    <Text className="text-xs text-green-600 font-medium mt-0.5">✓ Verified</Text>
  ) : (
    <Text className="text-xs text-amber-500 font-medium mt-0.5">⏳ Pending review</Text>
  );
}
