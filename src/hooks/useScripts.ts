import { useCallback, useEffect, useState } from "react";
import type { Script, UpdateScript } from "@shared/types";
import { api } from "@/api/client";

export function useScripts(produitId: number | null) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (produitId == null) {
      setScripts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await api.scripts.list(produitId);
    setScripts(data);
    setLoading(false);
  }, [produitId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createScript = useCallback(
    async (label: string, contenu: string | null) => {
      if (produitId == null) throw new Error("Aucun produit sélectionné.");
      const script = await api.scripts.create({ produit_id: produitId, label, contenu });
      await refresh();
      return script;
    },
    [produitId, refresh]
  );

  const updateScript = useCallback(
    async (id: number, data: UpdateScript) => {
      const script = await api.scripts.update(id, data);
      await refresh();
      return script;
    },
    [refresh]
  );

  const removeScript = useCallback(
    async (id: number) => {
      await api.scripts.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { scripts, loading, refresh, createScript, updateScript, removeScript };
}
