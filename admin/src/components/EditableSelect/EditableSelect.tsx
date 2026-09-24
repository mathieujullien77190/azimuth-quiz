import { useState } from 'react';

/** Same idea as `EditableValue` but for an enum value: clicking opens a `<select>`
 * instead of an `<input>`. */
export const EditableSelect = <T extends string,>({
  value,
  options,
  labels,
  saveFlag,
  onSave,
}: {
  value: T;
  options: readonly T[];
  labels: Record<T, string>;
  saveFlag: React.ReactNode;
  onSave: (next: T) => void;
}) => {
  const [editing, setEditing] = useState(false);

  if (!editing) {
    return (
      <button type="button" className="kv-edit-btn" onClick={() => setEditing(true)}>
        {labels[value]}
      </button>
    );
  }

  return (
    <div className="field-cell">
      <select
        className="kv-select"
        autoFocus
        value={value}
        onChange={(e) => {
          onSave(e.target.value as T);
          setEditing(false);
        }}
        onBlur={() => setEditing(false)}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {labels[option]}
          </option>
        ))}
      </select>
      {saveFlag}
    </div>
  );
};
