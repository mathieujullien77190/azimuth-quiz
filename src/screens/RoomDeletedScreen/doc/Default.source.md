```tsx
import { RoomDeletedScreenView } from '@/screens/RoomDeletedScreen/RoomDeletedScreenView';

// Le container choisit le message (par defaut « l'hote a supprime la partie ») et envoie le joueur a l'accueil.
<RoomDeletedScreenView message={message ?? t.setup.online.roomDeletedNotice} onDismiss={() => router.dismissTo('/')} />
```
