import { useRouter } from 'expo-router';

import ClueGameScreen from '@/games/clues/screens/ClueGameScreen';

const CluesGameRoute = () => {
  const router = useRouter();
  return <ClueGameScreen onQuit={() => router.replace('/')} />;
};

export default CluesGameRoute;
