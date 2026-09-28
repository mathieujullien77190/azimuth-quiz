```tsx
import PlaceCard from '@/games/compass/components/PlaceCard';

// During the round: the name only; the country stays hidden unless the "aide pays" option is on.
<PlaceCard place={place} showCountry={roomSettings.showCountry} />
```
