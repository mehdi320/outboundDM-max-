import { useCallback, useEffect, useState } from "react";
import type { Log } from "@shared/types";
import { api } from "@/api/client";

export function useLogs(produitId: number | null) {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (produitId == null) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await api.logs.list({ produitId });
    setLogs(data);
    setLoading(false);
  }, [produitId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const removeLog = useCallback(
    async (id: number) => {
      await api.logs.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { logs, loading, refresh, removeLog };
}
