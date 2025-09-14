const pathToModule = (p) => {
  // Normalisasi: pastikan diawali dengan '/'
  if (!p.startsWith('/')) return `/${p}`
  return p
}

// Prefix endpoint yang diizinkan OWNER untuk melakukan write (POST/PUT/PATCH/DELETE)
// Selain ini, OWNER hanya boleh READ (GET/HEAD/OPTIONS)
const OWNER_WRITE_ALLOWLIST = [
  // PIC MENU
  '/pic-menu',
  // Kelola Akun
  '/users',
  // Daftar Komplain
  '/daftar-komplain',
  // Daftar Saran
  '/saran',
  // Chat
  '/chat',
  '/chat-group',
  // Daftar Tugas
  '/daftar-tugas',
]

module.exports = function ownerReadOnly(req, res, next) {
  try {
    // Allow read-only methods untuk semua role
    const method = (req.method || 'GET').toUpperCase()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return next()
    }

    // Jika tidak ada user (akan ditangani oleh auth per-route), lewati saja
    if (!req.user) return next()

    // Hanya batasi untuk role owner
    if (req.user.role !== 'owner') return next()

    // Cek allowlist berdasarkan prefix path setelah '/api'
    const originalUrl = req.originalUrl || req.url || ''
    // Hilangkan prefix '/api' bila ada, agar daftar prefix simpel
    const path = pathToModule(originalUrl.replace(/^\/api/, ''))

    const isAllowed = OWNER_WRITE_ALLOWLIST.some(prefix => path.startsWith(prefix))

    if (!isAllowed) {
      return res.status(403).json({
        success: false,
        message: 'Owner hanya memiliki akses baca pada modul ini'
      })
    }

    return next()
  } catch (err) {
    // Jangan sampai middleware ini memblokir error lain
    return next(err)
  }
}
