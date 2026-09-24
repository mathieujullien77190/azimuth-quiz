export type SortKey = 'name' | 'countryName' | 'code' | 'lat' | 'lon';

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

export type SaveState = { index: number; field: Field; status: 'saving' | 'saved' | 'error'; message?: string };
