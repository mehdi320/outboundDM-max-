import { useCallback, useEffect, useState } from "react";
import type { Entry, NewEntry, UpdateEntry } from "@shared/types";
import { api } from "@/api/client";

export function useEntries(produitId: number | null) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (produitId == null) {
      setEntries([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await api.entries.list({ produitId });
    setEntries(data);
    setLoading(false);
  }, [produitId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createEntry = useCallback(
    async (data: NewEntry) => {
      const entry = await api.entries.create(data);
      await refresh();
      return entry;
    },
    [refresh]
  );

  const updateEntry = useCallback(
    async (id: number, data: UpdateEntry) => {
      const entry = await api.entries.update(id, data);
      await refresh();
      return entry;
    },
    [refresh]
  );

  const removeEntry = useCallback(
    async (id: number) => {
      await api.entries.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { entries, loading, refresh, createEntry, updateEntry, removeEntry };
}
