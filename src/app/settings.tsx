import { useRouter } from 'expo-router';

import SettingsScreen from '@/components/SettingsScreen';

const SettingsRoute = () => {
  const router = useRouter();
  return <SettingsScreen onBack={() => router.back()} />;
};

export default SettingsRoute;
