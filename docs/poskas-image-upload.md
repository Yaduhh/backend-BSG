# POSKAS Image Upload System

## Overview
Sistem upload gambar khusus untuk POSKAS yang menyimpan file di folder `uploads/poskas` dengan endpoint khusus `/api/upload/poskas`.

## Struktur Folder

```
backend/
├── uploads/
│   ├── poskas/          ← Gambar POSKAS disimpan di sini
│   ├── images/          ← Gambar umum
│   ├── videos/          ← Video
│   └── documents/       ← Dokumen
```

## Endpoint API

### POST `/api/upload/poskas`
**Endpoint khusus untuk upload gambar POSKAS**

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
```
FormData dengan field 'files' berisi array gambar
```

**Response Success:**
```json
{
  "success": true,
  "message": "POSKAS images uploaded successfully",
  "data": [
    {
      "originalName": "poskas_1703123456789.jpg",
      "filename": "poskas-1703123456789-123456789.jpg",
      "path": "poskas/poskas-1703123456789-123456789.jpg",
      "mimetype": "image/jpeg",
      "size": 245760,
      "url": "/uploads/poskas/poskas-1703123456789-123456789.jpg"
    }
  ]
}
```

**Response Error:**
```json
{
  "success": false,
  "message": "Only image files are allowed for POSKAS uploads."
}
```

## Konfigurasi Upload

### File Storage
```javascript
const poskasStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const poskasDir = path.join(uploadsDir, 'poskas');
    // Create directory if not exists
    cb(null, poskasDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'poskas-' + uniqueSuffix + ext);
  }
});
```

### File Filter
- **Allowed**: Hanya file gambar (`image/*`)
- **Rejected**: File non-gambar akan ditolak

### Limits
- **File Size**: Maksimal 10MB per gambar
- **File Count**: Maksimal 5 gambar per POSKAS
- **File Types**: JPG, PNG, GIF, WebP

## Frontend Implementation

### Upload Function
```javascript
const uploadImagesToServer = async (images) => {
  const formData = new FormData();
  
  images.forEach((image) => {
    formData.append('files', {
      uri: image.uri,
      name: image.name,
      type: 'image/jpeg'
    });
  });

  const response = await fetch('http://192.168.1.3:3000/api/upload/poskas', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData
  });

  return response.json();
};
```

### Database Storage
```javascript
// Data yang disimpan di database
const imagesWithServerUrls = uploadedImages.map((img, index) => {
  const uploadedFile = uploadedFiles[index];
  return {
    ...img,
    url: uploadedFile ? uploadedFile.url : img.uri, // Server URL
    serverPath: uploadedFile ? uploadedFile.path : null
  };
});
```

## URL Akses File

### Format URL
```
http://192.168.1.3:3000/uploads/poskas/poskas-{timestamp}-{random}.{ext}
```

### Contoh URL
```
http://192.168.1.3:3000/uploads/poskas/poskas-1703123456789-123456789.jpg
```

## Error Handling

### Common Errors
1. **File Type Error**: Hanya gambar yang diizinkan
2. **File Size Error**: Maksimal 10MB per file
3. **File Count Error**: Maksimal 5 file per request
4. **Authentication Error**: Token tidak valid

### Error Response Format
```json
{
  "success": false,
  "message": "Error description"
}
```

## Security Features

### Authentication
- Endpoint dilindungi dengan `authenticateToken`
- Hanya user yang login yang bisa upload

### File Validation
- MIME type validation
- File size limits
- File count limits
- Extension validation

### File Naming
- Unique timestamp + random number
- Prefix 'poskas-' untuk identifikasi
- Original extension dipertahankan

## Usage Examples

### 1. Upload Single Image
```javascript
const image = {
  uri: 'file:///path/to/image.jpg',
  name: 'poskas_1703123456789.jpg'
};

const result = await uploadImagesToServer([image]);
console.log('Uploaded:', result.data[0].url);
```

### 2. Upload Multiple Images
```javascript
const images = [
  { uri: 'file:///path/to/image1.jpg', name: 'poskas_1.jpg' },
  { uri: 'file:///path/to/image2.jpg', name: 'poskas_2.jpg' }
];

const result = await uploadImagesToServer(images);
console.log('Uploaded files:', result.data.length);
```

### 3. Display Image in Detail Screen
```javascript
const renderImage = (image) => {
  const imageUrl = image.url 
    ? `http://192.168.1.3:3000${image.url}`
    : image.uri;
    
  return (
    <Image
      source={{ uri: imageUrl }}
      className="w-full h-48 rounded-lg"
      resizeMode="cover"
    />
  );
};
```

## Database Schema

### Tabel: `keuangan_poskas`
```sql
CREATE TABLE keuangan_poskas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_user INT NOT NULL,
  tanggal_poskas DATE NOT NULL,
  isi_poskas TEXT NOT NULL,
  images JSON NULL,  -- Menyimpan metadata gambar
  status_deleted TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id)
);
```

### Format JSON Images
```json
[
  {
    "id": 1703123456789,
    "uri": "file:///path/to/local/image.jpg",
    "name": "poskas_1703123456789.jpg",
    "url": "/uploads/poskas/poskas-1703123456789-123456789.jpg",
    "serverPath": "poskas/poskas-1703123456789-123456789.jpg"
  }
]
```

## Monitoring & Logging

### Console Logs
```
📁 POSKAS upload request received
📁 User: 1
📁 Files: 2
📁 Processing POSKAS image 1: {...}
📁 POSKAS image processed: {...}
✅ POSKAS upload successful, returning: 2 images
```

### Error Logs
```
❌ Error uploading POSKAS images: Error message
❌ Error stack: Stack trace
```

## Performance Considerations

### File Size Optimization
- Maksimal 10MB per file untuk performa
- Kompresi gambar di frontend sebelum upload
- Lazy loading untuk display

### Storage Management
- Regular cleanup untuk file yang tidak terpakai
- Backup strategy untuk file penting
- Monitoring disk space usage

## Future Enhancements

### 1. Image Processing
- Automatic image compression
- Thumbnail generation
- Multiple size variants

### 2. CDN Integration
- Cloud storage integration
- CDN for faster delivery
- Geographic distribution

### 3. Advanced Features
- Image cropping
- Watermarking
- EXIF data extraction

### 4. Full Screen Image Features ✅
- **Pinch to Zoom**: Jepit dua jari untuk zoom in/out
- **Pan Gesture**: Geser jari untuk memindahkan gambar
- **Reset Button**: Tap icon refresh untuk reset zoom/pan
- **Smooth Animation**: Transisi halus saat zoom dan pan
- **Gesture Limits**: Zoom maksimal 3x, pan terbatas pada area gambar

## Full Screen Image Implementation

### Gesture Handlers
```javascript
// Pinch Gesture for Zoom
const onPinchGestureEvent = Animated.event(
  [{ nativeEvent: { scale: scale } }],
  { useNativeDriver: true }
);

// Pan Gesture for Movement
const onPanGestureEvent = Animated.event(
  [{ nativeEvent: { translationX: translateX, translationY: translateY } }],
  { useNativeDriver: true }
);
```

### Transform Animation
```javascript
style={{
  transform: [
    { scale: Animated.multiply(scale, lastScale.current) },
    { translateX: Animated.add(translateX, lastTranslateX.current) },
    { translateY: Animated.add(translateY, lastTranslateY.current) }
  ]
}}
```

### Usage Instructions
- **Zoom**: Jepit dua jari dan tarik keluar/masuk
- **Pan**: Geser satu jari untuk memindahkan gambar
- **Reset**: Tap icon refresh di header untuk reset zoom/pan
- **Close**: Tap icon close atau area di luar gambar 