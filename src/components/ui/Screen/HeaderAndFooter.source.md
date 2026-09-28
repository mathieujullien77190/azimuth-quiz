```tsx
import Screen from '@/components/ui/Screen';

// `header` and `footer` sit outside the ScrollView, so they stay visible; the children scroll.
<Screen footer={<Button label={t.game.validate} onPress={submit} />} header={<GameHeader {...headerProps} />}>
  <PlaceCard place={place} showCountry={showCountry} />
</Screen>
```
