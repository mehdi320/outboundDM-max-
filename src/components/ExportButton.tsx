import { api } from "@/api/client";
import { saveFile } from "@/utils/saveFile";
import { localToday } from "@/utils/date";
import { errorMessage, useToast } from "@/components/Toast";

export function ExportButton() {
  const { showError } = useToast();

  async function handleExport() {
    try {
      const csv = await api.exportCsv();
      await saveFile(`dm-prospection-export-${localToday()}.csv`, csv, "text/csv;charset=utf-8");
    } catch (err) {
      showError(errorMessage(err, "Impossible d'exporter le CSV."));
    }
  }

  return (
    <button
      onClick={handleExport}
      className="text-xs px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-amber-400 hover:border-amber-500 transition-colors"
    >
      ⬇ Export CSV
    </button>
  );
}
