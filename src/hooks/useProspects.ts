import { useCallback, useEffect, useState } from "react";
import type { NewProspect, Prospect, UpdateProspect } from "@shared/types";
import { api } from "@/api/client";

export function useProspects(produitId: number | null) {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (produitId == null) {
      setProspects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const data = await api.prospects.list({ produitId });
    setProspects(data);
    setLoading(false);
  }, [produitId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProspect = useCallback(
    async (data: NewProspect) => {
      const prospect = await api.prospects.create(data);
      await refresh();
      return prospect;
    },
    [refresh]
  );

  const bulkCreateProspects = useCallback(
    async (rows: Omit<NewProspect, "produit_id">[]) => {
      if (produitId == null) throw new Error("Aucun produit sélectionné.");
      const result = await api.prospects.bulkCreate(
        produitId,
        rows.map((r) => ({ ...r, produit_id: produitId }))
      );
      await refresh();
      return result;
    },
    [produitId, refresh]
  );

  const updateProspect = useCallback(
    async (id: number, data: UpdateProspect) => {
      const prospect = await api.prospects.update(id, data);
      await refresh();
      return prospect;
    },
    [refresh]
  );

  const contactProspect = useCallback(
    async (id: number, scriptId: number) => {
      const result = await api.prospects.contact(id, scriptId);
      await refresh();
      return result;
    },
    [refresh]
  );

  const removeProspect = useCallback(
    async (id: number) => {
      await api.prospects.remove(id);
      await refresh();
    },
    [refresh]
  );

  return {
    prospects,
    loading,
    refresh,
    createProspect,
    bulkCreateProspects,
    updateProspect,
    contactProspect,
    removeProspect,
  };
}
