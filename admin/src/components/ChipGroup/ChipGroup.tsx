export const ChipGroup = <T extends string,>({
  order,
  labels,
  active,
  onToggle,
  colors,
  emojis,
}: {
  order: T[];
  labels: Record<T, string>;
  active: Set<T>;
  onToggle: (key: T) => void;
  colors?: Record<T, string>;
  emojis?: Record<T, string>;
}) => (
  <div className="row">
    {order.map((key) => {
      const isActive = active.has(key);
      const color = colors?.[key];
      return (
        <button
          key={key}
          type="button"
          className="chip"
          aria-pressed={isActive}
          style={color ? ({ '--tier-color': color } as React.CSSProperties) : undefined}
          onClick={() => onToggle(key)}
        >
          {emojis?.[key] !== undefined ? <span>{emojis[key]}</span> : <span className="dot" />}
          {labels[key]}
        </button>
      );
    })}
  </div>
);
