```tsx
import { HomeScreenView } from '@/screens/HomeScreen/HomeScreenView';

// Le container resout le routeur et le store de demarrage ; la vue ne recoit que des valeurs et des callbacks.
<HomeScreenView
  loading={false}
  onJoin={() => router.push({ pathname: '/setup', params: { join: '1' } })}
  onPlay={() => router.push('/setup')}
  onSettings={() => router.push('/settings')}
  showsBar={false}
/>
```
