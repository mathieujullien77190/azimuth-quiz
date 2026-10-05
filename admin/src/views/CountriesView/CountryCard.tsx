import type { CSSProperties, ReactNode } from 'react';

import { flagEmoji } from '@/helpers/flagEmoji';
import { allContours } from '../../api/contour';
import { FLAG_FONT_FAMILY } from '@/themes/fonts';

import type { CountryPatch, CountryRecord } from '../../api/countries';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS, DIFFICULTY_ORDER } from '../../constants';
import { countryName } from '../../data';
import { EditableValue } from '../../components/EditableValue';
import { ContourEditor } from '../ContourView';

import { FlagEditor } from './FlagEditor';
import type { Difficulty } from '@/types';

import type { Field } from './types';

export type CountryCardProps = {
  row: CountryRecord;
  /** The little "saving / saved / error" flag of one field of this country (see `useCountryEditing`). */
  saveFlagFor: (row: CountryRecord, field: Field) => ReactNode;
  onChange: (row: CountryRecord, field: Field, patch: CountryPatch) => void;
  onDifficultyChange: (row: CountryRecord, difficulty: Difficulty) => void;
  /** The list of neighbors, and the map decor of the Silhouette editor, are shown or hidden from outside: the lists
   * decide how many cards may have them open at once. */
  showNeighbors: boolean;
  onToggleNeighbors: (row: CountryRecord) => void;
  contourExpanded: boolean;
  onToggleContour: (row: CountryRecord) => void;
};

/** One country and everything about it that can be edited: shared by the Countries list and the Monde page's side
 * panel, so both write through the very same handlers (see `useCountryEditing`). */
export const CountryCard = ({
  row,
  saveFlagFor,
  onChange,
  onDifficultyChange,
  showNeighbors,
  onToggleNeighbors,
  contourExpanded,
  onToggleContour,
}: CountryCardProps) => {
  const contourCountry = allContours().find((c) => c.code === row.code);
  return (
    <div className="place-card">
      <div className="place-header">
        <div className="place-identity">
          <span className="place-name">{row.fr}</span>
          <span className="place-meta">{row.code}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto' }}>
          <button
            type="button"
            className="chip"
            aria-pressed={showNeighbors}
            onClick={() => onToggleNeighbors(row)}
          >
            {showNeighbors ? 'Masquer les voisins' : 'Afficher les voisins'}
          </button>
          {row.difficulty !== null && (
            <div className="field-cell">
              <select
                className="field-select"
                aria-label="Difficulté Silhouette"
                style={{ '--tier-color': DIFFICULTY_COLORS[row.difficulty] } as CSSProperties}
                value={row.difficulty}
                onChange={(e) => onDifficultyChange(row, e.target.value as Difficulty)}
              >
                {DIFFICULTY_ORDER.map((d) => (
                  <option key={d} value={d}>
                    {DIFFICULTY_LABELS[d]}
                  </option>
                ))}
              </select>
              {saveFlagFor(row, 'difficulty')}
            </div>
          )}
          {contourCountry && (
            <button
              type="button"
              className="chip"
              aria-pressed={contourExpanded}
              onClick={() => onToggleContour(row)}
            >
              🗺️ Silhouette
            </button>
          )}
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

      {showNeighbors && (
        <div className="neighbors-list">
          {row.neighbors.length === 0 ? (
            <span className="place-meta">Aucun voisin terrestre.</span>
          ) : (
            row.neighbors.map((code) => (
              <span className="neighbor-tag" key={code}>
                <span style={{ fontFamily: FLAG_FONT_FAMILY, fontSize: 18 }}>{flagEmoji(code)}</span>
                {countryName(code)}
                <span className="place-meta">{code}</span>
              </span>
            ))
          )}
        </div>
      )}

      {contourExpanded && contourCountry && (
        <ContourEditor initialCountry={contourCountry} showNeighbors={showNeighbors} />
      )}
    </div>
  );
};
