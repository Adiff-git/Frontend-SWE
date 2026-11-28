# API Contract: User Profile, Avatar & Address Management

**Base Path**: `/api`  
**Protocol**: HTTPS / REST  
**Authentication**: Bearer JWT in `Authorization` header  

---

## 1. User Profile Endpoints

### 1.1 Get Current User Profile
- **Method**: `GET`
- **Path**: `/api/me`
- **Protected**: Bearer Token
- **Headers**: `Authorization: Bearer <token>`

**Responses**:
- `200 OK`:
  - **Headers**: `Cache-Control: no-store`
```json
{
  "id": 1042,
  "email": "customer@example.com",
  "fullName": "Nguyen Van A",
  "phoneNumber": "+84987654321",
  "profileImageUrl": "http://127.0.0.1:14567/backend-images/avatars/user-1042.webp",
  "role": "ROLE_CUSTOMER",
  "status": "ACTIVE",
  "emailVerified": true,
  "hasLocalPassword": true,
  "createdAt": "2026-11-04T10:00:00Z"
}
```
- `401 Unauthorized`: Missing or invalid Bearer token.

---

### 1.2 Update User Profile
- **Method**: `PUT`
- **Path**: `/api/me`
- **Protected**: Bearer Token
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "fullName": "Nguyen Van B",
  "phoneNumber": "+84912345678"
}
```

**Responses**:
- `200 OK`: Updated profile returned.
```json
{
  "id": 1042,
  "email": "customer@example.com",
  "fullName": "Nguyen Van B",
  "phoneNumber": "+84912345678",
  "profileImageUrl": "http://127.0.0.1:14567/backend-images/avatars/user-1042.webp",
  "role": "ROLE_CUSTOMER",
  "status": "ACTIVE",
  "emailVerified": true,
  "hasLocalPassword": true
}
```
- `400 Bad Request`: Validation failure (full name empty or phone format invalid).

---

## 2. Avatar Media Upload Endpoints

### 2.1 Request Pre-signed S3 Upload URL
- **Method**: `POST`
- **Path**: `/api/image-uploads`
- **Protected**: Bearer Token
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "contentType": "image/png",
  "byteSize": 145020
}
```

**Responses**:
- `201 Created`:
```json
{
  "imageId": "img_f839ac92",
  "uploadUrl": "http://127.0.0.1:14567/backend-images/avatars/img_f839ac92.png?AWSAccessKeyId=test...",
  "expiresAt": "2026-11-04T12:05:00Z"
}
```
- `400 Bad Request`: Disallowed MIME type or file size > 2MB.

---

### 2.2 Complete Avatar Upload
- **Method**: `POST`
- **Path**: `/api/image-uploads/{imageId}/complete`
- **Protected**: Bearer Token
- **Headers**: `Authorization: Bearer <token>`

**Responses**:
- `200 OK`:
```json
{
  "imageId": "img_f839ac92",
  "accessUrl": "http://127.0.0.1:14567/backend-images/avatars/img_f839ac92.png",
  "status": "COMPLETED"
}
```

---

## 3. Shipping Address Book Endpoints

### 3.1 List Customer Addresses
- **Method**: `GET`
- **Path**: `/api/me/addresses`
- **Protected**: Bearer Token
- **Headers**: `Authorization: Bearer <token>`

**Responses**:
- `200 OK`:
```json
[
  {
    "id": 1,
    "recipientName": "Nguyen Van A",
    "phoneNumber": "0987654321",
    "addressLine1": "123 Nguyen Hue Street",
    "addressLine2": "Apartment 4B",
    "city": "District 1, Ho Chi Minh City",
    "state": "Ho Chi Minh",
    "postalCode": "700000",
    "isDefault": true
  }
]
```

---

### 3.2 Create Shipping Address
- **Method**: `POST`
- **Path**: `/api/me/addresses`
- **Protected**: Bearer Token
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "recipientName": "Tran Thi B",
  "phoneNumber": "0912345678",
  "addressLine1": "456 Le Duan Boulevard",
  "addressLine2": null,
  "city": "District 1, Ho Chi Minh City",
  "state": "Ho Chi Minh",
  "postalCode": "700000",
  "isDefault": false
}
```

**Responses**:
- `201 Created`:
  - **Headers**: `Location: /api/me/addresses/2`
```json
{
  "id": 2,
  "recipientName": "Tran Thi B",
  "phoneNumber": "0912345678",
  "addressLine1": "456 Le Duan Boulevard",
  "addressLine2": null,
  "city": "District 1, Ho Chi Minh City",
  "state": "Ho Chi Minh",
  "postalCode": "700000",
  "isDefault": false
}
```

---

### 3.3 Update Shipping Address
- **Method**: `PUT`
- **Path**: `/api/me/addresses/{id}`
- **Protected**: Bearer Token
- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "recipientName": "Tran Thi B",
  "phoneNumber": "0912345678",
  "addressLine1": "456 Le Duan Boulevard",
  "addressLine2": "Floor 10",
  "city": "District 1, Ho Chi Minh City",
  "state": "Ho Chi Minh",
  "postalCode": "700000",
  "isDefault": true
}
```

**Responses**:
- `200 OK`: Updated address object.
- `404 Not Found`: Address ID does not exist or belongs to another user.

---

### 3.4 Delete Shipping Address
- **Method**: `DELETE`
- **Path**: `/api/me/addresses/{id}`
- **Protected**: Bearer Token
- **Headers**: `Authorization: Bearer <token>`

**Responses**:
- `204 No Content`: Address deleted.
- `404 Not Found`: Address not found.
