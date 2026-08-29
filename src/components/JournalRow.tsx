import type { Log } from "@shared/types";

interface Props {
  log: Log;
  scriptLabel: string;
  prospectPseudo: string;
  onToggle: (id: number, field: "envoye" | "reponse" | "close", value: boolean) => Promise<unknown>;
  onDelete: (id: number) => Promise<unknown>;
}

function FlagButton({
  active,
  onClick,
  label,
  activeClass,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  activeClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold border transition-colors ${
        active ? `${activeClass} border-transparent` : "border-base-600 text-base-600 hover:border-base-400"
      }`}
      title={label}
    >
      {active ? "✓" : ""}
    </button>
  );
}

export function JournalRow({ log, scriptLabel, prospectPseudo, onToggle, onDelete }: Props) {
  async function handleDelete() {
    if (!confirm("Supprimer ce log ?")) return;
    await onDelete(log.id);
  }

  return (
    <tr className="border-b border-base-800 hover:bg-base-900/50">
      <td className="px-3 py-2 text-base-300 font-mono text-xs">{log.date}</td>
      <td className="px-3 py-2 text-base-100">{prospectPseudo}</td>
      <td className="px-3 py-2 text-base-200">{scriptLabel}</td>
      <td className="px-3 py-2 text-base-300">{log.plateforme}</td>
      <td className="px-3 py-2 text-center">
        <FlagButton
          active={log.envoye}
          onClick={() => onToggle(log.id, "envoye", !log.envoye)}
          label="Envoyé"
          activeClass="bg-pos-cyan text-base-950"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <FlagButton
          active={log.reponse}
          onClick={() => onToggle(log.id, "reponse", !log.reponse)}
          label="Réponse"
          activeClass="bg-amber-500 text-base-950"
        />
      </td>
      <td className="px-3 py-2 text-center">
        <FlagButton
          active={log.close}
          onClick={() => onToggle(log.id, "close", !log.close)}
          label="Closé"
          activeClass="bg-pos-500 text-base-950"
        />
      </td>
      <td className="px-3 py-2 text-base-400 text-xs max-w-[200px] truncate" title={log.note ?? ""}>
        {log.note}
      </td>
      <td className="px-3 py-2 text-right">
        <button className="text-xs text-base-400 hover:text-neg-500" onClick={handleDelete}>
          Supprimer
        </button>
      </td>
    </tr>
  );
}
