const { sequelize } = require('../config/database');

const createJobdeskSopTables = async () => {
  try {
    console.log('🔨 Creating Jobdesk and SOP tables...');

    // Create jobdesk_divisi table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS jobdesk_divisi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_divisi VARCHAR(255) NOT NULL COMMENT 'Nama divisi untuk jobdesk',
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

    console.log('✅ Table jobdesk_divisi created successfully');

    // Create jobdesk_departments table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS jobdesk_departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        divisi_id INT NOT NULL COMMENT 'ID divisi',
        nama_department VARCHAR(255) NOT NULL COMMENT 'Nama department',
        keterangan TEXT COMMENT 'Keterangan department',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif department',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_divisi_id (divisi_id),
        INDEX idx_nama_department (nama_department),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (divisi_id) REFERENCES jobdesk_divisi(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table jobdesk_departments created successfully');

    // Create jobdesk_positions table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS jobdesk_positions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        department_id INT NOT NULL COMMENT 'ID department',
        nama_position VARCHAR(255) NOT NULL COMMENT 'Nama posisi/jabatan',
        keterangan TEXT COMMENT 'Keterangan posisi',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif posisi',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_department_id (department_id),
        INDEX idx_nama_position (nama_position),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (department_id) REFERENCES jobdesk_departments(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table jobdesk_positions created successfully');

    // Create sop_divisi table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sop_divisi (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nama_divisi VARCHAR(255) NOT NULL COMMENT 'Nama divisi untuk SOP',
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

    console.log('✅ Table sop_divisi created successfully');

    // Create sop_categories table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sop_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        divisi_id INT NOT NULL COMMENT 'ID divisi',
        nama_category VARCHAR(255) NOT NULL COMMENT 'Nama kategori SOP',
        keterangan TEXT COMMENT 'Keterangan kategori',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif kategori',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_divisi_id (divisi_id),
        INDEX idx_nama_category (nama_category),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (divisi_id) REFERENCES sop_divisi(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table sop_categories created successfully');

    // Create sop_procedures table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sop_procedures (
        id INT AUTO_INCREMENT PRIMARY KEY,
        category_id INT NOT NULL COMMENT 'ID kategori SOP',
        judul_procedure VARCHAR(255) NOT NULL COMMENT 'Judul prosedur SOP',
        keterangan TEXT COMMENT 'Keterangan prosedur',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif prosedur',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_category_id (category_id),
        INDEX idx_judul_procedure (judul_procedure),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (category_id) REFERENCES sop_categories(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table sop_procedures created successfully');

    // Create sop_steps table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS sop_steps (
        id INT AUTO_INCREMENT PRIMARY KEY,
        procedure_id INT NOT NULL COMMENT 'ID prosedur SOP',
        step_number INT NOT NULL COMMENT 'Nomor urutan langkah',
        deskripsi_step TEXT NOT NULL COMMENT 'Deskripsi langkah',
        keterangan TEXT COMMENT 'Keterangan tambahan langkah',
        status_aktif BOOLEAN NOT NULL DEFAULT TRUE COMMENT 'Status aktif langkah',
        created_by INT NOT NULL COMMENT 'ID admin yang menginput',
        updated_by INT NULL COMMENT 'ID admin yang mengupdate',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        
        INDEX idx_procedure_id (procedure_id),
        INDEX idx_step_number (step_number),
        INDEX idx_status_aktif (status_aktif),
        INDEX idx_created_by (created_by),
        
        FOREIGN KEY (procedure_id) REFERENCES sop_procedures(id) ON DELETE CASCADE,
        FOREIGN KEY (created_by) REFERENCES users(id),
        FOREIGN KEY (updated_by) REFERENCES users(id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('✅ Table sop_steps created successfully');

    // Insert sample data for jobdesk_divisi
    const sampleJobdeskDivisi = [
      ['DIVISI OUTLET', 'Divisi pengelolaan outlet dan operasional', 1],
      ['DIVISI TEPUNG BOSGIL', 'Divisi produksi dan pengelolaan tepung', 1],
      ['DIVISI DIGITAL MARKETING', 'Divisi pemasaran digital dan media sosial', 1],
      ['DIVISI SECURITY', 'Divisi keamanan dan pengamanan', 1]
    ];

    for (const data of sampleJobdeskDivisi) {
      await sequelize.query(`
        INSERT INTO jobdesk_divisi (nama_divisi, keterangan, created_by)
        VALUES (?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into jobdesk_divisi');

    // Insert sample data for jobdesk_departments
    const sampleJobdeskDepartments = [
      // DIVISI OUTLET
      [1, 'MANAGEMENT OUTLET', 'Department manajemen outlet', 1],
      [1, 'OPERATIONAL', 'Department operasional outlet', 1],
      [1, 'QUALITY CONTROL', 'Department kontrol kualitas', 1],
      
      // DIVISI TEPUNG BOSGIL
      [2, 'PRODUCTION', 'Department produksi tepung', 1],
      [2, 'WAREHOUSE', 'Department gudang dan logistik', 1],
      
      // DIVISI DIGITAL MARKETING
      [3, 'MANAGEMENT', 'Department manajemen digital marketing', 1],
      [3, 'CREATIVE TEAM', 'Department tim kreatif', 1],
      [3, 'SPECIALIST', 'Department spesialis digital', 1],
      
      // DIVISI SECURITY
      [4, 'SECURITY MANAGEMENT', 'Department manajemen keamanan', 1],
      [4, 'SECURITY OPERATIONS', 'Department operasional keamanan', 1]
    ];

    for (const data of sampleJobdeskDepartments) {
      await sequelize.query(`
        INSERT INTO jobdesk_departments (divisi_id, nama_department, keterangan, created_by)
        VALUES (?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into jobdesk_departments');

    // Insert sample data for jobdesk_positions
    const sampleJobdeskPositions = [
      // MANAGEMENT OUTLET
      [1, 'Manager Outlet', 'Posisi manajer outlet', 1],
      [1, 'Supervisor Outlet', 'Posisi supervisor outlet', 1],
      [1, 'Assistant Manager', 'Posisi asisten manajer', 1],
      
      // OPERATIONAL
      [2, 'Cashier', 'Posisi kasir', 1],
      [2, 'Waiter/Waitress', 'Posisi pelayan', 1],
      [2, 'Kitchen Staff', 'Posisi staff dapur', 1],
      [2, 'Cleaning Staff', 'Posisi staff kebersihan', 1],
      
      // QUALITY CONTROL
      [3, 'QC Supervisor', 'Posisi supervisor QC', 1],
      [3, 'Food Inspector', 'Posisi inspektur makanan', 1],
      [3, 'Hygiene Officer', 'Posisi petugas kebersihan', 1],
      
      // PRODUCTION
      [4, 'Manager Produksi', 'Posisi manajer produksi', 1],
      [4, 'Production Supervisor', 'Posisi supervisor produksi', 1],
      [4, 'Machine Operator', 'Posisi operator mesin', 1],
      [4, 'Quality Control', 'Posisi kontrol kualitas', 1],
      
      // WAREHOUSE
      [5, 'Warehouse Manager', 'Posisi manajer gudang', 1],
      [5, 'Inventory Staff', 'Posisi staff inventori', 1],
      [5, 'Logistics Coordinator', 'Posisi koordinator logistik', 1],
      
      // MANAGEMENT (Digital Marketing)
      [6, 'Manager Digital Marketing', 'Posisi manajer digital marketing', 1],
      [6, 'Marketing Director', 'Posisi direktur pemasaran', 1],
      [6, 'Strategy Manager', 'Posisi manajer strategi', 1],
      
      // CREATIVE TEAM
      [7, 'Creator', 'Posisi creator konten', 1],
      [7, 'Editor', 'Posisi editor', 1],
      [7, 'Graphic Designer', 'Posisi desainer grafis', 1],
      [7, 'Video Editor', 'Posisi editor video', 1],
      
      // SPECIALIST
      [8, 'Medsos Specialist', 'Posisi spesialis media sosial', 1],
      [8, 'Ads Specialist', 'Posisi spesialis iklan', 1],
      [8, 'SEO Specialist', 'Posisi spesialis SEO', 1],
      [8, 'Content Writer', 'Posisi penulis konten', 1],
      
      // SECURITY MANAGEMENT
      [9, 'Kepala Security', 'Posisi kepala keamanan', 1],
      [9, 'Security Supervisor', 'Posisi supervisor keamanan', 1],
      [9, 'Security Coordinator', 'Posisi koordinator keamanan', 1],
      
      // SECURITY OPERATIONS
      [10, 'Anggota Security', 'Posisi anggota keamanan', 1],
      [10, 'Patrol Officer', 'Posisi petugas patroli', 1],
      [10, 'CCTV Monitor', 'Posisi monitor CCTV', 1]
    ];

    for (const data of sampleJobdeskPositions) {
      await sequelize.query(`
        INSERT INTO jobdesk_positions (department_id, nama_position, keterangan, created_by)
        VALUES (?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into jobdesk_positions');

    // Insert sample data for sop_divisi
    const sampleSopDivisi = [
      ['DIVISI OUTLET', 'Divisi pengelolaan outlet dan operasional', 1],
      ['DIVISI TEPUNG BOSGIL', 'Divisi produksi dan pengelolaan tepung', 1],
      ['DIVISI SECURITY', 'Divisi keamanan dan pengamanan', 1]
    ];

    for (const data of sampleSopDivisi) {
      await sequelize.query(`
        INSERT INTO sop_divisi (nama_divisi, keterangan, created_by)
        VALUES (?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sop_divisi');

    // Insert sample data for sop_categories
    const sampleSopCategories = [
      // DIVISI OUTLET
      [1, 'OPERATIONAL SOP', 'Kategori SOP operasional outlet', 1],
      [1, 'QUALITY CONTROL', 'Kategori SOP kontrol kualitas', 1],
      
      // DIVISI TEPUNG BOSGIL
      [2, 'PRODUCTION SOP', 'Kategori SOP produksi tepung', 1],
      
      // DIVISI SECURITY
      [3, 'SECURITY PROCEDURES', 'Kategori prosedur keamanan', 1]
    ];

    for (const data of sampleSopCategories) {
      await sequelize.query(`
        INSERT INTO sop_categories (divisi_id, nama_category, keterangan, created_by)
        VALUES (?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sop_categories');

    // Insert sample data for sop_procedures
    const sampleSopProcedures = [
      // OPERATIONAL SOP
      [1, 'SOP Pembukaan Outlet', 'Prosedur pembukaan outlet', 1],
      [1, 'SOP Pelayanan Customer', 'Prosedur pelayanan customer', 1],
      
      // QUALITY CONTROL
      [2, 'SOP Food Safety', 'Prosedur keamanan makanan', 1],
      
      // PRODUCTION SOP
      [3, 'SOP Produksi Tepung', 'Prosedur produksi tepung', 1],
      
      // SECURITY PROCEDURES
      [4, 'SOP Keamanan', 'Prosedur keamanan umum', 1]
    ];

    for (const data of sampleSopProcedures) {
      await sequelize.query(`
        INSERT INTO sop_procedures (category_id, judul_procedure, keterangan, created_by)
        VALUES (?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sop_procedures');

    // Insert sample data for sop_steps
    const sampleSopSteps = [
      // SOP Pembukaan Outlet
      [1, 1, 'Pengecekan kebersihan outlet', 'Pastikan outlet bersih dan siap operasi', 1],
      [1, 2, 'Penyiapan peralatan', 'Siapkan semua peralatan yang diperlukan', 1],
      [1, 3, 'Pengecekan inventory', 'Periksa stok barang dan bahan', 1],
      [1, 4, 'Briefing tim', 'Lakukan briefing dengan tim', 1],
      [1, 5, 'Pembukaan outlet', 'Buka outlet untuk pelanggan', 1],
      
      // SOP Pelayanan Customer
      [2, 1, 'Salam dan sapa customer', 'Sambut customer dengan ramah', 1],
      [2, 2, 'Tawarkan menu', 'Tunjukkan dan jelaskan menu', 1],
      [2, 3, 'Ambil pesanan', 'Catat pesanan customer', 1],
      [2, 4, 'Proses pembayaran', 'Lakukan transaksi pembayaran', 1],
      [2, 5, 'Ucapkan terima kasih', 'Ucapkan terima kasih dan salam', 1],
      
      // SOP Food Safety
      [3, 1, 'Pengecekan suhu makanan', 'Periksa suhu makanan sesuai standar', 1],
      [3, 2, 'Pemeriksaan tanggal kadaluarsa', 'Periksa tanggal kadaluarsa bahan', 1],
      [3, 3, 'Pemantauan kebersihan', 'Pantau kebersihan area dapur', 1],
      [3, 4, 'Dokumentasi QC', 'Catat hasil pemeriksaan QC', 1],
      
      // SOP Produksi Tepung
      [4, 1, 'Pengecekan bahan baku', 'Periksa kualitas bahan baku', 1],
      [4, 2, 'Proses penggilingan', 'Lakukan proses penggilingan', 1],
      [4, 3, 'Quality control', 'Lakukan kontrol kualitas', 1],
      [4, 4, 'Packaging', 'Kemas produk tepung', 1],
      [4, 5, 'Storage', 'Simpan di gudang', 1],
      
      // SOP Keamanan
      [5, 1, 'Patroli area', 'Lakukan patroli area', 1],
      [5, 2, 'Pengecekan CCTV', 'Periksa sistem CCTV', 1],
      [5, 3, 'Monitoring akses', 'Pantau akses masuk keluar', 1],
      [5, 4, 'Laporan keamanan', 'Buat laporan keamanan', 1],
      [5, 5, 'Koordinasi dengan tim', 'Koordinasi dengan tim keamanan', 1]
    ];

    for (const data of sampleSopSteps) {
      await sequelize.query(`
        INSERT INTO sop_steps (procedure_id, step_number, deskripsi_step, keterangan, created_by)
        VALUES (?, ?, ?, ?, ?)
      `, {
        replacements: data
      });
    }
    console.log('✅ Sample data inserted into sop_steps');

    console.log('\n🎉 All Jobdesk and SOP tables created and populated successfully!');
    console.log('📊 Tables created:');
    console.log('   Jobdesk:');
    console.log('   - jobdesk_divisi (4 divisions)');
    console.log('   - jobdesk_departments (10 departments)');
    console.log('   - jobdesk_positions (32 positions)');
    console.log('   SOP:');
    console.log('   - sop_divisi (3 divisions)');
    console.log('   - sop_categories (4 categories)');
    console.log('   - sop_procedures (5 procedures)');
    console.log('   - sop_steps (20 steps)');

  } catch (error) {
    console.error('❌ Error creating Jobdesk and SOP tables:', error);
    throw error;
  }
}

// Run if this file is executed directly
if (require.main === module) {
  createJobdeskSopTables()
    .then(() => {
      console.log('🎉 Table creation process completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Table creation process failed:', error);
      process.exit(1);
    });
}

module.exports = createJobdeskSopTables;
