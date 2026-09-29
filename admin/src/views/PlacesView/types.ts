export type Field =
  | 'category'
  | 'difficulty'
  | 'description'
  | 'position'
  | 'population'
  | 'climate'
  | 'elevation'
  | 'timezone'
  | 'airport'
  | 'emojis';

export type SaveState = { key: string; field: Field; status: 'saving' | 'saved' | 'error'; message?: string };
