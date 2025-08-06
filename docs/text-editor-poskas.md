# Text Editor POSKAS dengan Formatting dan Upload Gambar

## Overview
Fitur text editor canggih untuk membuat POSKAS dengan kemampuan formatting teks (bold, italic, underline) dan upload gambar.

## Fitur Utama

### 1. Text Formatting
- **Bold (B)**: Teks tebal untuk penekanan
- **Italic (I)**: Teks miring untuk penekanan
- **Underline (U)**: Teks bergaris bawah
- **Kombinasi**: Bisa menggunakan multiple formatting sekaligus

### 2. Upload Gambar
- Upload multiple gambar dari galeri
- Preview gambar sebelum upload
- Hapus gambar individual atau semua sekaligus
- Urutan gambar dipertahankan

### 3. UI/UX Features
- Progress bar untuk karakter (maksimal 2000)
- Preview real-time dengan formatting
- Status formatting aktif
- Tips dan panduan penggunaan

## Struktur Database

### Tabel: `keuangan_poskas`
```sql
ALTER TABLE keuangan_poskas 
ADD COLUMN formatted_content TEXT NULL AFTER isi_poskas,
ADD COLUMN images JSON NULL AFTER formatted_content;
```

### Kolom Baru:
- `formatted_content`: Menyimpan teks dengan format markdown
- `images`: JSON array untuk menyimpan data gambar

## API Endpoints

### POST `/keuangan-poskas`
**Request Body:**
```json
{
  "tanggal_poskas": "2024-01-15",
  "isi_poskas": "Teks biasa tanpa format",
  "formatted_content": "**Teks bold** *italic* __underline__",
  "images": [
    {
      "uri": "file://path/to/image1.jpg",
      "id": 1703123456789,
      "name": "image_1703123456789.jpg"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Keuangan poskas created successfully",
  "data": {
    "id": 1,
    "id_user": 1,
    "tanggal_poskas": "2024-01-15",
    "isi_poskas": "Teks biasa tanpa format",
    "formatted_content": "**Teks bold** *italic* __underline__",
    "images": "[{\"uri\":\"file://path/to/image1.jpg\",\"id\":1703123456789,\"name\":\"image_1703123456789.jpg\"}]",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

## Frontend Implementation

### Komponen: `AdminCreatePoskasScreen.js`

#### State Management:
```javascript
const [formattedContent, setFormattedContent] = useState('');
const [isBold, setIsBold] = useState(false);
const [isItalic, setIsItalic] = useState(false);
const [isUnderline, setIsUnderline] = useState(false);
const [uploadedImages, setUploadedImages] = useState([]);
```

#### Formatting Functions:
```javascript
const toggleFormat = (format) => {
  switch (format) {
    case 'bold':
      setIsBold(!isBold);
      break;
    case 'italic':
      setIsItalic(!isItalic);
      break;
    case 'underline':
      setIsUnderline(!isUnderline);
      break;
  }
};

const getTextStyle = () => {
  const style = {};
  if (isBold) style.fontWeight = 'bold';
  if (isItalic) style.fontStyle = 'italic';
  if (isUnderline) style.textDecorationLine = 'underline';
  return style;
};
```

#### Image Upload:
```javascript
const pickImage = async () => {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Aplikasi memerlukan izin untuk mengakses galeri foto');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newImage = {
        uri: result.assets[0].uri,
        id: Date.now(),
        name: `image_${Date.now()}.jpg`
      };
      setUploadedImages([...uploadedImages, newImage]);
    }
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Gagal memilih gambar');
  }
};
```

## UI Components

### 1. Text Editor Toolbar
- Tombol formatting (B/I/U) dengan status aktif
- Tombol upload gambar
- Tombol clear formatting
- Status formatting aktif

### 2. Text Input
- Real-time formatting preview
- Character counter dengan progress bar
- Warning saat hampir penuh

### 3. Image Gallery
- Horizontal scroll untuk multiple images
- Nomor urut pada setiap gambar
- Tombol hapus individual
- Tombol hapus semua

### 4. Preview Card
- Preview teks dengan formatting
- Preview gambar terlampir
- Status formatting aktif

## Dependencies

### Frontend:
```json
{
  "expo-image-picker": "^16.1.4"
}
```

### Backend:
```json
{
  "mysql2": "^3.0.0"
}
```

## Usage Examples

### 1. Membuat POSKAS dengan Formatting
1. Tap tombol **B** untuk bold
2. Ketik teks yang ingin di-bold
3. Tap tombol **I** untuk italic
4. Ketik teks yang ingin di-italic
5. Format akan diterapkan secara real-time

### 2. Upload Gambar
1. Tap tombol gambar (📷)
2. Pilih gambar dari galeri
3. Gambar akan muncul di preview
4. Bisa upload multiple gambar
5. Urutan gambar dipertahankan

### 3. Preview dan Submit
1. Lihat preview di bagian bawah
2. Pastikan semua data benar
3. Tap "Buat POSKAS"
4. Data akan tersimpan dengan format dan gambar

## Error Handling

### Permission Errors:
- Alert jika izin galeri ditolak
- Panduan untuk mengaktifkan izin

### Upload Errors:
- Alert jika gagal upload gambar
- Retry mechanism

### Validation:
- Minimal 1 karakter untuk isi POSKAS
- Maksimal 2000 karakter
- Tanggal wajib diisi

## Future Enhancements

1. **Rich Text Editor**: Editor WYSIWYG yang lebih canggih
2. **Image Compression**: Kompresi gambar otomatis
3. **Cloud Storage**: Upload gambar ke cloud storage
4. **Markdown Preview**: Preview markdown yang lebih baik
5. **Template**: Template POSKAS yang bisa digunakan berulang

## Notes

- Formatting menggunakan markdown syntax
- Gambar disimpan sebagai JSON array
- Real-time preview untuk user experience yang lebih baik
- Responsive design untuk berbagai ukuran layar
- Accessibility features untuk pengguna difabel 