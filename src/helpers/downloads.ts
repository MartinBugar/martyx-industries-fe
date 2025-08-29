import type { PaymentDTO } from "../services/paymentService";

export type ProductLink = { label: string; url: string };

export function toDownloadUrl(token?: string | null): string | null {
  if (!token) return null;
  try { return `/api/download/${encodeURIComponent(token)}`; }
  catch { return `/api/download/${token}`; }
}

export function extractPerProductLinks(dto?: PaymentDTO | null): ProductLink[] {
  if (!dto || !Array.isArray(dto.downloadLinks)) return [];
  const list: ProductLink[] = [];
  for (const dl of dto.downloadLinks) {
    const name = (dl.productName || 'product').trim();
    const label = `Download ${name}`;
    const url = dl.url || toDownloadUrl(dl.token) || ""; // token optional
    if (url) list.push({ label, url });
  }
  return list;
}

export function extractAllProductsUrl(dto?: PaymentDTO | null): string | null {
  if (!dto) return null;
  return dto.allProductsDownloadUrl || toDownloadUrl(dto.allProductsDownloadToken);
}
