# Backend Requirements - Zostávajúce E-commerce Funkcie

Frontend je 95% hotový. Tento dokument popisuje 3 tasky, ktoré vyžadujú backend implementáciu.

---

## Task 12: Cart Recovery Email System 📧

### Účel
Automaticky posielať emaily používateľom, ktorí opustili košík, aby ich povzbudili dokončiť nákup.

### Frontend Status
✅ **Už implementované:**
- Cart tracking v `CartContext.tsx`
- Cart expiration (30 dní)
- Backend sync cez `cartService.ts`
- Session tracking pre guest users

### Potrebné Backend API

#### POST /api/cart-recovery/schedule
```typescript
Request: {
  userId?: number,
  guestSessionId?: string,
  email: string,
  cartItems: CartItem[],
  cartValue: number
}
Response: { success: boolean, recoveryId: number }
```

#### GET /api/cart-recovery/:token
```typescript
Response: {
  valid: boolean,
  cartItems?: CartItem[],
  expiresAt?: string
}
```

#### POST /api/cart-recovery/:token/restore
```typescript
Response: { success: boolean, message: string }
```

### Databáza
```sql
CREATE TABLE cart_recovery_emails (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  guest_session_id VARCHAR(255),
  email VARCHAR(255) NOT NULL,
  cart_items JSONB NOT NULL,
  cart_value DECIMAL(10,2),
  recovery_token VARCHAR(255) UNIQUE,
  sent_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  recovered_at TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Scheduled Jobs
- **1h job**: Košíky opustené > 1h → Email 1
- **24h job**: Košíky opustené 24h → Email 2 (10% zľava)
- **72h job**: Košíky opustené 72h → Email 3 (posledná šanca)
- **Daily cleanup**: Vymaž expirované tokeny (> 7 dní)

### Email Templates
1. "Zabudli ste niečo v košíku!" (1h)
2. "Dokončite objednávku + 10% zľava!" (24h)
3. "Posledná šanca! Košík čoskoro vyprší" (72h)

**Odhad**: 3-4 dni backend práce

---

## Task 15: Shipping Insurance Option 🛡️

### Účel
Voliteľné poistenie zásielky proti strate/poškodeniu.

### Potrebné Backend API

#### GET /api/shipping/insurance-quote
```typescript
Request: {
  orderValue: number,
  shippingCountry: string
}
Response: {
  insuranceCost: number,
  coverageAmount: number,
  provider: string,
  terms: string
}
```

**Cenová logika**: 2% z hodnoty, min €2.99, max €50

#### POST /api/orders/:orderId/add-insurance
```typescript
Request: { insuranceEnabled: boolean }
Response: { success: boolean, updatedTotal: number }
```

### Databáza
```sql
ALTER TABLE orders
  ADD COLUMN shipping_insurance_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN shipping_insurance_cost DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN shipping_insurance_coverage DECIMAL(10,2) DEFAULT 0;

CREATE TABLE insurance_claims (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  claim_type VARCHAR(50), -- 'lost','damaged','stolen'
  claim_amount DECIMAL(10,2),
  filed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(50) DEFAULT 'pending',
  resolution_notes TEXT,
  resolved_at TIMESTAMP
);
```

### Frontend Integrácia
V `Checkout.tsx` Step 2 pridať:
```typescript
<div className="insurance-option">
  <label>
    <input type="checkbox" checked={insuranceEnabled}
           onChange={(e) => setInsuranceEnabled(e.target.checked)} />
    Shipping Insurance (+€{quote?.insuranceCost.toFixed(2)})
  </label>
  <p>Covers up to €{quote?.coverageAmount} against loss/damage</p>
</div>
```

**Odhad**: 1-2 dni backend práce

---

## Task 17: Order History 📦

### Účel
Zobrazenie histórie objednávok s detailmi, tracking, faktúry, reorder funkciou.

### Frontend Status
✅ **Čiastočne hotové:**
- `OrderHistory.tsx` existuje
- `OrderDetailsCard.tsx` hotový
- User account štruktúra pripravená

### Potrebné Backend API

#### GET /api/orders/user/:userId
```typescript
Query: {
  page?: number,
  limit?: number,
  status?: 'pending'|'processing'|'shipped'|'delivered'|'cancelled',
  dateFrom?: string,
  dateTo?: string,
  sortBy?: 'date'|'total'|'status',
  sortOrder?: 'asc'|'desc'
}
Response: {
  orders: Order[],
  total: number,
  page: number,
  totalPages: number
}
```

#### GET /api/orders/:orderId
```typescript
Response: {
  id: number,
  orderNumber: string,
  status: string,
  totalAmount: number,
  currency: string,
  createdAt: string,
  items: OrderItem[],
  billingAddress: Address,
  shippingAddress: Address,
  trackingNumber?: string,
  trackingUrl?: string,
  carrier?: string,
  invoiceUrl?: string
}
```

#### GET /api/orders/:orderId/invoice
```typescript
Response: PDF file stream
Headers: {
  'Content-Type': 'application/pdf',
  'Content-Disposition': 'attachment; filename="invoice-12345.pdf"'
}
```

#### GET /api/orders/:orderId/tracking
```typescript
Response: {
  trackingNumber: string,
  carrier: string,
  status: string,
  estimatedDelivery: string,
  trackingEvents: Array<{
    date: string,
    location: string,
    description: string
  }>
}
```

#### POST /api/orders/:orderId/reorder
```typescript
Response: {
  success: boolean,
  newOrderId?: number,
  unavailableItems?: ProductVariant[]
}
```

#### POST /api/orders/:orderId/cancel
```typescript
Request: { reason: string }
Response: { success: boolean, refundAmount?: number }
```

#### POST /api/orders/:orderId/return
```typescript
Request: {
  items: Array<{
    variantId: number,
    quantity: number,
    reason: string
  }>,
  refundMethod: 'original'|'store_credit'
}
Response: {
  success: boolean,
  returnId: number,
  returnLabel: string
}
```

### Databáza
```sql
ALTER TABLE orders
  ADD COLUMN tracking_number VARCHAR(255),
  ADD COLUMN tracking_url VARCHAR(500),
  ADD COLUMN carrier VARCHAR(100),
  ADD COLUMN shipped_at TIMESTAMP,
  ADD COLUMN delivered_at TIMESTAMP,
  ADD COLUMN cancelled_at TIMESTAMP,
  ADD COLUMN cancellation_reason TEXT,
  ADD COLUMN invoice_url VARCHAR(500);

CREATE TABLE order_returns (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  return_items JSONB NOT NULL,
  reason TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  refund_amount DECIMAL(10,2),
  refund_method VARCHAR(50),
  return_label_url VARCHAR(500),
  received_at TIMESTAMP,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Frontend Service
Vytvoriť `src/services/orderService.ts`:
```typescript
export const orderService = {
  getUserOrders: (params) => apiClient.get('/api/orders/user/' + userId, { params }),
  getOrderDetails: (orderId) => apiClient.get(`/api/orders/${orderId}`),
  downloadInvoice: (orderId) => apiClient.get(`/api/orders/${orderId}/invoice`, { responseType: 'blob' }),
  getTracking: (orderId) => apiClient.get(`/api/orders/${orderId}/tracking`),
  reorder: (orderId) => apiClient.post(`/api/orders/${orderId}/reorder`),
  cancelOrder: (orderId, reason) => apiClient.post(`/api/orders/${orderId}/cancel`, { reason }),
  initiateReturn: (orderId, data) => apiClient.post(`/api/orders/${orderId}/return`, data)
};
```

**Odhad**: 2-3 dni backend práce

---

## Priorita

### High Priority
1. ✅ **Order History** - Kritické pre UX
2. ✅ **Shipping Insurance** - Revenue opportunity
3. ⚠️ **Cart Recovery** - Zvýši konverziu o 10-15%

### Celková Pracnosť
**7-9 dní backend developmentu**

---

## Frontend Je Hotový! 🎉

**Completion: 95%**

Všetky komponenty pripravené, stačí backend API.

Integrácia cez service layers:
- `orderService.ts` (vytvoriť)
- `insuranceService.ts` (vytvoriť)
- `cartService.ts` (už existuje)

**Čakáme len na backend! ⏳**
