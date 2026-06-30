import { View, Text, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';

export default function AuthLanding() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white px-6 pb-10" style={{ paddingTop: 100 }}>
      <View className="mb-16 items-center">
        <Image
          source={require('../../assets/logo.png')}
          style={{ width: 100, height: 100, marginBottom: 16 }}
          resizeMode="contain"
        />
        <Text className="text-4xl font-bold text-primary-600">KonekSync</Text>
        <Text className="text-gray-500 mt-2 text-base">On-demand shifts, instant pay.</Text>
      </View>

      <Text className="text-xl font-semibold text-gray-800 mb-6">
        How are you using KonekSync?
      </Text>

      <View className="gap-y-4">
        <TouchableOpacity
          className="border-2 border-primary-600 rounded-2xl p-5"
          onPress={() => router.push('/(auth)/login')}
        >
          <Text className="text-primary-600 text-lg font-bold mb-1">Looking for work</Text>
          <Text className="text-gray-500 text-sm">Browse and apply for shifts near you</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-secondary-500 rounded-2xl p-5"
          onPress={() => router.push('/(auth)/business-login')}
        >
          <Text className="text-white text-lg font-bold mb-1">Hiring workers</Text>
          <Text className="text-secondary-100 text-sm">Post shifts and manage your team</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
