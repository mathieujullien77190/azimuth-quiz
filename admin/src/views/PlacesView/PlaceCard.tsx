import type { CSSProperties, ReactNode } from 'react';

import type { CompassPatch, PlaceRow } from '../../api/places';
import { DeleteX } from '../../components/DeleteX';
import { DescriptionCell } from '../../components/DescriptionCell';
import { EditableValue } from '../../components/EditableValue';
import { WikiLinks } from '../../components/WikiLinks';
import {
  CATEGORY_COLORS,
  CATEGORY_EMOJIS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  DIFFICULTY_COLORS,
  DIFFICULTY_LABELS,
  DIFFICULTY_ORDER,
} from '../../constants';
import type { Category, Difficulty } from '@/types';

import { fmtCoord } from './helpers';
import type { Field } from './types';

export type PlaceCardProps = {
  row: PlaceRow;
  /** Petit drapeau "enregistrement / ok / erreur" d'un champ du lieu (voir `usePlaceEditing`). */
  saveFlagFor: (row: PlaceRow, field: Field) => ReactNode;
  onDifficultyChange: (row: PlaceRow, difficulty: Difficulty) => void;
  onCompassChange: (row: PlaceRow, patch: CompassPatch) => void;
  onDelete: (row: PlaceRow) => Promise<void>;
};

/**
 * Un lieu et tous ses champs editables, partages par la liste Lieux et le panneau de la page Monde : memes handlers
 * (voir `usePlaceEditing`).
 */
export const PlaceCard = ({ row, saveFlagFor, onDifficultyChange, onCompassChange, onDelete }: PlaceCardProps) => (
    <div className="place-card">
      <div className="place-header">
        <div className="place-identity">
          <span className="place-name">{row.name}</span>
          <span className="place-meta" title={row.country}>
            {row.country} ({row.code})
          </span>
        </div>
        <div className="place-coords">
          <span className="coord">{fmtCoord(row.coordinates.latitude, 'N', 'S')}</span>
          <span className="coord">{fmtCoord(row.coordinates.longitude, 'E', 'O')}</span>
        </div>
        {row.compass && (
          <div className="field-cell">
            <select
              className="field-select"
              style={{ '--tier-color': CATEGORY_COLORS[row.compass.category] } as CSSProperties}
              value={row.compass.category}
              onChange={(e) => onCompassChange(row, { category: e.target.value as Category })}
            >
              {CATEGORY_ORDER.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_EMOJIS[c]} {CATEGORY_LABELS[c]}
                </option>
              ))}
            </select>
            {saveFlagFor(row, 'category')}
          </div>
        )}
        {row.compass && (
          <div className="field-cell">
            <select
              className="field-select"
              style={{ '--tier-color': DIFFICULTY_COLORS[row.compass.difficulty] } as CSSProperties}
              value={row.compass.difficulty}
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
        <DeleteX name={row.name} onDelete={() => onDelete(row)} />
      </div>

      <div className="place-games">
        <div className="game-block">
          <h3 className="game-title">Compass</h3>
          {row.compass ? (
            <table className="kv-table">
              <tbody>
                <tr>
                  <th>Wiki</th>
                  <td>
                    <WikiLinks wikiFr={row.compass.wikiFr} wikiEn={row.compass.wikiEn} />
                  </td>
                </tr>
                <tr>
                  <th>Texte</th>
                  <td>
                    <DescriptionCell
                      value={row.compass.description ?? ''}
                      saveFlag={saveFlagFor(row, 'description')}
                      onSave={(next) => onCompassChange(row, { description: next })}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="absent">Absent de Compass</p>
          )}
        </div>
      </div>
    </div>
);
