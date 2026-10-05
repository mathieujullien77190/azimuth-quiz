import type { CSSProperties, ReactNode } from 'react';

import type { CompassPatch, CluesPatch, PlaceRow } from '../../api/places';
import { PersonalityEditor } from './PersonalityEditor';
import { WordplayEditor } from './WordplayEditor';
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
  POSITION_LABELS,
} from '../../constants';
import type { Category, Difficulty } from '@/types';

import { fmtCoord } from './helpers';
import type { Field } from './types';

export type PlaceCardProps = {
  row: PlaceRow;
  /** The little "saving / saved / error" flag of one field of this place (see `usePlaceEditing`). */
  saveFlagFor: (row: PlaceRow, field: Field) => ReactNode;
  onDifficultyChange: (row: PlaceRow, difficulty: Difficulty) => void;
  onCompassChange: (row: PlaceRow, patch: CompassPatch) => void;
  onCluesChange: (row: PlaceRow, patch: CluesPatch) => void;
  onDelete: (row: PlaceRow) => Promise<void>;
};

/** One place and every field of it that can be edited: shared by the Places list and the Monde page's side panel,
 * so both write through the very same handlers (see `usePlaceEditing`). */
export const PlaceCard = ({ row, saveFlagFor, onDifficultyChange, onCompassChange, onCluesChange, onDelete }: PlaceCardProps) => (
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
        <div className="field-cell">
          <select
            className="field-select"
            style={
              { '--tier-color': DIFFICULTY_COLORS[(row.compass ?? row.clues)!.difficulty] } as CSSProperties
            }
            value={(row.compass ?? row.clues)!.difficulty}
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

        <div className="game-block">
          <div className="row panel-header">
            <h3 className="game-title">Clues</h3>
          </div>
          {row.clues ? (
            <table className="kv-table">
              <tbody>
                <tr>
                  <th>Position</th>
                  <td className="muted">{POSITION_LABELS[row.clues.positionInCountry]}</td>
                </tr>
                <tr>
                  <th>Population</th>
                  <td>
                    <EditableValue
                      type="number"
                      value={String(row.clues.population)}
                      display={row.clues.population.toLocaleString('fr-FR')}
                      saveFlag={saveFlagFor(row, 'population')}
                      onSave={(next) => onCluesChange(row, { population: Number(next) })}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Climat</th>
                  <td>
                    <EditableValue
                      value={row.clues.climateEmoji}
                      saveFlag={saveFlagFor(row, 'climate')}
                      onSave={(next) => onCluesChange(row, { climateEmoji: next })}
                    />
                  </td>
                </tr>
                <tr>
                  <th>Altitude</th>
                  <td className="muted">{row.clues.elevationMeters} m</td>
                </tr>
                <tr>
                  <th>Fuseau horaire</th>
                  <td className="muted">{row.clues.timezone}</td>
                </tr>
                <tr>
                  <th>Indicatif</th>
                  <td className="muted">{row.clues.phoneCode}</td>
                </tr>
                <tr>
                  <th>Devise</th>
                  <td className="muted">{row.clues.currency}</td>
                </tr>
                <tr>
                  <th>Aéroport</th>
                  <td className="muted">{row.clues.airportCode}</td>
                </tr>
                <tr>
                  <th>Emojis</th>
                  <td>
                    <EditableValue
                      value={row.clues.emojis.join(' ')}
                      saveFlag={saveFlagFor(row, 'emojis')}
                      onSave={(next) => {
                        const parts = next.split(/\s+/).filter(Boolean);
                        onCluesChange(row, { emojis: [parts[0], parts[1] ?? '', parts[2] ?? ''] });
                      }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            <p className="absent">Absent d’Clues</p>
          )}
          {row.clues && <WordplayEditor initialPlace={row.clues} />}
          {row.clues && <PersonalityEditor initialPlace={row.clues} />}
        </div>
      </div>
    </div>
);
