# Frontend Change Password Screen Documentation

## Overview
Screen untuk mengubah password admin dengan UI yang modern, elegan, dan user-friendly.

## File Location
```
frontend/src/screens/admin/ChangePasswordScreen.js
```

## Features

### 1. Modern UI Design
- Clean dan minimalist design
- Card-based layout dengan shadow effects
- Consistent color scheme dengan AdminProfileScreen
- Responsive design untuk berbagai ukuran layar

### 2. Password Input Fields
- **Current Password**: Input untuk password saat ini
- **New Password**: Input untuk password baru
- **Confirm Password**: Input untuk konfirmasi password baru
- Show/hide password toggle untuk setiap field
- Real-time validation feedback

### 3. Password Requirements Display
- Visual checklist untuk password requirements
- Real-time validation dengan checkmark icons
- Requirements:
  - Minimal 6 karakter
  - Berbeda dari password lama
  - Konfirmasi password cocok

### 4. Security Features
- Password visibility toggle
- Input validation sebelum submit
- Secure password handling
- Automatic logout setelah berhasil ganti password

### 5. User Experience
- Loading state saat proses ganti password
- Error handling dengan alert messages
- Success feedback dengan auto logout
- Cancel button untuk kembali ke screen sebelumnya

## Components

### Main Component: ChangePasswordScreen
```javascript
const ChangePasswordScreen = () => {
  // State management
  // Form handling
  // API integration
  // Navigation
}
```

### Custom Component: PasswordInput
```javascript
const PasswordInput = ({ 
  label, 
  value, 
  onChangeText, 
  placeholder, 
  showPassword, 
  setShowPassword,
  error 
}) => {
  // Password input with show/hide toggle
  // Error display
  // Styling
}
```

## State Management

### Form Data
```javascript
const [formData, setFormData] = useState({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
});
```

### Password Visibility
```javascript
const [showCurrentPassword, setShowCurrentPassword] = useState(false);
const [showNewPassword, setShowNewPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);
```

### Loading State
```javascript
const [loading, setLoading] = useState(false);
```

## API Integration

### Service Call
```javascript
await adminProfileService.changePassword({
  currentPassword: formData.currentPassword,
  newPassword: formData.newPassword,
  confirmPassword: formData.confirmPassword,
});
```

### Error Handling
```javascript
catch (error) {
  console.error('Error changing password:', error);
  Alert.alert('Error', error.response?.data?.message || 'Gagal mengubah password');
}
```

## Navigation

### Navigation Setup
```javascript
const navigation = useNavigation();
```

### Navigation Actions
- **Back**: `navigation.goBack()`
- **Success**: Auto logout dengan `logout()` dari AuthContext

## UI Sections

### 1. Header
- Back button dengan arrow icon
- Screen title "Change Password"
- Consistent styling dengan AdminProfileScreen

### 2. Info Card
- Blue-themed information card
- Security tips dan warning
- Icon dengan background color

### 3. Password Form
- White card dengan shadow
- Three password input fields
- Password requirements checklist
- Action buttons (Cancel & Change Password)

### 4. Security Tips
- Numbered tips untuk password security
- Yellow-themed styling
- Best practices untuk password

## Styling

### Color Scheme
- **Primary**: Red (#DC2626) untuk action buttons
- **Secondary**: Blue (#3B82F6) untuk info cards
- **Success**: Green (#10B981) untuk checkmarks
- **Warning**: Yellow (#F59E0B) untuk tips
- **Gray**: Various shades untuk text dan backgrounds

### Typography
- **Font Family**: Poppins (font-poppins)
- **Weights**: Regular, Medium, Semibold, Bold
- **Sizes**: xs, sm, base, lg, xl

### Shadows
```javascript
style={{
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
}}
```

## Validation Rules

### Frontend Validation
1. **Required Fields**: Semua field harus diisi
2. **Password Length**: Minimal 6 karakter
3. **Password Match**: New password dan confirm password harus sama
4. **Different Password**: Password baru tidak boleh sama dengan password lama

### Real-time Validation
- Password requirements checklist update secara real-time
- Visual feedback dengan checkmark icons
- Color-coded validation status

## Error Handling

### Validation Errors
```javascript
Alert.alert('Error', 'Semua field harus diisi');
Alert.alert('Error', 'Password baru minimal 6 karakter');
Alert.alert('Error', 'Password baru dan konfirmasi password tidak cocok');
Alert.alert('Error', 'Password baru tidak boleh sama dengan password lama');
```

### API Errors
```javascript
Alert.alert('Error', error.response?.data?.message || 'Gagal mengubah password');
```

### Success Handling
```javascript
Alert.alert(
  'Sukses',
  'Password berhasil diubah. Anda akan logout untuk keamanan.',
  [
    {
      text: 'OK',
      onPress: () => {
        logout();
      },
    },
  ]
);
```

## Integration Points

### Navigation
- Added to `AdminMainStackNavigator` in `AppNavigator.js`
- Accessible from `AdminProfileScreen` via menu item

### Services
- Uses `adminProfileService.changePassword()`
- Integrates with `AuthContext` for logout functionality

### Context
- Uses `useAuth()` for logout functionality
- Uses `useNavigation()` for navigation

## Security Considerations

1. **Password Visibility**: Toggle untuk show/hide password
2. **Input Validation**: Client-side validation sebelum API call
3. **Secure Transmission**: Password dikirim melalui HTTPS
4. **Auto Logout**: User otomatis logout setelah berhasil ganti password
5. **No Password Storage**: Password tidak disimpan di local storage

## Testing Considerations

### Unit Tests
- Form validation logic
- Password requirements checking
- Error handling
- Success flow

### Integration Tests
- API integration
- Navigation flow
- Context integration

### UI Tests
- Password visibility toggle
- Real-time validation feedback
- Loading states
- Error messages display

## Accessibility

### Features
- Proper labels untuk semua input fields
- Clear error messages
- Loading indicators
- Keyboard navigation support
- Screen reader compatibility

### Best Practices
- High contrast colors
- Adequate touch targets
- Clear visual hierarchy
- Consistent navigation patterns 