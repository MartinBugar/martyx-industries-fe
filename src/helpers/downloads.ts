import type { PaymentDTO } from "../services/paymentService";

export type ProductLink = { label: string; url: string; productName?: string };

export function toDownloadUrl(token?: string | null): string | null {
  if (!token) return null;
  try { return `/api/download/${encodeURIComponent(token)}`; }
  catch { return `/api/download/${token}`; }
}

export function extractPerProductLinks(dto?: PaymentDTO | null): ProductLink[] {
  if (!dto) return [];

  // 1) Preferred: structured per-product links from backend
  const structured: ProductLink[] = Array.isArray(dto.downloadLinks)
    ? (dto.downloadLinks
        .map((dl) => {
          const url = dl.url || toDownloadUrl(dl.token) || '';
          if (!url) return null;
          const name = (dl.productName || 'product').trim();
          const label = `Download ${name}`;
          return { label, url, productName: name } as ProductLink;
        })
        .filter(Boolean) as ProductLink[])
    : [];
  if (structured.length > 0) return structured;

  // 2) Fallback: legacy fields (urls/tokens), optionally label from orderItems
  const urls: string[] = [];
  if (Array.isArray(dto.downloadUrls)) urls.push(...(dto.downloadUrls.filter(Boolean) as string[]));
  if (typeof dto.downloadUrl === 'string' && dto.downloadUrl) urls.push(dto.downloadUrl);
  if (Array.isArray(dto.downloadTokens)) {
    for (const t of dto.downloadTokens) {
      const u = toDownloadUrl(t);
      if (u) urls.push(u);
    }
  }
  if (dto.downloadToken) {
    const u = toDownloadUrl(dto.downloadToken);
    if (u) urls.push(u);
  }
  const uniqueUrls = Array.from(new Set(urls.filter(Boolean)));
  if (uniqueUrls.length === 0) return [];

  const items = Array.isArray(dto.orderItems) ? dto.orderItems : [];
  return uniqueUrls.map((u, idx) => {
    const rawName = items[idx]?.productName ?? `product ${idx + 1}`;
    const name = String(rawName || `product ${idx + 1}`).trim();
    const label = `Download ${name}`;
    return { label, url: u, productName: name } as ProductLink;
  });
}

export function extractAllProductsUrl(dto?: PaymentDTO | null): string | null {
  if (!dto) return null;
  return dto.allProductsDownloadUrl || toDownloadUrl(dto.allProductsDownloadToken);
}
