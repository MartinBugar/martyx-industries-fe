# 🚨 Backend Fix Needed: Public Gallery Filtering Issue

## 📋 Problem Description

**Issue:** The `/api/public-gallery/all-photos` endpoint is showing photos from models that have `is_public = false`, which violates the intended behavior.

**Expected Behavior:**
- When a model has `is_public = false`, its photos should NOT appear in "All Photos" view
- Only photos from models with `is_public = true` should be visible in public gallery

**Current Behavior:**
- All photos are shown regardless of model's `is_public` status
- This breaks the privacy model where users can make their models private

---

## 🔍 Root Cause Analysis

The backend endpoint `/api/public-gallery/all-photos` is not properly filtering photos based on the `is_public` status from the `user_model_status` table.

**Current SQL Query (PROBLEMATIC):**
```sql
-- This query is missing the is_public filter
SELECT ump.*, u.nickname, ums.product_name
FROM user_model_photos ump
INNER JOIN users u ON ump.user_id = u.id
INNER JOIN user_model_status ums ON ump.user_id = ums.user_id AND ump.product_id = ums.product_id
WHERE ump.verification_status = 'approved'
ORDER BY ump.upload_date DESC;
```

**Correct SQL Query (FIXED):**
```sql
-- This query properly filters by is_public status
SELECT ump.*, u.nickname, ums.product_name
FROM user_model_photos ump
INNER JOIN users u ON ump.user_id = u.id
INNER JOIN user_model_status ums ON ump.user_id = ums.user_id AND ump.product_id = ums.product_id
WHERE ump.verification_status = 'approved'
  AND ums.is_public = true  -- 🔥 THIS LINE IS MISSING!
ORDER BY ump.upload_date DESC;
```

---

## 🛠️ Required Backend Changes

### 1. Fix `/api/public-gallery/all-photos` Endpoint

**File:** Backend controller/service handling public gallery
**Method:** Update the SQL query to include `is_public` filter

**Before:**
```java
// Missing is_public filter
@Query("SELECT ump FROM UserModelPhoto ump " +
       "JOIN ump.user u " +
       "JOIN UserModelStatus ums ON ump.userId = ums.userId AND ump.productId = ums.productId " +
       "WHERE ump.verificationStatus = 'APPROVED' " +
       "ORDER BY ump.uploadDate DESC")
List<UserModelPhoto> findAllPublicPhotos();
```

**After:**
```java
// Include is_public filter
@Query("SELECT ump FROM UserModelPhoto ump " +
       "JOIN ump.user u " +
       "JOIN UserModelStatus ums ON ump.userId = ums.userId AND ump.productId = ums.productId " +
       "WHERE ump.verificationStatus = 'APPROVED' " +
       "AND ums.isPublic = true " +  // 🔥 ADD THIS LINE
       "ORDER BY ump.uploadDate DESC")
List<UserModelPhoto> findAllPublicPhotos();
```

### 2. Fix `/api/public-gallery` Endpoint (Users List)

**File:** Same backend controller/service
**Method:** Update the SQL query for users list

**Before:**
```java
// Missing is_public filter
@Query("SELECT DISTINCT u FROM User u " +
       "JOIN UserModelStatus ums ON u.id = ums.userId " +
       "JOIN UserModelPhoto ump ON ums.userId = ump.userId AND ums.productId = ump.productId " +
       "WHERE ump.verificationStatus = 'APPROVED'")
List<User> findUsersWithPublicPhotos();
```

**After:**
```java
// Include is_public filter
@Query("SELECT DISTINCT u FROM User u " +
       "JOIN UserModelStatus ums ON u.id = ums.userId " +
       "JOIN UserModelPhoto ump ON ums.userId = ump.userId AND ums.productId = ump.productId " +
       "WHERE ump.verificationStatus = 'APPROVED' " +
       "AND ums.isPublic = true")  // 🔥 ADD THIS LINE
List<User> findUsersWithPublicPhotos();
```

### 3. Fix `/api/public-gallery/{userId}` Endpoint (User Gallery)

**File:** Same backend controller/service
**Method:** Update the SQL query for specific user gallery

**Before:**
```java
// Missing is_public filter
@Query("SELECT ump FROM UserModelPhoto ump " +
       "JOIN UserModelStatus ums ON ump.userId = ums.userId AND ump.productId = ums.productId " +
       "WHERE ump.userId = :userId " +
       "AND ump.verificationStatus = 'APPROVED'")
List<UserModelPhoto> findUserPublicPhotos(@Param("userId") Long userId);
```

**After:**
```java
// Include is_public filter
@Query("SELECT ump FROM UserModelPhoto ump " +
       "JOIN UserModelStatus ums ON ump.userId = ums.userId AND ump.productId = ums.productId " +
       "WHERE ump.userId = :userId " +
       "AND ump.verificationStatus = 'APPROVED' " +
       "AND ums.isPublic = true")  // 🔥 ADD THIS LINE
List<UserModelPhoto> findUserPublicPhotos(@Param("userId") Long userId);
```

---

## 🧪 Testing Instructions

### Test Case 1: Model with is_public = false
1. **Setup:** Create a model with `is_public = false` and upload photos
2. **Expected:** Photos should NOT appear in `/api/public-gallery/all-photos`
3. **Expected:** User should NOT appear in `/api/public-gallery` (users list)
4. **Expected:** User's gallery should be empty at `/api/public-gallery/{userId}`

### Test Case 2: Model with is_public = true
1. **Setup:** Create a model with `is_public = true` and upload photos
2. **Expected:** Photos SHOULD appear in `/api/public-gallery/all-photos`
3. **Expected:** User SHOULD appear in `/api/public-gallery` (users list)
4. **Expected:** User's gallery should show photos at `/api/public-gallery/{userId}`

### Test Case 3: Toggle is_public status
1. **Setup:** Start with `is_public = true`, verify photos appear
2. **Action:** Change to `is_public = false` via admin panel
3. **Expected:** Photos should disappear from all public endpoints
4. **Action:** Change back to `is_public = true`
5. **Expected:** Photos should reappear in all public endpoints

---

## 📊 Database Verification

**Check current data:**
```sql
-- See which models are public vs private
SELECT 
  ums.user_id,
  ums.product_id,
  ums.product_name,
  ums.is_public,
  ums.is_completed,
  COUNT(ump.id) as photo_count
FROM user_model_status ums
LEFT JOIN user_model_photos ump ON ums.user_id = ump.user_id AND ums.product_id = ump.product_id
WHERE ump.verification_status = 'approved'
GROUP BY ums.user_id, ums.product_id, ums.product_name, ums.is_public, ums.is_completed
ORDER BY ums.user_id, ums.product_id;
```

**Expected result after fix:**
- Only models with `is_public = true` should have photos visible in public endpoints
- Models with `is_public = false` should be completely hidden from public view

---

## 🚀 Implementation Priority

**Priority:** HIGH - This is a privacy/security issue
**Impact:** Users' private models are being exposed publicly
**Effort:** LOW - Simple SQL query fix

**Files to modify:**
1. `PublicGalleryController.java` (or equivalent)
2. `PublicGalleryService.java` (or equivalent)
3. Repository queries for public gallery endpoints

**Estimated time:** 30 minutes to 1 hour

---

## 📞 Contact

If you need clarification on the frontend implementation or have questions about the expected behavior, check:
- Frontend implementation: `src/pages/UserGallery/UserGallery.tsx`
- Service calls: `src/services/userGalleryService.ts`
- Types: `src/types/userGallery.ts`

The frontend is already correctly implemented and ready - it just needs the backend to properly filter the data.
