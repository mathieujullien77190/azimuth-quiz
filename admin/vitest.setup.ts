import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest sans globals : Testing Library ne peut pas enregistrer son nettoyage, on demonte apres chaque test ici.
afterEach(cleanup);
