import { useCallback, useEffect, useState } from "react";
import type { Product } from "@shared/types";
import { api } from "@/api/client";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.products.list();
      setProducts(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const createProduct = useCallback(
    async (nom: string) => {
      const product = await api.products.create({ nom });
      await refresh();
      return product;
    },
    [refresh]
  );

  const removeProduct = useCallback(
    async (id: number) => {
      await api.products.remove(id);
      await refresh();
    },
    [refresh]
  );

  return { products, loading, error, refresh, createProduct, removeProduct };
}
