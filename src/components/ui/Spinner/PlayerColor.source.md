```tsx
import Spinner from '@/components/ui/Spinner';

// Next to a player who hasn't answered yet, in their own color.
{pending && !hasAnswered ? <Spinner color={player.color} /> : <View style={[styles.playerDot, { backgroundColor: player.color }]} />}
```
