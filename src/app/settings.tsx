import { useRouter } from 'expo-router';

import { goBackOrHome } from '@/helpers/goBack';

import SettingsScreen from '@/components/SettingsScreen';

const SettingsRoute = () => {
  const router = useRouter();
  return <SettingsScreen onBack={() => goBackOrHome(router)} />;
};

export default SettingsRoute;
