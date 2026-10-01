import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Vitest runs without globals: Testing Library cannot register its own cleanup, so unmount after every test here.
afterEach(cleanup);
