"use client";

interface SegmentedProps<T extends string> {
  label: string;
  value: T;
  options: ReadonlyArray<{ id: T; label: string; count?: string }>;
  onChange: (id: T) => void;
}

/** A row of exclusive page tabs, used inside a screen (the main tab bar is separate). */
export function Segmented<T extends string>({ label, value, options, onChange }: SegmentedProps<T>) {
  return (
    <div role="tablist" aria-label={label} className="flex gap-1.5 rounded-2xl border-3 border-line bg-ink p-1.5">
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            data-testid={`seg-${option.id}`}
            onClick={() => onChange(option.id)}
            className={`flex-1 rounded-xl px-2 py-2 font-display text-base transition-colors focus-visible:outline-2 focus-visible:outline-moon ${
              active ? "bg-lantern text-line" : "text-mist"
            }`}
          >
            {option.label}
            {option.count && (
              <span className={`ml-1.5 text-xs ${active ? "text-line/70" : "text-mist/70"}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
