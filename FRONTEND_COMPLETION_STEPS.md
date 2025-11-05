# 🎯 FRONTEND DOKONČENIE - Zostávajúce Kroky

**Dátum:** 2025-01-05
**Status:** 75% HOTOVÉ - zostáva 4 kroky

---

## ✅ ČO JE UŽ HOTOVÉ (DOKONČENÉ):

### Backend (100%) ✅
- ProductAttachment model, repository, service
- Admin + Public API controllers
- Rate limiting (Bucket4j)
- Flyway migrácia V19
- DTOs a validation

### Frontend Services & Types (100%) ✅
- `productAttachmentService.ts` - kompletný API client
- `ProductAttachmentDto` typy v `api.ts`
- dompurify nainštalovaný

### Frontend Komponenty (75%) ✅
- ✅ **React Quill** integrovaný do `AdminProductTabs.tsx`
- ✅ **AttachmentManager** komponenta vytvorená (`src/components/AttachmentManager/`)
- ✅ **Product Tabs tab** pridaný do `AdminProductDetail.tsx`

---

## 🔧 ČO ZOSTÁVA DOKONČIŤ (4 KROKY):

### KROK 1: UPRAVIŤ VariantEditor pre Tab + Attachment Management

**Súbor:** `C:\Users\mbugar\WebstormProjects\martyx-industries-fe\src\components\admin\VariantEditor.tsx`

**Potrebné zmeny:**

1. **Pridať importy:**
```typescript
import AdminProductTabs from '../AdminProductTabs/AdminProductTabs';
import AttachmentManager from '../AttachmentManager/AttachmentManager';
```

2. **Pridať state:**
```typescript
const [showTabsManager, setShowTabsManager] = useState(false);
const [showAttachmentsManager, setShowAttachmentsManager] = useState(false);
```

3. **Pridať buttony do modalu (pod Save button):**
```typescript
{formData.id && (
  <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
    <button
      type="button"
      onClick={() => setShowTabsManager(!showTabsManager)}
      className="btn btn-secondary"
      style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    >
      📋 {showTabsManager ? 'Hide' : 'Manage'} Tabs
    </button>

    <button
      type="button"
      onClick={() => setShowAttachmentsManager(!showAttachmentsManager)}
      className="btn btn-secondary"
      style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
    >
      📎 {showAttachmentsManager ? 'Hide' : 'Manage'} Attachments
    </button>
  </div>
)}
```

4. **Pridať conditionals (pod closing </form>):**
```typescript
{showTabsManager && formData.id && (
  <div style={{ marginTop: '20px' }}>
    <AdminProductTabs
      variantId={formData.id}
      locale="en"
    />
  </div>
)}

{showAttachmentsManager && formData.id && (
  <AttachmentManager variantId={formData.id} />
)}
```

---

### KROK 2: UPRAVIŤ DownloadTab ABY NAČÍTAVAL ATTACHMENTS Z API

**Súbor:** `C:\Users\mbugar\WebstormProjects\martyx-industries-fe\src\components\ProductTabs\DownloadTab.tsx`

**NAHRADIŤ CELÝ SÚBOR:**

```typescript
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TabContent } from '../../data/productData';
import { getAttachmentsForVariant, trackDownload } from '../../services/productAttachmentService';
import type { ProductAttachmentDto } from '../../types/api';
import './ProductTabs.css';

interface DownloadTabProps {
  content: TabContent;
  variantId?: number;
}

const DownloadTab: React.FC<DownloadTabProps> = ({ content, variantId }) => {
  const { t } = useTranslation('products');
  const [attachments, setAttachments] = useState<ProductAttachmentDto[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (variantId) {
      loadAttachments();
    }
  }, [variantId]);

  const loadAttachments = async () => {
    if (!variantId) return;

    try {
      setLoading(true);
      const data = await getAttachmentsForVariant(variantId);
      setAttachments(data);
    } catch (error) {
      console.error('Failed to load attachments', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (attachment: ProductAttachmentDto) => {
    try {
      await trackDownload(attachment.id);
      window.open(attachment.cdnUrl || attachment.fileUrl, '_blank');
    } catch (error) {
      console.error('Download tracking failed', error);
    }
  };

  // If we have attachments from API, use those
  if (attachments.length > 0) {
    return (
      <section className="downloads-section" aria-label="Available downloads">
        {loading && <p>Loading...</p>}
        <ul className="downloads-list">
          {attachments.map((att) => (
            <li key={att.id} className="download-item">
              <div className="download-info">
                <div className="download-title-row">
                  <div className="download-label">{att.displayLabel}</div>
                  <button
                    className="download-btn"
                    onClick={() => handleDownload(att)}
                    aria-label={`Download ${att.displayLabel}`}
                  >
                    {t('downloads.download_button', 'Download')}
                  </button>
                </div>
                {att.description && (
                  <p className="download-description" style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    {att.description}
                  </p>
                )}
                {(att.formattedFileSize || att.fileFormat) && (
                  <div className="download-meta">
                    {att.fileFormat ? att.fileFormat : ''}
                    {att.formattedFileSize ? ` · ${att.formattedFileSize}` : ''}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  // Fallback to hardcoded content
  switch (content.kind) {
    case 'text':
      return (
        <div
          className="rich-text"
          dangerouslySetInnerHTML={{ __html: content.text }}
        />
      );
    case 'list':
      return (
        <ul>
          {content.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </ul>
      );
    case 'downloads':
      return (
        <section className="downloads-section">
          <ul className="downloads-list">
            {content.items.map((d, i) => (
              <li key={i} className="download-item">
                <div className="download-info">
                  <div className="download-title-row">
                    <div className="download-label">{d.label}</div>
                    <a
                      className="download-btn"
                      href={d.url}
                      download
                      rel="noopener noreferrer"
                    >
                      {t('downloads.download_button', 'Download')}
                    </a>
                  </div>
                  {(d.size || d.format) && (
                    <div className="download-meta">
                      {d.format ? d.format : ''}
                      {d.size ? ` · ${d.size}` : ''}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      );
    default:
      return <p>{t('downloads.no_downloads')}</p>;
  }
};

export default DownloadTab;
```

---

### KROK 3: PREDAŤ variantId DO DownloadTab v ProductDetail

**Súbor:** `C:\Users\mbugar\WebstormProjects\martyx-industries-fe\src\pages\ProductDetail\ProductDetail.tsx`

**Nájdi riadok ~559:**
```typescript
{activeTab.id === 'Download' && <DownloadTab content={activeTab.content} />}
```

**ZMEŇ NA:**
```typescript
{activeTab.id === 'Download' && <DownloadTab content={activeTab.content} variantId={product.variantId} />}
```

---

### KROK 4: PRIDAŤ DOMPurify SANITIZÁCIU

#### 4A. DetailsTab.tsx

**Súbor:** `C:\Users\mbugar\WebstormProjects\martyx-industries-fe\src\components\ProductTabs\DetailsTab.tsx`

**Pridať import:**
```typescript
import DOMPurify from 'dompurify';
```

**Upraviť render:**
```typescript
const DetailsTab: React.FC<{ content: TabContent }> = ({ content }) => {
  if (content.kind === 'text') {
    const sanitizedHtml = DOMPurify.sanitize(content.text);
    return (
      <div
        className="rich-text"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    );
  }
  return <p>No details available</p>;
};
```

#### 4B. PrintInfoTab.tsx

**Súbor:** `C:\Users\mbugar\WebstormProjects\martyx-industries-fe\src\components\ProductTabs\PrintInfoTab.tsx`

**Pridať import:**
```typescript
import DOMPurify from 'dompurify';
```

**Upraviť text rendering:**
```typescript
case 'text':
  const sanitizedHtml = DOMPurify.sanitize(content.text);
  return (
    <div
      className="rich-text"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
```

#### 4C. IncludedTab.tsx

**Súbor:** `C:\Users\mbugar\WebstormProjects\martyx-industries-fe\src\components\ProductTabs\IncludedTab.tsx`

**Pridať import:**
```typescript
import DOMPurify from 'dompurify';
```

**Upraviť text rendering:**
```typescript
case 'text':
  const sanitizedHtml = DOMPurify.sanitize(content.text);
  return (
    <div
      className="rich-text"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
```

---

## ✅ FINÁLNY CHECKLIST

Po dokončení vyššie uvedených krokov:

### Testovanie:

1. **Spustiť backend:**
```bash
cd C:\Users\mbugar\martyx-indystries-be
./mvnw.cmd flyway:migrate
./mvnw.cmd spring-boot:run
```

2. **Spustiť frontend:**
```bash
cd C:\Users\mbugar\WebstormProjects\martyx-industries-fe
npm run dev
```

3. **Otestovať flow:**
   - [ ] Admin panel → Products → Vybrať produkt
   - [ ] Kliknúť na "Product Tabs" tab
   - [ ] Vytvoriť nový tab s HTML obsahom (použiť Rich text editor)
   - [ ] Prejsť na Variants tab
   - [ ] Editovať variant → kliknúť "Manage Attachments"
   - [ ] Uploadnúť PDF súbor (assembly guide)
   - [ ] Prejsť na frontend produktový detail
   - [ ] Overiť že sa zobrazuje Download tab
   - [ ] Stiahnuť súbor
   - [ ] Overiť tracking v konzole

---

## 📊 PROGRESS

**Celková completion:**
- Backend: ✅ 100%
- Frontend Services: ✅ 100%
- Frontend UI: ⚠️ 75% (zostáva 4 kroky)

**Odhadovaný čas na dokončenie:** 45-60 minút

---

## 🎯 VÝSLEDOK PO DOKONČENÍ

Budeš mať plne funkčný systém:
- ✅ Konfigurovateľné taby pre každý variant produktu
- ✅ Rich text editor pre HTML obsah
- ✅ Upload manager pre verejné súbory (PDF, ZIP)
- ✅ Automatické zobrazenie súborov v Download tabe
- ✅ Download tracking (analytics)
- ✅ Rate limiting (ochrana pred abuse)
- ✅ Bezpečné HTML rendering (DOMPurify)
- ✅ DO Spaces integrácia

**Všetky kroky sú jednoduché copy-paste!** 🚀

---

**Autor:** AI Assistant
**Dátum:** 2025-01-05
**Status:** READY TO COMPLETE
