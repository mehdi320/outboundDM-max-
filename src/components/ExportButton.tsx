import { api } from "@/api/client";

export function ExportButton() {
  return (
    <a
      href={api.exportCsvUrl()}
      download
      className="text-xs px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-accent-400 hover:border-accent-500 transition-colors"
    >
      ⬇ Export CSV
    </a>
  );
}
