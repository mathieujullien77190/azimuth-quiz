import type { ReactNode } from 'react';

import { flagEmoji } from '@/helpers/flagEmoji';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';

import type { CountryPatch, CountryRecord } from '../../api/countries';
import { EditableValue } from '../../components/EditableValue';

import { FlagEditor } from './FlagEditor';
import type { Field } from './types';

export type CountryCardProps = {
  row: CountryRecord;
  /** The little "saving / saved / error" flag of one field of this country (see `useCountryEditing`). */
  saveFlagFor: (row: CountryRecord, field: Field) => ReactNode;
  onChange: (row: CountryRecord, field: Field, patch: CountryPatch) => void;
};

/** One country and everything about it that can be edited (names, currency, phone code, flag colours): what a place
 * carries a copy of, so a change here is written to the country and to all its places (see `useCountryEditing`). */
export const CountryCard = ({ row, saveFlagFor, onChange }: CountryCardProps) => {
  return (
    <div className="place-card">
      <div className="place-header">
        <div className="place-identity">
          <span className="place-name">{row.fr}</span>
          <span className="place-meta">{row.code}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <span style={{ fontFamily: FLAG_FONT_FAMILY, fontSize: 28 }}>{flagEmoji(row.code)}</span>
        </div>
      </div>

      <table className="kv-table">
        <tbody>
          <tr>
            <th>Nom (FR)</th>
            <td>
              <EditableValue
                value={row.fr}
                saveFlag={saveFlagFor(row, 'fr')}
                onSave={(next) => onChange(row, 'fr', { fr: next })}
              />
            </td>
          </tr>
          <tr>
            <th>Nom (EN)</th>
            <td>
              <EditableValue
                value={row.en}
                saveFlag={saveFlagFor(row, 'en')}
                onSave={(next) => onChange(row, 'en', { en: next })}
              />
            </td>
          </tr>
          <tr>
            <th>Devise</th>
            <td>
              <EditableValue
                value={row.currency ?? ''}
                saveFlag={saveFlagFor(row, 'currency')}
                onSave={(next) => onChange(row, 'currency', { currency: next })}
              />
            </td>
          </tr>
          <tr>
            <th>Symbole</th>
            <td>
              <EditableValue
                value={row.currencySymbol ?? ''}
                saveFlag={saveFlagFor(row, 'currencySymbol')}
                onSave={(next) => onChange(row, 'currencySymbol', { currencySymbol: next })}
              />
            </td>
          </tr>
          <tr>
            <th>Indicatif</th>
            <td>
              <EditableValue
                value={row.phoneCode ?? ''}
                saveFlag={saveFlagFor(row, 'phoneCode')}
                onSave={(next) => onChange(row, 'phoneCode', { phoneCode: next })}
              />
            </td>
          </tr>
          <tr>
            <th>Drapeau</th>
            <td>
              <FlagEditor
                value={row.flag ?? []}
                saveFlag={saveFlagFor(row, 'flag')}
                onSave={(next) => onChange(row, 'flag', { flag: next })}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};
