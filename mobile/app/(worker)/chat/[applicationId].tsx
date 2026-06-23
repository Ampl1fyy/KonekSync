import { useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../../store/authStore';
import ChatScreen from '../../../components/ChatScreen';

export default function WorkerChatScreen() {
  const { applicationId } = useLocalSearchParams<{ applicationId: string }>();
  const { profile } = useAuthStore();

  return (
    <ChatScreen
      applicationId={applicationId}
      currentUserId={profile?.id ?? ''}
      headerTitle="Chat"
    />
  );
}
