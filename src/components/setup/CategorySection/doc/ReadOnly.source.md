```tsx
import CategorySection from '@/components/setup/CategorySection';
import { CATEGORIES } from '@/data/game';

// A joiner sees the host's choice but can't change it (`disabled`).
<CategorySection
  categories={CATEGORIES}
  disabled
  onToggle={notifyReadOnly}
  selected={hostSettings.categories}
  title={t.setup.categoriesTitle}
/>
```
