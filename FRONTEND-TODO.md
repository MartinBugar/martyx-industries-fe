# FRONTEND - Čo ešte treba dorobiť

**Status**: Backend 100% hotový ✅ | Frontend 85% hotový ⚠️

**Odhadovaný čas**: ~30-45 minút

---

## 📋 PREHĽAD

Všetky **services, komponenty a typy** sú pripravené (Phase 1 ✅).
Ostáva len **integrácia** do existujúcich stránok (Phase 2 ⏳).

---

## 🔴 KRITICKÉ (Must Have - 20 min)

### 1. Pridať Stock Reservation do Checkout
**Súbor**: `src/pages/Checkout/Checkout.tsx`
**Riadky**: Pridať pod existing imports a do useEffect

**Čo pridať**:

```typescript
// Na začiatok súboru - imports
import { stockReservationService } from '../../services/stockReservationService';
import { ReservationTimer } from '../../components/ReservationTimer/ReservationTimer';

// V komponente - pridať state
const [reservationExpiresAt, setReservationExpiresAt] = useState<Date | null>(null);

// Pridať useEffect pre reservation (okolo riadku 380)
useEffect(() => {
  const reserveStock = async () => {
    if (items.length === 0) return;

    try {
      const sessionId = !user ? localStorage.getItem('martyx_session_id') : undefined;
      const response = await stockReservationService.reserveCartItems(
        items.map(item => ({
          variantId: item.product.variantId,
          quantity: item.quantity
        })),
        sessionId
      );

      setReservationExpiresAt(new Date(response.expiresAt));
      console.log('✅ Stock reserved until:', response.expiresAt);
    } catch (error) {
      console.error('❌ Failed to reserve stock:', error);
      alert('Some items may not be available. Please check your cart.');
    }
  };

  reserveStock();

  // Cleanup: release reservations when leaving checkout
  return () => {
    const sessionId = !user ? localStorage.getItem('martyx_session_id') : undefined;
    stockReservationService.releaseReservations(sessionId).catch(console.error);
  };
}, []); // Run once on mount

// V JSX (okolo riadku 710, pred checkout-steps)
{reservationExpiresAt && (
  <ReservationTimer
    expiresAt={reservationExpiresAt}
    onExpired={() => {
      alert('⏱️ Your reservation has expired. Please restart checkout.');
      navigate('/cart');
    }}
  />
)}
```

**Prečo**: Rezervuje stock na 15 minút, iný user nemôže kúpiť tvoje položky počas checkoutu.

---

### 2. Pridať Pre-Checkout Validation
**Súbor**: `src/components/StripeCheckoutButton.tsx`
**Riadky**: Upraviť `handleClick` funkciu (okolo riadku 41)

**Čo upraviť**:

```typescript
// Na začiatok súboru - imports
import { stockService } from '../services/stockService';

// Upraviť handleClick funkciu
const handleClick = async () => {
  try {
    setLoading(true);

    // NEW: Pre-flight stock validation
    console.log('🔍 Validating stock before payment...');
    const stockValidation = await stockService.validateCartStock(items);

    if (!stockValidation.valid) {
      const outOfStockNames = stockValidation.outOfStockItems.map(item => item.name).join(', ');
      alert(`❌ Cannot proceed to payment. Out of stock: ${outOfStockNames}`);
      setLoading(false);
      return;
    }

    if (stockValidation.insufficientStockItems.length > 0) {
      const insufficientMsg = stockValidation.insufficientStockItems
        .map(item => `${item.name}: only ${item.available} available (you have ${item.requested})`)
        .join('\n');
      alert(`⚠️ Insufficient stock:\n${insufficientMsg}\n\nPlease update your cart.`);
      setLoading(false);
      return;
    }

    console.log('✅ Stock validation passed');

    // Existing Stripe checkout logic continues here...
    const request = stripeService.createCheckoutRequest(
      items,
      shippingDetails,
      billingDetails,
      discountCode,
      user?.id
    );
    // ... rest of existing code
  } catch (error) {
    console.error('Error:', error);
    alert('An error occurred. Please try again.');
    setLoading(false);
  }
};
```

**Prečo**: Overí stock tesne pred platbou, zabráni platbe za vypredané položky.

---

## 🟠 VYSOKÁ PRIORITA (Nice to Have - 15 min)

### 3. Aktualizovať Stock Display v CartPage
**Súbor**: `src/pages/CartPage/CartPage.tsx`
**Riadky**: Okolo 335-366 (stock badges)

**Čo upraviť**:

```typescript
{/* Stock Availability Badge - UPDATE */}
{item.product.availabilityStatus === 'IN_STOCK' && (
  <div className="stock-badge stock-in-stock">
    {/* Use availableStock instead of stockQuantity */}
    {item.product.availableStock !== undefined ? (
      item.product.availableStock <= 3 && item.product.availableStock > 0 ? (
        <span style={{ color: '#f5576c', fontWeight: 'bold' }}>
          ⚠️ Only {item.product.availableStock} left!
        </span>
      ) : item.product.availableStock <= 10 ? (
        `Low stock (${item.product.availableStock} available)`
      ) : (
        'In Stock'
      )
    ) : (
      // Fallback to stockQuantity if availableStock not loaded
      item.product.stockQuantity <= 10 && item.product.stockQuantity > 0
        ? `Low stock (${item.product.stockQuantity} left)`
        : 'In Stock'
    )}
  </div>
)}

{item.product.availabilityStatus === 'LOW_STOCK' && (
  <div className="stock-badge stock-low-stock">
    ⚠️ Low Stock ({item.product.availableStock ?? item.product.stockQuantity} available)
  </div>
)}
```

**Prečo**: Zobrazí skutočný dostupný stock (total - reserved), nie celkový stock.

---

### 4. Pridať Stock Info do ProductDetail
**Súbor**: `src/pages/ProductDetail/ProductDetail.tsx`
**Riadky**: Okolo 103-117 (pred add to cart button)

**Čo pridať**:

```typescript
{/* Stock availability warning */}
{product.availableStock !== undefined && product.availableStock <= 5 && product.availableStock > 0 && (
  <div style={{
    background: '#fff3cd',
    border: '1px solid #ffc107',
    borderRadius: '4px',
    padding: '12px',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }}>
    <span style={{ fontSize: '20px' }}>⚠️</span>
    <span style={{ color: '#856404', fontWeight: 500 }}>
      Only {product.availableStock} items left in stock!
    </span>
  </div>
)}

{/* Existing add to cart buttons */}
```

**Prečo**: User vidí upozornenie ak je málo kusov, vytvára urgency.

---

## 🟡 STREDNÁ PRIORITA (Optional - 10 min)

### 5. Periodic Cart Stock Validation
**Súbor**: `src/context/CartContext.tsx`
**Riadky**: Pridať nový useEffect (okolo riadku 240)

**Čo pridať**:

```typescript
// Import at top
import { stockService } from '../services/stockService';

// Add new useEffect (after existing sync useEffect)
// Periodic stock validation (every 60 seconds)
useEffect(() => {
  if (items.length === 0) return;

  const validateStockPeriodically = async () => {
    try {
      const stockValidation = await stockService.validateCartStock(items);

      if (!stockValidation.valid) {
        console.warn('⚠️ Some items are out of stock, removing from cart');

        // Remove out-of-stock items
        stockValidation.outOfStockItems.forEach(item => {
          removeFromCart(item.variantId.toString());
        });

        if (stockValidation.outOfStockItems.length > 0) {
          alert(
            `${stockValidation.outOfStockItems.length} item(s) were removed from your cart - no longer available.`
          );
        }
      }

      // Update quantities for insufficient stock
      stockValidation.insufficientStockItems.forEach(item => {
        console.warn(`⚠️ Reducing ${item.name} quantity to ${item.available}`);
        updateQuantity(item.variantId.toString(), item.available);
      });

      if (stockValidation.insufficientStockItems.length > 0) {
        alert(
          `Some item quantities were adjusted due to stock availability.`
        );
      }
    } catch (error) {
      console.warn('Stock validation failed:', error);
      // Silent fail - don't interrupt user experience
    }
  };

  // Initial validation
  validateStockPeriodically();

  // Periodic validation every 60 seconds
  const interval = setInterval(validateStockPeriodically, 60000);

  return () => clearInterval(interval);
}, [items.length]); // Re-run when cart items change
```

**Prečo**: Automaticky odstráni vypredané položky, user nemusí manuálne kontrolovať.

---

## 📝 POZNÁMKY

### Backend API Endpointy (Už existujú):
- ✅ `POST /api/stock/reserve` - Reserve stock
- ✅ `DELETE /api/stock/release` - Release reservations
- ✅ `POST /api/stock/validate` - Validate cart stock
- ✅ `GET /api/stock/available/:id` - Get available stock

### Všetky Potrebné Services (Už vytvorené):
- ✅ `stockReservationService.ts`
- ✅ `stockService.ts`
- ✅ `ReservationTimer.tsx` komponent
- ✅ Type definitions aktualizované

---

## ⏱️ ČASOVÝ ODHAD

| Úloha | Priorita | Čas | Status |
|-------|----------|-----|--------|
| 1. Checkout reservation | 🔴 Kritická | 10 min | ⏳ TODO |
| 2. Pre-checkout validation | 🔴 Kritická | 10 min | ⏳ TODO |
| 3. CartPage stock display | 🟠 Vysoká | 8 min | ⏳ TODO |
| 4. ProductDetail warning | 🟠 Vysoká | 7 min | ⏳ TODO |
| 5. Periodic validation | 🟡 Stredná | 10 min | ⏳ TODO |

**Celkový čas**: 30-45 minút (kritické + vysoké priority)

---

## 🚀 PRIORITIZÁCIA

Ak máš **iba 20 minút**, urob:
1. ✅ Checkout reservation (úloha #1)
2. ✅ Pre-checkout validation (úloha #2)

Ak máš **30 minút**, pridaj:
3. ✅ CartPage stock display (úloha #3)

Ak máš **45 minút**, urob všetko (#1-5)

---

## ✅ AKO OTESTOVAŤ

### Test 1: Stock Reservation
1. Otvor checkout
2. DevTools Console: Malo by sa zobraziť "✅ Stock reserved until: ..."
3. Vidíš timer nahoře? ⏱️
4. Nechaj expirovať (15 min) alebo manuálne zmeň dátum
5. Malo by ťa redirectnúť na /cart

### Test 2: Pre-checkout Validation
1. Daj produkt do košíka
2. Na backende nastav stockQuantity na 0
3. Klikni "Proceed to Payment"
4. Malo by sa zobraziť alert "Out of stock"

### Test 3: Stock Display
1. Produkt s availableStock = 3
2. Malo by sa zobraziť "⚠️ Only 3 left!"
3. Produkt s availableStock = 15
4. Malo by sa zobraziť "In Stock"

---

## 🎯 VÝSLEDOK PO DOKONČENÍ

✅ Users vidia countdown timer počas checkoutu
✅ Stock sa rezervuje na 15 minút
✅ Validácia pred platbou zabráni chybám
✅ Správne zobrazenie dostupného stocku
✅ Automatické odstránenie vypredaných položiek

**Frontend bude 100% production-ready!** 🚀
