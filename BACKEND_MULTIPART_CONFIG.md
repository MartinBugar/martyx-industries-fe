# Backend Multipart Upload Configuration - URGENT FIX

## Problém
Niektoré fotky zlyhávajú s error 500. **Najčastejšia príčina:** Spring Boot má defaultne limit 1MB pre upload súborov.

## Riešenie

### 1. application.yml (ODPORÚČANÉ)

```yaml
spring:
  servlet:
    multipart:
      enabled: true
      max-file-size: 10MB
      max-request-size: 100MB
      file-size-threshold: 0
```

### 2. application.properties (alternatíva)

```properties
spring.servlet.multipart.enabled=true
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=100MB
spring.servlet.multipart.file-size-threshold=0
```

## Vysvetlenie parametrov

- `max-file-size: 10MB` - Maximálna veľkosť jedného súboru
- `max-request-size: 100MB` - Maximálna veľkosť celého requestu (10 súborov x 10MB)
- `file-size-threshold: 0` - Všetky súbory sa uložia na disk (nie do RAM)
- `enabled: true` - Povolí multipart upload

## Debugging

### Pridaj do UserModelPhotoService začiatok upload metódy:

```java
public List<UserModelPhotoResponse> uploadPhotos(
        Long userId, String productId, String productName, String orderId, MultipartFile[] photos
) {
    log.info("📤 Upload started - files: {}", photos.length);

    // Log každý súbor
    for (int i = 0; i < photos.length; i++) {
        MultipartFile file = photos[i];
        log.info("  File {}: name={}, size={}, type={}",
            i + 1,
            file.getOriginalFilename(),
            formatFileSize(file.getSize()),
            file.getContentType()
        );
    }

    // Validácia
    validateFiles(photos);

    // ... zvyšok kódu
}

private String formatFileSize(long bytes) {
    if (bytes < 1024) return bytes + " B";
    int exp = (int) (Math.log(bytes) / Math.log(1024));
    String pre = "KMGTPE".charAt(exp-1) + "";
    return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
}
```

### Skontroluj validateFiles metódu:

```java
private void validateFiles(MultipartFile[] files) {
    if (files == null || files.length == 0) {
        throw new IllegalArgumentException("Žiadne súbory neboli vybrané");
    }

    // Backend prijíma 1 súbor naraz (frontend posiela po jednom)
    if (files.length > 1) {
        log.warn("⚠️ Received {} files, but expecting 1", files.length);
    }

    List<String> allowedTypes = Arrays.asList(
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp"
    );

    long maxSize = 10 * 1024 * 1024; // 10MB

    for (MultipartFile file : files) {
        // Log pre debug
        log.info("Validating: {} ({})", file.getOriginalFilename(), file.getContentType());

        if (file.isEmpty()) {
            throw new IllegalArgumentException("Súbor je prázdny: " + file.getOriginalFilename());
        }

        // DÔLEŽITÉ: file.getContentType() môže vrátiť null!
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException(
                "Nepodporovaný typ súboru: " + file.getOriginalFilename() +
                " (type: " + contentType + ")"
            );
        }

        if (file.getSize() > maxSize) {
            throw new IllegalArgumentException(
                "Súbor " + file.getOriginalFilename() +
                " je príliš veľký (" + formatFileSize(file.getSize()) + "). Max: 10MB"
            );
        }
    }
}
```

## Možné chyby a riešenia

### Chyba: "The field photos exceeds its maximum permitted size of 1048576 bytes"
**Riešenie:** Pridať multipart config vyššie ☝️

### Chyba: "Required request part 'photos' is not present"
**Riešenie:**
- Skontroluj že frontend posiela FormData s poľom `photos`
- Skontroluj že Content-Type je `multipart/form-data` (nie `application/json`)

### Chyba: Nepodporovaný typ súboru
**Riešenie:**
```java
// Kontroluj aj file extension ak contentType je null
String filename = file.getOriginalFilename();
if (filename != null) {
    String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    if (!Arrays.asList("jpg", "jpeg", "png", "webp").contains(extension)) {
        throw new IllegalArgumentException("Nepodporovaná prípona: " + extension);
    }
}
```

### Chyba: 500 pri Digital Ocean Spaces upload
**Riešenie:**
```java
// Pridaj try-catch okolo Spaces uploadu
try {
    String cdnUrl = uploadToSpaces(file, userId, productId, fileName);
    log.info("✅ Uploaded to Spaces: {}", cdnUrl);
} catch (Exception e) {
    log.error("❌ Spaces upload failed for: {}", fileName, e);
    throw new RuntimeException("Chyba pri uploade do Digital Ocean Spaces: " + e.getMessage(), e);
}
```

## Test príkaz

Skús ručne s curl:

```bash
curl -X POST http://localhost:8080/api/user-photos/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "product_id=TEST_PRODUCT" \
  -F "product_name=Test Product" \
  -F "order_id=123" \
  -F "photos=@/path/to/test-image.jpg"
```

## Checklist pre backend developera

- [ ] Pridať multipart konfiguráciu do application.yml
- [ ] Reštartovať Spring Boot aplikáciu
- [ ] Pridať detailný logging do uploadPhotos metódy
- [ ] Skontrolovať validateFiles - pridať null check pre contentType
- [ ] Pridať lepší error handling okolo Spaces uploadu
- [ ] Otestovať s rôznymi veľkosťami súborov (1MB, 5MB, 9MB)
- [ ] Skontrolovať Digital Ocean Spaces credentials
- [ ] Overiť že bucket má správne ACL nastavené

## Okamžité riešenie (Quick Fix)

**Najrýchlejšie:** Pridaj do `application.yml` a reštartuj server:

```yaml
spring:
  servlet:
    multipart:
      max-file-size: 10MB
      max-request-size: 100MB
```

Potom otestuj znova upload z frontendu.
