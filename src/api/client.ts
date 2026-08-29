import type {
  Product,
  NewProduct,
  UpdateProduct,
  Script,
  NewScript,
  Entry,
  NewEntry,
  UpdateEntry,
  Platform,
  BackupPayload,
} from "@shared/types";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Erreur ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  products: {
    list: () => request<Product[]>("/api/products"),
    create: (data: NewProduct) =>
      request<Product>("/api/products", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: UpdateProduct) =>
      request<Product>(`/api/products/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/api/products/${id}`, { method: "DELETE" }),
  },
  scripts: {
    list: (produitId?: number) =>
      request<Script[]>(
        `/api/scripts${produitId ? `?produit_id=${produitId}` : ""}`
      ),
    create: (data: NewScript) =>
      request<Script>("/api/scripts", { method: "POST", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/api/scripts/${id}`, { method: "DELETE" }),
  },
  entries: {
    list: (filters?: { produitId?: number; plateforme?: Platform }) => {
      const params = new URLSearchParams();
      if (filters?.produitId) params.set("produit_id", String(filters.produitId));
      if (filters?.plateforme) params.set("plateforme", filters.plateforme);
      const qs = params.toString();
      return request<Entry[]>(`/api/entries${qs ? `?${qs}` : ""}`);
    },
    create: (data: NewEntry) =>
      request<Entry>("/api/entries", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: UpdateEntry) =>
      request<Entry>(`/api/entries/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/api/entries/${id}`, { method: "DELETE" }),
  },
  exportCsvUrl: () => "/api/export/csv",
  backup: {
    exportJsonUrl: () => "/api/backup/json",
    importJson: (payload: BackupPayload) =>
      request<{ ok: true; products: number; scripts: number; entries: number }>(
        "/api/backup/json",
        { method: "POST", body: JSON.stringify(payload) }
      ),
  },
};
