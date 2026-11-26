import { useEffect, useState } from "react";

// Remplace window.confirm(), qui ne s'affiche pas dans une page hébergée sur
// claude.ai (il renvoie false sans rien montrer). Usage :
//   if (!(await askConfirm("Supprimer ?"))) return;

interface Pending {
  message: string;
  confirmLabel: string;
  resolve: (ok: boolean) => void;
}

let show: ((p: Pending) => void) | null = null;

export function askConfirm(message: string, confirmLabel = "Supprimer"): Promise<boolean> {
  return new Promise((resolve) => {
    if (!show) {
      resolve(window.confirm(message));
      return;
    }
    show({ message, confirmLabel, resolve });
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    show = setPending;
    return () => {
      show = null;
    };
  }, []);

  useEffect(() => {
    if (!pending) return;
    function onKey(e: KeyboardEvent) {
      e.stopPropagation();
      if (e.key === "Escape") close(false);
      if (e.key === "Enter") close(true);
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  function close(ok: boolean) {
    pending?.resolve(ok);
    setPending(null);
  }

  if (!pending) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
      onClick={() => close(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-md bg-base-850 border border-base-600 rounded-lg p-5 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-base-100 whitespace-pre-line">{pending.message}</p>
        <div className="flex justify-end gap-2">
          <button
            className="text-sm px-3 py-1.5 rounded border border-base-600 text-base-300 hover:text-base-100"
            onClick={() => close(false)}
          >
            Annuler
          </button>
          <button
            autoFocus
            className="text-sm px-3 py-1.5 rounded bg-neg-500 hover:bg-neg-400 text-base-950 font-semibold"
            onClick={() => close(true)}
          >
            {pending.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
