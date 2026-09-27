import { useRouter } from 'expo-router';

import GameScreen from '@/games/boussole/components/GameScreen';

const GameRoute = () => {
  const router = useRouter();
  return <GameScreen onQuit={() => router.replace('/')} />;
};

export default GameRoute;
