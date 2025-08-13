# DataAset API Documentation

## Overview
API untuk mengelola data aset perusahaan. Hanya admin yang dapat mengakses endpoint ini.

## Base URL
```
/api/admin/data-aset
```

## Authentication
Semua endpoint memerlukan authentication token dengan role admin.

## Endpoints

### 1. Get All Data Aset
**GET** `/api/admin/data-aset`

Mengambil semua data aset dengan pagination dan filtering.

#### Query Parameters
- `page` (optional): Halaman yang ingin ditampilkan (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 50)
- `search` (optional): Kata kunci pencarian
- `kategori` (optional): Filter berdasarkan kategori
- `sortBy` (optional): Field untuk sorting (default: created_at)
- `sortOrder` (optional): ASC atau DESC (default: DESC)

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "nama_aset": "TANAH KAVLING",
        "kategori": "PROPERTI",
        "no_sertifikat": "0205",
        "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG",
        "atas_nama": "N.A. RAMADHAN",
        "data_pembelian": "2010",
        "status": "DIJAMINKAN DI PANIN BANK CAB. TANGERANG",
        "data_pbb": "TERBAYAR, 2025",
        "lampiran": "FOTO, FILE, VIDEO",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "creator": {
          "id": 1,
          "nama": "Admin User",
          "username": "admin"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 50
    },
    "statistics": {
      "totalAset": 1,
      "totalProperti": 1,
      "totalKendaraan": 0,
      "totalElektronik": 0
    }
  }
}
```

### 2. Get Data Aset by ID
**GET** `/api/admin/data-aset/:id`

Mengambil detail data aset berdasarkan ID.

#### Response
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nama_aset": "TANAH KAVLING",
    "kategori": "PROPERTI",
    "no_sertifikat": "0205",
    "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG",
    "atas_nama": "N.A. RAMADHAN",
    "data_pembelian": "2010",
    "status": "DIJAMINKAN DI PANIN BANK CAB. TANGERANG",
    "data_pbb": "TERBAYAR, 2025",
    "lampiran": "FOTO, FILE, VIDEO",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "creator": {
      "id": 1,
      "nama": "Admin User",
      "username": "admin"
    }
  }
}
```

### 3. Create Data Aset
**POST** `/api/admin/data-aset`

Membuat data aset baru.

#### Request Body
```json
{
  "nama_aset": "TANAH KAVLING",
  "kategori": "PROPERTI",
  "no_sertifikat": "0205",
  "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG",
  "atas_nama": "N.A. RAMADHAN",
  "data_pembelian": "2010",
  "status": "DIJAMINKAN DI PANIN BANK CAB. TANGERANG",
  "data_pbb": "TERBAYAR, 2025",
  "lampiran": "FOTO, FILE, VIDEO"
}
```

#### Response
```json
{
  "success": true,
  "message": "Data aset berhasil ditambahkan",
  "data": {
    "id": 1,
    "nama_aset": "TANAH KAVLING",
    "kategori": "PROPERTI",
    "no_sertifikat": "0205",
    "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG",
    "atas_nama": "N.A. RAMADHAN",
    "data_pembelian": "2010",
    "status": "DIJAMINKAN DI PANIN BANK CAB. TANGERANG",
    "data_pbb": "TERBAYAR, 2025",
    "lampiran": "FOTO, FILE, VIDEO",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "creator": {
      "id": 1,
      "nama": "Admin User",
      "username": "admin"
    }
  }
}
```

### 4. Update Data Aset
**PUT** `/api/admin/data-aset/:id`

Mengupdate data aset berdasarkan ID.

#### Request Body
```json
{
  "nama_aset": "TANAH KAVLING UPDATE",
  "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG UPDATE",
  "status": "DIMILIKI SENDIRI"
}
```

#### Response
```json
{
  "success": true,
  "message": "Data aset berhasil diperbarui",
  "data": {
    "id": 1,
    "nama_aset": "TANAH KAVLING UPDATE",
    "kategori": "PROPERTI",
    "no_sertifikat": "0205",
    "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG UPDATE",
    "atas_nama": "N.A. RAMADHAN",
    "data_pembelian": "2010",
    "status": "DIMILIKI SENDIRI",
    "data_pbb": "TERBAYAR, 2025",
    "lampiran": "FOTO, FILE, VIDEO",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:35:00.000Z",
    "creator": {
      "id": 1,
      "nama": "Admin User",
      "username": "admin"
    }
  }
}
```

### 5. Delete Data Aset
**DELETE** `/api/admin/data-aset/:id`

Soft delete data aset berdasarkan ID.

#### Response
```json
{
  "success": true,
  "message": "Data aset berhasil dihapus"
}
```

### 6. Filter by Category
**GET** `/api/admin/data-aset/category/:category`

Mengambil data aset berdasarkan kategori.

#### Path Parameters
- `category`: Kategori aset (PROPERTI, KENDARAAN_PRIBADI, KENDARAAN_OPERASIONAL, KENDARAAN_DISTRIBUSI, ELEKTRONIK)

#### Query Parameters
- `page` (optional): Halaman yang ingin ditampilkan (default: 1)
- `limit` (optional): Jumlah item per halaman (default: 50)
- `search` (optional): Kata kunci pencarian

#### Response
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "nama_aset": "TANAH KAVLING",
        "kategori": "PROPERTI",
        "no_sertifikat": "0205",
        "lokasi": "JL KAV. PERKEBUNAN NO. 1 BENCONGAN KELAPA DUA KAB. TANGERANG",
        "atas_nama": "N.A. RAMADHAN",
        "data_pembelian": "2010",
        "status": "DIJAMINKAN DI PANIN BANK CAB. TANGERANG",
        "data_pbb": "TERBAYAR, 2025",
        "lampiran": "FOTO, FILE, VIDEO",
        "created_at": "2024-01-15T10:30:00.000Z",
        "updated_at": "2024-01-15T10:30:00.000Z",
        "creator": {
          "id": 1,
          "nama": "Admin User",
          "username": "admin"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 50
    }
  }
}
```

### 7. Get Statistics
**GET** `/api/admin/data-aset/statistics/overview`

Mengambil statistik data aset.

#### Response
```json
{
  "success": true,
  "data": {
    "totalAset": 8,
    "totalProperti": 2,
    "totalKendaraanPribadi": 2,
    "totalKendaraanOperasional": 1,
    "totalKendaraanDistribusi": 1,
    "totalElektronik": 2,
    "totalKendaraan": 4
  }
}
```

## Data Structure

### Kategori Aset
- `PROPERTI`: Tanah, gedung, bangunan
- `KENDARAAN_PRIBADI`: Kendaraan untuk keperluan pribadi
- `KENDARAAN_OPERASIONAL`: Kendaraan untuk operasional perusahaan
- `KENDARAAN_DISTRIBUSI`: Kendaraan untuk distribusi
- `ELEKTRONIK`: Perangkat elektronik

### Field Requirements by Category

#### PROPERTI
- Required: `nama_aset`, `kategori`
- Optional: `no_sertifikat`, `lokasi`, `atas_nama`, `data_pembelian`, `status`, `data_pbb`, `lampiran`

#### KENDARAAN (PRIBADI/OPERASIONAL/DISTRIBUSI)
- Required: `merk_kendaraan`, `kategori`
- Optional: `atas_nama`, `plat_nomor`, `nomor_mesin`, `nomor_rangka`, `pajak_berlaku`, `stnk_berlaku`, `estimasi_pembayaran_pajak`, `terakhir_service`, `jadwal_service_berikutnya`, `asuransi_pakai`, `jenis_asuransi`, `asuransi_berlaku`, `penanggung_jawab`, `lampiran`

#### ELEKTRONIK
- Required: `nama_barang`, `kategori`
- Optional: `merk`, `model`, `serial_number`, `tahun_pembelian`, `status`, `penanggung_jawab`, `lokasi`, `lampiran`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Kategori tidak valid"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied. Admin only."
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Data aset tidak ditemukan"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal server error",
  "error": "Error details"
}
```

## Setup Instructions

1. **Create Table**
   ```bash
   node scripts/createDataAsetTable.js
   ```

2. **Seed Data**
   ```bash
   node scripts/seedDataAset.js
   ```

3. **Complete Setup**
   ```bash
   node scripts/setupDataAset.js
   ```

## Notes
- Semua operasi delete menggunakan soft delete (status_deleted = true)
- Data yang sudah di-soft delete tidak akan muncul di response
- Semua endpoint memerlukan authentication token dengan role admin
- Field `created_by` akan otomatis diisi dengan ID user yang sedang login
- Timestamps (`created_at`, `updated_at`) akan otomatis diisi oleh database
