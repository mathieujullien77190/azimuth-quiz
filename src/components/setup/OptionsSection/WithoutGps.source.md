```tsx
import OptionsSection from '@/components/setup/OptionsSection';

// Clues: one plain on/off option, no starting point to choose.
<OptionsSection
  disabled={readOnly}
  options={[
    {
      id: 'startWithFirstLetter',
      title: t.cluesSetup.toggles.startWithFirstLetter.label,
      description: t.cluesSetup.toggles.startWithFirstLetter.description,
      value: settings.startWithFirstLetter,
      onChange: onToggleStartWithFirstLetter,
    },
  ]}
  title={t.cluesSetup.optionsTitle}
/>
```
