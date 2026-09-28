```tsx
import Stat from '@/components/ui/Stat';
import { useTheme } from '@/themes';

const { colors } = useTheme();

<Stat color={colors.success} label="Cap" value={formatBearing(bearing, t.cardinals)} />
```
