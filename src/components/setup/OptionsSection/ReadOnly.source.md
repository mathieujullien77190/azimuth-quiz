```tsx
import OptionsSection from '@/components/setup/OptionsSection';

// A joiner: every toggle is locked; tapping one only raises the "only the host can change" notice.
<OptionsSection disabled options={options} gps={gps} title={t.setup.optionsTitle} />
```
