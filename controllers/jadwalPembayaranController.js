const { JadwalPembayaran, User, PicKategori } = require('../models');
const { Op } = require('sequelize');

// Get all jadwal pembayaran (Owner bisa lihat semua, Admin hanya yang mereka handle)
const getAllJadwalPembayaran = async (req, res) => {
  try {
    const { user } = req;
    let whereCondition = { status_deleted: false };

    // Jika bukan owner, hanya tampilkan kategori yang mereka handle
    let allowedKategori = [];
    if (user.role !== 'owner') {
      const picKategori = await PicKategori.findAll({
        where: { 
          pic_id: user.id,
          status_deleted: false 
        },
        attributes: ['kategori']
      });
      allowedKategori = picKategori.map(pk => pk.kategori);

      // Jika admin tidak punya kategori yang di-assign, fallback: tampilkan semua
      // (Sebelumnya mengembalikan data kosong). Owner tetap melihat semua.
      if (allowedKategori.length === 0) {
        if (user.role === 'admin') {
          // Biarkan tanpa filter kategori -> semua data akan ditampilkan
        } else {
          return res.json({
            success: true,
            data: []
          });
        }
      } else {
        whereCondition.kategori = { [Op.in]: allowedKategori };
      }
    }

    const jadwalPembayaran = await JadwalPembayaran.findAll({
      where: whereCondition,
      order: [['kategori', 'ASC'], ['nama_item', 'ASC']]
    });

    res.json({
      success: true,
      data: jadwalPembayaran
    });
  } catch (error) {
    console.error('Error getting jadwal pembayaran:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jadwal pembayaran'
    });
  }
};

// Get jadwal pembayaran by ID
const getJadwalPembayaranById = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const jadwalPembayaran = await JadwalPembayaran.findOne({
      where: { 
        id: id,
        status_deleted: false 
      },
    });

    if (!jadwalPembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pembayaran tidak ditemukan'
      });
    }

    // Cek permission: Owner bisa akses semua, Admin hanya yang mereka handle berdasarkan kategori
    if (user.role !== 'owner') {
      const picKategori = await PicKategori.findOne({
        where: { 
          kategori: jadwalPembayaran.kategori,
          pic_id: user.id,
          status_deleted: false 
        }
      });
      
      if (!picKategori) {
        return res.status(403).json({
          success: false,
          message: 'Anda tidak memiliki akses ke jadwal pembayaran ini'
        });
      }
    }

    res.json({
      success: true,
      data: jadwalPembayaran
    });
  } catch (error) {
    console.error('Error getting jadwal pembayaran by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data jadwal pembayaran'
    });
  }
};

// Create new jadwal pembayaran
const createJadwalPembayaran = async (req, res) => {
  try {
    const { user } = req;
    const { 
      nama_item, 
      kategori, 
      tanggal_jatuh_tempo,
      outlet,
      sewa,
      pemilik_sewa,
      no_kontak_pemilik_sewa,
      no_rekening,
      bulan,
      tahun
    } = req.body;

    // Validasi input
    if (!nama_item || !kategori) {
      return res.status(400).json({
        success: false,
        message: 'Nama item dan kategori harus diisi'
      });
    }

    // Kebijakan dilonggarkan: Admin diperbolehkan membuat item meskipun belum ditetapkan sebagai PIC kategori
    // Catatan: Validasi akses tetap diberlakukan pada update dan delete.

    const jadwalPembayaran = await JadwalPembayaran.create({
      nama_item,
      kategori,
      tanggal_jatuh_tempo,
      outlet,
      sewa,
      pemilik_sewa,
      no_kontak_pemilik_sewa,
      no_rekening,
      bulan,
      tahun
    });

    // Ambil data yang baru dibuat
    const jadwalPembayaranWithPic = await JadwalPembayaran.findByPk(jadwalPembayaran.id);

    res.status(201).json({
      success: true,
      message: 'Jadwal pembayaran berhasil dibuat',
      data: jadwalPembayaranWithPic
    });
  } catch (error) {
    console.error('Error creating jadwal pembayaran:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat membuat jadwal pembayaran'
    });
  }
};

// Update jadwal pembayaran
const updateJadwalPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;
    const { 
      nama_item, 
      kategori, 
      tanggal_jatuh_tempo,
      outlet,
      sewa,
      pemilik_sewa,
      no_kontak_pemilik_sewa,
      no_rekening,
      bulan,
      tahun
    } = req.body;

    const jadwalPembayaran = await JadwalPembayaran.findOne({
      where: { 
        id: id,
        status_deleted: false 
      }
    });

    if (!jadwalPembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pembayaran tidak ditemukan'
      });
    }

    // Cek permission: Owner bisa edit semua, Admin hanya yang mereka handle berdasarkan kategori
    // Kebijakan dilonggarkan: Admin diperbolehkan mengedit item meskipun belum ditetapkan sebagai PIC kategori
    // Catatan: Pengelolaan PIC tetap dapat digunakan untuk kontrol tampilan atau kebijakan lain.

    // Update data
    await jadwalPembayaran.update({
      nama_item: nama_item || jadwalPembayaran.nama_item,
      kategori: kategori || jadwalPembayaran.kategori,
      tanggal_jatuh_tempo: tanggal_jatuh_tempo || jadwalPembayaran.tanggal_jatuh_tempo,
      outlet: outlet !== undefined ? outlet : jadwalPembayaran.outlet,
      sewa: sewa !== undefined ? sewa : jadwalPembayaran.sewa,
      pemilik_sewa: pemilik_sewa !== undefined ? pemilik_sewa : jadwalPembayaran.pemilik_sewa,
      no_kontak_pemilik_sewa: no_kontak_pemilik_sewa !== undefined ? no_kontak_pemilik_sewa : jadwalPembayaran.no_kontak_pemilik_sewa,
      no_rekening: no_rekening !== undefined ? no_rekening : jadwalPembayaran.no_rekening,
      bulan: bulan !== undefined ? bulan : jadwalPembayaran.bulan,
      tahun: tahun !== undefined ? tahun : jadwalPembayaran.tahun
    });

    // Ambil data terbaru
    const updatedJadwalPembayaran = await JadwalPembayaran.findByPk(id);

    res.json({
      success: true,
      message: 'Jadwal pembayaran berhasil diperbarui',
      data: updatedJadwalPembayaran
    });
  } catch (error) {
    console.error('Error updating jadwal pembayaran:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memperbarui jadwal pembayaran'
    });
  }
};

// Delete jadwal pembayaran (soft delete)
const deleteJadwalPembayaran = async (req, res) => {
  try {
    const { id } = req.params;
    const { user } = req;

    const jadwalPembayaran = await JadwalPembayaran.findOne({
      where: { 
        id: id,
        status_deleted: false 
      }
    });

    if (!jadwalPembayaran) {
      return res.status(404).json({
        success: false,
        message: 'Jadwal pembayaran tidak ditemukan'
      });
    }

    // Cek permission: Owner bisa delete semua, Admin hanya yang mereka handle berdasarkan kategori
    // Kebijakan dilonggarkan: Admin diperbolehkan menghapus item meskipun belum ditetapkan sebagai PIC kategori
    // Catatan: Pertimbangkan audit trail jika diperlukan.

    // Soft delete
    await jadwalPembayaran.update({ status_deleted: true });

    res.json({
      success: true,
      message: 'Jadwal pembayaran berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleting jadwal pembayaran:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menghapus jadwal pembayaran'
    });
  }
};

// Get available PICs (untuk dropdown)
const getAvailablePics = async (req, res) => {
  try {
    const { user } = req;

    let whereCondition = { 
      status_deleted: false,
      status: 'active'
    };

    // Jika bukan owner, hanya tampilkan diri sendiri
    if (user.role !== 'owner') {
      whereCondition.id = user.id;
    }

    const pics = await User.findAll({
      where: whereCondition,
      attributes: ['id', 'nama', 'username'],
      order: [['nama', 'ASC']]
    });

    res.json({
      success: true,
      data: pics
    });
  } catch (error) {
    console.error('Error getting available PICs:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat mengambil data PIC'
    });
  }
};

// Initialize default jadwal pembayaran items
const initializeDefaultItems = async (req, res) => {
  try {
    const { user } = req;

    // Hanya owner yang bisa initialize
    if (user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Hanya owner yang bisa menginisialisasi data default'
      });
    }

    const defaultItems = [
      { nama_item: 'PAJAK/STNK KENDARAAN PRIBADI', kategori: 'pajak_kendaraan_pribadi' },
      { nama_item: 'PAJAK/STNK KENDARAAN OPERASIONAL', kategori: 'pajak_kendaraan_operasional' },
      { nama_item: 'PAJAK/STNK KENDARAAN DISTRIBUSI', kategori: 'pajak_kendaraan_distribusi' },
      { nama_item: 'ASURANSI KENDARAAN PRIBADI', kategori: 'asuransi_kendaraan_pribadi' },
      { nama_item: 'ASURANSI KENDARAAN OPERASIONAL', kategori: 'asuransi_kendaraan_operasional' },
      { nama_item: 'ASURANSI KENDARAAN DISTRIBUSI', kategori: 'asuransi_kendaraan_distribusi' },
      { nama_item: 'SERVICE KENDARAAN PRIBADI', kategori: 'service_kendaraan_pribadi' },
      { nama_item: 'SERVICE KENDARAAN OPERASIONAL', kategori: 'service_kendaraan_operasional' },
      { nama_item: 'SERVICE KENDARAAN DISTRIBUSI', kategori: 'service_kendaraan_distribusi' },
      { nama_item: 'PBB PRIBADI', kategori: 'pbb_pribadi' },
      { nama_item: 'PBB OUTLET', kategori: 'pbb_outlet' },
      { nama_item: 'ANGSURAN PRIBADI', kategori: 'angsuran_pribadi' },
      { nama_item: 'ANGSURAN USAHA', kategori: 'angsuran_usaha' },
      { nama_item: 'SEWA PRIBADI', kategori: 'sewa_pribadi' },
      { nama_item: 'SEWA OUTLET', kategori: 'sewa_outlet' }
    ];

    const createdItems = [];
    
    for (const item of defaultItems) {
      // Cek apakah item sudah ada
      const existingItem = await JadwalPembayaran.findOne({
        where: { 
          nama_item: item.nama_item,
          status_deleted: false 
        }
      });

      if (!existingItem) {
        const newItem = await JadwalPembayaran.create({
          ...item,
          status: 'pending'
        });
        createdItems.push(newItem);
      }
    }

    res.json({
      success: true,
      message: `Berhasil menginisialisasi ${createdItems.length} item default`,
      data: createdItems
    });
  } catch (error) {
    console.error('Error initializing default items:', error);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat menginisialisasi data default'
    });
  }
};

module.exports = {
  getAllJadwalPembayaran,
  getJadwalPembayaranById,
  createJadwalPembayaran,
  updateJadwalPembayaran,
  deleteJadwalPembayaran,
  getAvailablePics,
  initializeDefaultItems
};
