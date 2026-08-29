import type { Platform } from "@shared/types";
import { PLATFORMS } from "@shared/types";

interface Props {
  value: Platform | "Toutes";
  onChange: (value: Platform | "Toutes") => void;
}

export function PlatformFilter({ value, onChange }: Props) {
  const options: (Platform | "Toutes")[] = ["Toutes", ...PLATFORMS];

  return (
    <div className="flex items-center gap-1 bg-base-900 border border-base-700 rounded-md p-1">
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onChange(opt)}
          className={`text-xs px-3 py-1.5 rounded font-medium transition-colors ${
            value === opt
              ? "bg-amber-600 text-base-950"
              : "text-base-300 hover:text-base-100 hover:bg-base-800"
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}
