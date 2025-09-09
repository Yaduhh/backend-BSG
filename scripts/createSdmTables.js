const { sequelize } = require('../config/database');

const createSdmTables = async () => {
  try {
    console.log('🔨 Creating SDM tables...');

    // Create sdm_divisi table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sdm_divisi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_divisi VARCHAR(255) NOT NULL COMMENT 'Nama divisi/cabang',
        keterangan TEXT COMMENT 'Keterangan divisi',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif divisi',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nama_divisi (nama_divisi),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table sdm_divisi created successfully');

    // Create sdm_jabatan table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sdm_jabatan (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_jabatan VARCHAR(255) NOT NULL COMMENT 'Nama jabatan/sub-divisi',
        divisi_id INT NOT NULL COMMENT 'ID divisi',
        keterangan TEXT COMMENT 'Keterangan jabatan',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif jabatan',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nama_jabatan (nama_jabatan),
        INDEX idx_divisi_id (divisi_id),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (divisi_id) REFERENCES sdm_divisi(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table sdm_jabatan created successfully');

    // Create sdm_data table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sdm_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        
        -- Data Personal
        nama VARCHAR(255) NOT NULL COMMENT 'Nama lengkap karyawan',
        tempat_lahir VARCHAR(255) COMMENT 'Tempat lahir',
        tanggal_lahir DATE COMMENT 'Tanggal lahir',
        no_hp VARCHAR(20) COMMENT 'Nomor HP',
        email VARCHAR(255) COMMENT 'Email karyawan',
        media_sosial VARCHAR(255) COMMENT 'Media sosial',
        
        -- Data Keluarga
        nama_pasangan VARCHAR(255) COMMENT 'Nama pasangan',
        nama_anak TEXT COMMENT 'Nama anak-anak',
        no_hp_pasangan VARCHAR(20) COMMENT 'Nomor HP pasangan',
        kontak_darurat VARCHAR(255) COMMENT 'Nama dan HP kontak darurat',
        
        -- Data Alamat
        alamat_sekarang TEXT COMMENT 'Alamat tempat tinggal sekarang',
        link_map_sekarang VARCHAR(500) COMMENT 'Link Google Map alamat sekarang',
        alamat_asal TEXT COMMENT 'Alamat daerah asal',
        link_map_asal VARCHAR(500) COMMENT 'Link Google Map alamat asal',
        
        -- Data Orang Tua
        nama_orang_tua VARCHAR(255) COMMENT 'Nama orang tua',
        alamat_orang_tua TEXT COMMENT 'Alamat orang tua',
        link_map_orang_tua VARCHAR(500) COMMENT 'Link Google Map alamat orang tua',
        
        -- Data Kerja
        jabatan_id INT NOT NULL COMMENT 'ID jabatan',
        tanggal_bergabung DATE COMMENT 'Tanggal bergabung',
        lama_bekerja VARCHAR(100) COMMENT 'Lama bekerja',
        
        -- Data Training
        training_dasar BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Training dasar',
        training_skillo BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Training skillo',
        training_leadership BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Training leadership',
        training_lanjutan BOOLEAN NOT NULL DEFAULT FALSE COMMENT 'Training lanjutan',
        
        -- Data Gaji
        gaji_pokok DECIMAL(15,2) DEFAULT 0 COMMENT 'Gaji pokok',
        tunjangan_kinerja DECIMAL(15,2) DEFAULT 0 COMMENT 'Tunjangan kinerja',
        tunjangan_posisi DECIMAL(15,2) DEFAULT 0 COMMENT 'Tunjangan posisi',
        uang_makan DECIMAL(15,2) DEFAULT 0 COMMENT 'Uang makan',
        lembur DECIMAL(15,2) DEFAULT 0 COMMENT 'Lembur',
        bonus DECIMAL(15,2) DEFAULT 0 COMMENT 'Bonus',
        total_gaji DECIMAL(15,2) DEFAULT 0 COMMENT 'Total gaji',
        potongan DECIMAL(15,2) DEFAULT 0 COMMENT 'Potongan',
        bpjstk DECIMAL(15,2) DEFAULT 0 COMMENT 'BPJSTK',
        bpjs_kesehatan DECIMAL(15,2) DEFAULT 0 COMMENT 'BPJS Kesehatan',
        bpjs_kes_penambahan DECIMAL(15,2) DEFAULT 0 COMMENT 'BPJS Kesehatan penambahan',
        sp_1_2 DECIMAL(15,2) DEFAULT 0 COMMENT 'SP 1/2',
        pinjaman_karyawan DECIMAL(15,2) DEFAULT 0 COMMENT 'Pinjaman karyawan',
        pph21 DECIMAL(15,2) DEFAULT 0 COMMENT 'PPH21',
        total_potongan DECIMAL(15,2) DEFAULT 0 COMMENT 'Total potongan',
        total_gaji_dibayarkan DECIMAL(15,2) DEFAULT 0 COMMENT 'Total gaji yang dibayarkan',
        
        -- Relasi ke User
        user_id INT NULL COMMENT 'ID user account',
        
        -- Audit
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_nama (nama),
        INDEX idx_jabatan_id (jabatan_id),
        INDEX idx_user_id (user_id),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (jabatan_id) REFERENCES sdm_jabatan(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table sdm_data created successfully');

    // Insert sample data for sdm_divisi
    const sampleDivisi = [
      ['MANAJEMEN', 'Divisi manajemen perusahaan', 1],
      ['SECURITY & UMUM', 'Divisi security dan umum', 1],
      ['SUPPORT SYSTEM', 'Divisi support system', 1],
      ['TOKO TEPUNG', 'Divisi toko tepung', 1],
      ['BSG KARAWACI', 'Cabang BSG Karawaci', 1],
      ['BSG BSD', 'Cabang BSG BSD', 1],
      ['BSG BINTARO', 'Cabang BSG Bintaro', 1],
      ['BSG CONDET', 'Cabang BSG Condet', 1],
      ['BSG BANDUNG', 'Cabang BSG Bandung', 1],
      ['BSG BUAH BATU', 'Cabang BSG Buah Batu', 1],
      ['BSG PAGESANGAN', 'Cabang BSG Pagesangan', 1],
      ['BSG AMPEL', 'Cabang BSG Ampel', 1],
      ['BSG SIDOARJO', 'Cabang BSG Sidoarjo', 1],
      ['OUTLET KARANG', 'Outlet Karang', 1],
      ['OUTLET PERMATA', 'Outlet Permata', 1],
      ['TOTAL KESELURUHAN', 'Total keseluruhan', 1]
    ];

    for (const data of sampleDivisi) {
      await sequelize.query(`
        INSERT INTO sdm_divisi (nama_divisi, keterangan, created_by)
        VALUES (?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sdm_divisi');

    // Insert sample data for sdm_jabatan (BSG BSD)
    const sampleJabatan = [
      ['MO, WK & PR', 6, 'Manager Operasional, Wakil Kepala & Public Relations', 1],
      ['KASIR & ADM. PESANAN', 6, 'Kasir dan Admin Pesanan', 1],
      ['KOKI', 6, 'Koki dan tim dapur', 1],
      ['PELAYANAN & UMUM', 6, 'Pelayanan dan umum', 1],
      ['SECURITY', 6, 'Security', 1]
    ];

    for (const data of sampleJabatan) {
      await sequelize.query(`
        INSERT INTO sdm_jabatan (nama_jabatan, divisi_id, keterangan, created_by)
        VALUES (?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sdm_jabatan');

    // Insert sample data for sdm_data
    const sampleSdmData = [
      ['Manager Operasional', 'Jakarta', '1990-01-15', '+62 812-3456-7890', 'manager@bsg.com', '@manager', 'Sarah Johnson', 'Ahmad (8), Fatimah (5)', '+62 812-3456-7891', 'Budi Santoso (+62 812-3456-7892)', 'Jl. BSD Raya No. 123, Tangerang', 'maps.google.com/bsd-address', 'Jl. Sudirman No. 45, Jakarta', 'maps.google.com/original-address', 'Ahmad & Siti', 'Jl. Veteran No. 67, Jakarta', 'maps.google.com/parents-address', 1, '2020-03-15', '3 tahun 8 bulan', true, true, true, true, 5000000, 1000000, 500000, 500000, 0, 0, 7000000, 0, 100000, 150000, 0, 0, 0, 50000, 300000, 5000000, null, 1],
      ['Wakil Kepala', 'Bandung', '1988-05-20', '+62 812-3456-7893', 'wakil@bsg.com', '@wakil', 'Lisa Brown', 'Hasan (10)', '+62 812-3456-7894', 'John Doe (+62 812-3456-7895)', 'Jl. BSD Raya No. 124, Tangerang', 'maps.google.com/bsd-address-2', 'Jl. Asia Afrika No. 12, Bandung', 'maps.google.com/bandung-address', 'Hasan & Aminah', 'Jl. Braga No. 34, Bandung', 'maps.google.com/bandung-parents', 1, '2019-08-10', '4 tahun 3 bulan', true, true, true, false, 4500000, 800000, 400000, 500000, 0, 0, 6200000, 0, 90000, 135000, 0, 0, 0, 45000, 270000, 5930000, null, 1],
      ['Public Relations', 'Surabaya', '1992-03-10', '+62 812-3456-7896', 'pr@bsg.com', '@pr', 'Michael Wilson', 'Siti (6)', '+62 812-3456-7897', 'Jane Smith (+62 812-3456-7898)', 'Jl. BSD Raya No. 125, Tangerang', 'maps.google.com/bsd-address-3', 'Jl. Tunjungan No. 56, Surabaya', 'maps.google.com/surabaya-address', 'Ahmad & Fatimah', 'Jl. Gubeng No. 78, Surabaya', 'maps.google.com/surabaya-parents', 1, '2021-01-20', '2 tahun 10 bulan', true, true, false, false, 4000000, 600000, 300000, 500000, 0, 0, 5400000, 0, 80000, 120000, 0, 0, 0, 40000, 240000, 5160000, null, 1]
    ];

    for (const data of sampleSdmData) {
      await sequelize.query(`
        INSERT INTO sdm_data (
          nama, tempat_lahir, tanggal_lahir, no_hp, email, media_sosial,
          nama_pasangan, nama_anak, no_hp_pasangan, kontak_darurat,
          alamat_sekarang, link_map_sekarang, alamat_asal, link_map_asal,
          nama_orang_tua, alamat_orang_tua, link_map_orang_tua,
          jabatan_id, tanggal_bergabung, lama_bekerja,
          training_dasar, training_skillo, training_leadership, training_lanjutan,
          gaji_pokok, tunjangan_kinerja, tunjangan_posisi, uang_makan, lembur, bonus, total_gaji,
          potongan, bpjstk, bpjs_kesehatan, bpjs_kes_penambahan, sp_1_2, pinjaman_karyawan, pph21,
          total_potongan, total_gaji_dibayarkan, user_id, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sdm_data');

    console.log('\n🎉 All SDM tables created and populated successfully!');
    console.log('📊 Tables created:');
    console.log('   - sdm_divisi (16 sample divisions)');
    console.log('   - sdm_jabatan (5 sample positions for BSG BSD)');
    console.log('   - sdm_data (3 sample employees)');

  } catch (error) {
    console.error('❌ Error creating SDM tables:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createSdmTables()
    .then(() => {
      console.log('🎉 Table creation process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Table creation process failed:', error);
      process.exit(1);
    });
}

module.exports = createSdmTables;
