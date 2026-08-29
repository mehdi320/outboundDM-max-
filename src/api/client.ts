import type {
  Product,
  NewProduct,
  UpdateProduct,
  Script,
  NewScript,
  UpdateScript,
  Prospect,
  NewProspect,
  UpdateProspect,
  Log,
  NewLog,
  UpdateLog,
  Platform,
  Statut,
  ContactResult,
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
      request<Script[]>(`/api/scripts${produitId ? `?produit_id=${produitId}` : ""}`),
    create: (data: NewScript) =>
      request<Script>("/api/scripts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: UpdateScript) =>
      request<Script>(`/api/scripts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/api/scripts/${id}`, { method: "DELETE" }),
  },
  prospects: {
    list: (filters?: { produitId?: number; plateforme?: Platform; statut?: Statut }) => {
      const params = new URLSearchParams();
      if (filters?.produitId) params.set("produit_id", String(filters.produitId));
      if (filters?.plateforme) params.set("plateforme", filters.plateforme);
      if (filters?.statut) params.set("statut", filters.statut);
      const qs = params.toString();
      return request<Prospect[]>(`/api/prospects${qs ? `?${qs}` : ""}`);
    },
    create: (data: NewProspect) =>
      request<Prospect>("/api/prospects", { method: "POST", body: JSON.stringify(data) }),
    bulkCreate: (produitId: number, prospects: NewProspect[]) =>
      request<{ inserted: number; ignored: number }>("/api/prospects/bulk", {
        method: "POST",
        body: JSON.stringify({ produit_id: produitId, prospects }),
      }),
    update: (id: number, data: UpdateProspect) =>
      request<Prospect>(`/api/prospects/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    contact: (id: number, scriptId: number, date?: string) =>
      request<ContactResult>(`/api/prospects/${id}/contact`, {
        method: "POST",
        body: JSON.stringify({ script_id: scriptId, date }),
      }),
    remove: (id: number) => request<void>(`/api/prospects/${id}`, { method: "DELETE" }),
  },
  logs: {
    list: (filters?: { produitId?: number; plateforme?: Platform; prospectId?: number }) => {
      const params = new URLSearchParams();
      if (filters?.produitId) params.set("produit_id", String(filters.produitId));
      if (filters?.plateforme) params.set("plateforme", filters.plateforme);
      if (filters?.prospectId) params.set("prospect_id", String(filters.prospectId));
      const qs = params.toString();
      return request<Log[]>(`/api/logs${qs ? `?${qs}` : ""}`);
    },
    create: (data: NewLog) => request<Log>("/api/logs", { method: "POST", body: JSON.stringify(data) }),
    update: (id: number, data: UpdateLog) =>
      request<Log>(`/api/logs/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    remove: (id: number) => request<void>(`/api/logs/${id}`, { method: "DELETE" }),
  },
  exportCsvUrl: () => "/api/export/csv",
  backup: {
    exportJsonUrl: () => "/api/backup/json",
    importJson: (payload: BackupPayload) =>
      request<{ ok: true; products: number; scripts: number; prospects: number; logs: number }>(
        "/api/backup/json",
        { method: "POST", body: JSON.stringify(payload) }
      ),
  },
};
