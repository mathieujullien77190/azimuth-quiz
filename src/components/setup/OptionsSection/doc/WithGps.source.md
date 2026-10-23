```tsx
import OptionsSection from '@/components/setup/OptionsSection';

// Compass: the `gps` prop adds "Utiliser ma position", and its latitude/longitude fields while off.
<OptionsSection
  disabled={readOnly}
  gps={{
    title: t.setup.toggles.useGps.label,
    description: t.setup.toggles.useGps.description,
    useGps: settings.useGps,
    onToggleUseGps,
    latitude: settings.customLatitude,
    longitude: settings.customLongitude,
    onChangeCustomOrigin,
    ready,
  }}
  options={[
    {
      id: 'showCountry',
      title: t.setup.toggles.showCountry.label,
      description: t.setup.toggles.showCountry.description,
      value: settings.showCountry,
      onChange: onToggleShowCountry,
    },
  ]}
  title={t.setup.optionsTitle}
/>
```
