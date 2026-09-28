```tsx
import CategorySection from '@/components/setup/CategorySection';
import { CATEGORIES } from '@/games/compass/constants';

<CategorySection
  categories={CATEGORIES}
  disabled={readOnly}
  hint={t.setup.categoriesAvailability(available)}
  onToggle={(id) => updateOrNotify(toggleCategoryFilter(settings, id))}
  selected={settings.categories}
  title={t.setup.categoriesTitle}
/>
```
