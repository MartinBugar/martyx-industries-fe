# Backend Fix - DigitalOcean Spaces ACL Problem

## 🚨 **Problém:**
Obrázky sa nahrávajú do Spaces, ale nie sú verejne dostupné → `AccessDenied` chyba

## ✅ **Riešenie:**

### **Zmeniť uploadToSpaces metódu:**

```java
private void uploadToSpaces(String s3Key, byte[] imageBytes, String mimeType) {
    PutObjectRequest putRequest = PutObjectRequest.builder()
        .bucket(spacesProperties.getBucketName())
        .key(s3Key)
        .contentType(mimeType)
        .contentLength((long) imageBytes.length)
        .cacheControl("max-age=31536000") // 1 rok cache
        .acl(ObjectCannedACL.PUBLIC_READ) // 🔑 TOTO JE KĽÚČOVÉ!
        .build();

    s3Client.putObject(putRequest, RequestBody.fromBytes(imageBytes));
}
```

### **Alebo alternatívne riešenie:**

```java
private void uploadToSpaces(String s3Key, byte[] imageBytes, String mimeType) {
    // Variant 1: S explicitným ACL
    PutObjectRequest putRequest = PutObjectRequest.builder()
        .bucket(spacesProperties.getBucketName())
        .key(s3Key)
        .contentType(mimeType)
        .contentLength((long) imageBytes.length)
        .cacheControl("max-age=31536000")
        .acl("public-read") // String variant
        .build();

    s3Client.putObject(putRequest, RequestBody.fromBytes(imageBytes));
}
```

### **Alebo cez metadata:**

```java
private void uploadToSpaces(String s3Key, byte[] imageBytes, String mimeType) {
    Map<String, String> metadata = new HashMap<>();
    metadata.put("uploaded-by", "martyx-backend");
    metadata.put("upload-time", Instant.now().toString());

    PutObjectRequest putRequest = PutObjectRequest.builder()
        .bucket(spacesProperties.getBucketName())
        .key(s3Key)
        .contentType(mimeType)
        .contentLength((long) imageBytes.length)
        .cacheControl("max-age=31536000")
        .acl(ObjectCannedACL.PUBLIC_READ) // Verejný prístup
        .metadata(metadata)
        .build();

    s3Client.putObject(putRequest, RequestBody.fromBytes(imageBytes));
}
```

## 🔍 **Import statement:**

Pridaj import pre ACL:

```java
import software.amazon.awssdk.services.s3.model.ObjectCannedACL;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.core.sync.RequestBody;
```

## 🎯 **Výsledok:**

Po tejto zmene budú obrázky verejne dostupné na URL:
```
https://mi-gallery.fra1.digitaloceanspaces.com/PRODUCT123/1727025678_image.jpg
```

## 🔧 **Alternatívne riešenie - Bucket Policy:**

Ak nechceš meniť kód, môžeš nastaviť bucket policy na DigitalOcean Spaces:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::mi-gallery/*"
    }
  ]
}
```

Ale **lepšie je nastaviť ACL v kóde** pre každý súbor zvlášť.

## 🚀 **Test:**

Po oprave by mala URL obrázka fungovať priamo v prehliadači bez chyby `AccessDenied`.
