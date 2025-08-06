# Text Editor POSKAS v2 - Dokumentasi

## Overview
Text Editor POSKAS v2 adalah fitur yang memungkinkan admin untuk membuat POSKAS dengan text editor yang dapat menyelipkan gambar inline dalam teks, seperti text editor artikel. Semua konten (teks + gambar) disimpan dalam satu field `isi_poskas`.

## Fitur Utama

### 1. Text Formatting
- **Bold**: Menggunakan tag `<b>text</b>`
- **Italic**: Menggunakan tag `<i>text</i>`
- **Underline**: Menggunakan tag `<u>text</u>`

### 2. Image Upload & Inline Insertion
- Upload gambar dari galeri
- Insert gambar inline dalam teks menggunakan tag `[IMG:id]`
- Preview gambar dalam teks sesuai posisi yang dipilih

### 3. Real-time Preview
- Preview konten dengan formatting dan gambar inline
- Parsing HTML-like tags untuk display
- Tampilan gambar sesuai posisi dalam teks

## Struktur Database

### Tabel: `keuangan_poskas`
```sql
CREATE TABLE keuangan_poskas (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_user INT NOT NULL,
  tanggal_poskas DATE NOT NULL,
  isi_poskas TEXT NOT NULL,  -- Semua konten disimpan di sini
  images JSON NULL,           -- Metadata gambar
  status_deleted TINYINT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (id_user) REFERENCES users(id)
);
```

### Format Konten dalam `isi_poskas`
```
Ini adalah teks normal.
<b>Ini adalah teks bold</b>
<i>Ini adalah teks italic</i>
<u>Ini adalah teks underline</u>
[IMG:1234567890]  -- Tag gambar inline
Lanjutan teks setelah gambar.
```

## API Endpoints

### POST `/api/keuangan-poskas`
**Request Body:**
```json
{
  "tanggal_poskas": "2024-01-15",
  "isi_poskas": "Ini adalah teks dengan <b>formatting</b> dan [IMG:1234567890] gambar inline",
  "images": [
    {
      "id": 1234567890,
      "uri": "file:///path/to/image.jpg",
      "name": "image_1234567890.jpg"
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
    "isi_poskas": "Ini adalah teks dengan <b>formatting</b> dan [IMG:1234567890] gambar inline",
    "images": [...],
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### PUT `/api/keuangan-poskas/:id`
**Request Body:** Sama seperti POST

## Frontend Implementation

### State Management
```javascript
const [isiPoskas, setIsiPoskas] = useState('');
const [isBold, setIsBold] = useState(false);
const [isItalic, setIsItalic] = useState(false);
const [isUnderline, setIsUnderline] = useState(false);
const [uploadedImages, setUploadedImages] = useState([]);
```

### Key Functions

#### 1. Image Upload & Insertion
```javascript
const insertImageInline = (image) => {
  const imageTag = `[IMG:${image.id}]`;
  const currentText = isiPoskas;
  const cursorPosition = textInputRef.current ? 
    textInputRef.current._lastNativeSelection?.start || currentText.length : 
    currentText.length;
  
  const newText = currentText.slice(0, cursorPosition) + 
                  imageTag + 
                  currentText.slice(cursorPosition);
  setIsiPoskas(newText);
};
```

#### 2. Text Formatting
```javascript
const applyFormatting = () => {
  if (!textInputRef.current) return;
  
  const currentText = isiPoskas;
  const selection = textInputRef.current._lastNativeSelection;
  
  if (!selection || selection.start === selection.end) return;
  
  const selectedText = currentText.slice(selection.start, selection.end);
  let formattedText = selectedText;
  
  if (isBold) formattedText = `<b>${formattedText}</b>`;
  if (isItalic) formattedText = `<i>${formattedText}</i>`;
  if (isUnderline) formattedText = `<u>${formattedText}</u>`;
  
  const newText = currentText.slice(0, selection.start) + 
                  formattedText + 
                  currentText.slice(selection.end);
  setIsiPoskas(newText);
};
```

#### 3. Content Preview
```javascript
const renderContentPreview = () => {
  const content = isiPoskas;
  const parts = [];
  let lastIndex = 0;
  
  // Find all image tags
  const imageRegex = /\[IMG:(\d+)\]/g;
  let match;
  
  while ((match = imageRegex.exec(content)) !== null) {
    const imageId = parseInt(match[1]);
    const image = uploadedImages.find(img => img.id === imageId);
    
    if (image) {
      // Add text before image
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Add image
      parts.push({
        type: 'image',
        image: image
      });
      
      lastIndex = match.index + match[0].length;
    }
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    parts.push({
      type: 'text',
      content: content.slice(lastIndex)
    });
  }
  
  return parts;
};
```

#### 4. Text Parsing for Display
```javascript
const parseFormattedText = (text) => {
  let parsedText = text;
  parsedText = parsedText.replace(/<b>(.*?)<\/b>/g, '**$1**');
  parsedText = parsedText.replace(/<i>(.*?)<\/i>/g, '*$1*');
  parsedText = parsedText.replace(/<u>(.*?)<\/u>/g, '__$1__');
  return parsedText;
};
```

## UI Components

### 1. Text Editor Toolbar
- Format buttons (B/I/U) dengan visual feedback
- Image upload button
- Apply formatting button (✓)
- Clear formatting button (✕)

### 2. Text Input
- Multiline text input
- Real-time character counter
- Visual formatting indicators
- Placeholder text dengan instruksi

### 3. Image Management
- Horizontal scrollable image list
- Individual image removal
- "Hapus Semua" functionality
- Image numbering

### 4. Preview Section
- Real-time content preview
- Inline image display
- Formatting preview
- Responsive layout

## Dependencies

### Frontend
```json
{
  "expo-image-picker": "^14.7.1",
  "@expo/vector-icons": "^13.0.0"
}
```

### Backend
```json
{
  "mysql2": "^3.6.5",
  "express": "^4.18.2"
}
```

## Usage Examples

### 1. Membuat POSKAS dengan Formatting
1. Ketik teks di text input
2. Pilih teks yang ingin diformat
3. Tap tombol B/I/U sesuai format yang diinginkan
4. Tap tombol ✓ untuk menerapkan format
5. Teks akan berubah menjadi `<b>teks bold</b>`

### 2. Menyisipkan Gambar Inline
1. Tap tombol gambar di toolbar
2. Pilih gambar dari galeri
3. Gambar akan otomatis disisipkan di posisi cursor
4. Tag `[IMG:1234567890]` akan muncul di text input
5. Preview akan menampilkan gambar di posisi yang tepat

### 3. Menghapus Gambar
1. Tap tombol ✕ pada gambar di daftar gambar
2. Tag gambar akan otomatis dihapus dari text input
3. Preview akan diperbarui

## Error Handling

### Frontend
- Permission denied untuk akses galeri
- Image upload failure
- Text input validation
- Character limit exceeded

### Backend
- Database connection errors
- Invalid data format
- Missing required fields
- Permission validation

## Future Enhancements

### 1. Advanced Formatting
- Text alignment (left, center, right)
- Font size options
- Text color selection
- Bullet points and numbering

### 2. Image Features
- Image resizing
- Image cropping
- Multiple image selection
- Image compression

### 3. Content Management
- Draft saving
- Auto-save functionality
- Version history
- Content templates

### 4. Export Options
- PDF export
- HTML export
- Plain text export
- Image extraction

## Notes

### Performance Considerations
- Image compression untuk mengurangi ukuran file
- Lazy loading untuk preview gambar
- Debounced text input untuk performa yang lebih baik

### Security Considerations
- File type validation untuk upload gambar
- File size limits
- Sanitasi input text untuk mencegah XSS
- Permission checks untuk akses data

### Compatibility
- React Native 0.70+
- Expo SDK 49+
- MySQL 8.0+
- Node.js 18+

## Migration Notes

### Dari v1 ke v2
1. Kolom `formatted_content` dihapus
2. Semua konten disimpan dalam `isi_poskas`
3. Format gambar berubah dari `[IMAGE:id]` ke `[IMG:id]`
4. Formatting menggunakan HTML-like tags

### Database Changes
```sql
-- Menghapus kolom formatted_content
ALTER TABLE keuangan_poskas DROP COLUMN formatted_content;
```

## Troubleshooting

### Common Issues
1. **Formatting tidak bekerja**: Pastikan teks dipilih sebelum tap tombol ✓
2. **Gambar tidak muncul**: Periksa permission galeri dan file path
3. **Preview tidak update**: Refresh komponen atau restart aplikasi
4. **Database error**: Periksa koneksi database dan struktur tabel

### Debug Tips
- Gunakan console.log untuk debug state changes
- Periksa network tab untuk API calls
- Validasi format data sebelum save
- Test dengan data minimal terlebih dahulu 