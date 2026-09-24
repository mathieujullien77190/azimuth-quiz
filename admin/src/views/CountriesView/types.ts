export type SortKey = 'code' | 'fr' | 'en';

export type Field = 'fr' | 'en' | 'currency' | 'currencySymbol' | 'phoneCode' | 'flag';

export type SaveState = { code: string; field: Field; status: 'saving' | 'saved' | 'error'; message?: string };
