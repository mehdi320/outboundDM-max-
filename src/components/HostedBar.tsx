import { useEffect, useState } from "react";
import { IS_ARTIFACT } from "@/api/client";
import { getStorageStatus, onStorageStatus, type StorageStatus } from "@/api/artifactPersistence";

interface DesktopInstall {
  state(): Promise<"available" | "installed" | "unavailable">;
  request(): Promise<string>;
}

const MESSAGES: Partial<Record<StorageStatus, string>> = {
  loading: "Chargement de tes données…",
  unavailable:
    "Stockage indisponible dans cette vue (connecte-toi à claude.ai) : rien de ce que tu fais ici ne sera enregistré.",
  stale: "Tes données ont été modifiées depuis un autre appareil. Recharge la page avant de continuer.",
  error: "Impossible de charger tes données. Recharge la page.",
};

// Barre propre à la version hébergée sur claude.ai : état du stockage et
// installation en application de bureau (app Claude pour ordinateur).
export function HostedBar() {
  const [status, setStatus] = useState<StorageStatus>(getStorageStatus());
  const [install, setInstall] = useState<DesktopInstall | null>(null);

  useEffect(() => {
    if (!IS_ARTIFACT) return;
    const off = onStorageStatus(setStatus);
    window.claude
      ?.use("desktop")
      .then(async (d) => {
        const inst = (d as { install?: DesktopInstall } | null)?.install;
        if (inst && (await inst.state()) === "available") setInstall(inst);
      })
      .catch(() => undefined);
    return () => {
      off();
    };
  }, []);

  if (!IS_ARTIFACT) return null;
  const message = MESSAGES[status];
  if (!message && !install) return null;

  const alert = status === "unavailable" || status === "stale" || status === "error";

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs border-b ${
        alert ? "bg-neg-500/10 border-neg-500/40 text-neg-400" : "bg-base-900 border-base-800 text-base-400"
      }`}
    >
      <span>{message ?? ""}</span>
      <div className="flex gap-2">
        {(status === "stale" || status === "error") && (
          <button
            className="px-3 py-1 rounded bg-amber-600 hover:bg-amber-500 text-base-950 font-semibold"
            onClick={() => window.location.reload()}
          >
            Recharger
          </button>
        )}
        {install && (
          <button
            className="px-3 py-1 rounded border border-base-600 text-base-200 hover:text-amber-400 hover:border-amber-500"
            onClick={() =>
              install
                .request()
                .then((r) => r === "installed" && setInstall(null))
                .catch(() => undefined)
            }
          >
            🖥 Installer comme application
          </button>
        )}
      </div>
    </div>
  );
}
