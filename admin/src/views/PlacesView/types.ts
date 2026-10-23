export type Field = 'category' | 'difficulty' | 'description';

export type SaveState = { key: string; field: Field; status: 'saving' | 'saved' | 'error'; message?: string };
