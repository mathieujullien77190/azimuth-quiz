```tsx
import PlaceCard from '@/components/game/PlaceCard';

// During the round: the name only; the country stays hidden unless the "aide pays" option is on.
<PlaceCard place={place} showCountry={roomSettings.showCountry} />
```
