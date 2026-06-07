"use client";

type Props = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
};

export function QuantityStepper({
  value,
  min = 1,
  max = 999,
  onChange,
  disabled = false,
  size = "md",
}: Props) {
  const btnClass =
    size === "sm"
      ? "h-8 w-8 text-sm"
      : "h-10 w-10 text-lg";
  const inputClass = size === "sm" ? "w-10 text-sm py-1" : "w-14 text-base py-2";

  function clamp(n: number) {
    return Math.min(max, Math.max(min, n));
  }

  return (
    <div className="inline-flex items-center gap-1">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(clamp(value - 1))}
        className={`${btnClass} rounded-full bg-surface-container-highest font-bold text-primary ring-1 ring-outline-variant/15 disabled:opacity-40`}
      >
        −
      </button>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(clamp(Number(e.target.value) || min))}
        className={`${inputClass} rounded-xl bg-surface-container-highest text-center font-bold ring-1 ring-outline-variant/15`}
      />
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(clamp(value + 1))}
        className={`${btnClass} rounded-full bg-surface-container-highest font-bold text-primary ring-1 ring-outline-variant/15 disabled:opacity-40`}
      >
        +
      </button>
    </div>
  );
}
