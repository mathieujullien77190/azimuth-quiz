```tsx
import OptionsSection from '@/components/setup/OptionsSection';

// `hidden` skips an option without removing it from the array: "hide other answers" only means
// something with two or more players.
<OptionsSection
  options={[
    {
      id: 'hideOtherAnswers',
      title: t.setup.toggles.hideOtherAnswers.label,
      description: t.setup.toggles.hideOtherAnswers.description,
      value: settings.hideOtherAnswers,
      onChange: onToggleHideOtherAnswers,
      hidden: connectedPlayers.length <= 1,
    },
  ]}
  title={t.setup.optionsTitle}
/>
```
