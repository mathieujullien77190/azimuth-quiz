```tsx
import CategorySection from '@/components/setup/CategorySection';
import { CLUE_CATEGORIES } from '@/games/clues/constants';

// Each game passes the categories its own pool actually offers.
<CategorySection
  categories={CLUE_CATEGORIES}
  disabled={readOnly}
  hint={t.setup.categoriesAvailability(available)}
  onToggle={toggleCategory}
  selected={settings.categories}
  title={t.setup.categoriesTitle}
/>
```
