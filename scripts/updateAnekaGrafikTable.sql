-- Update aneka_grafik table structure
-- Run this script in your MySQL database

USE sistem_bosgil_group;

-- Add parent_id column
ALTER TABLE aneka_grafik 
ADD COLUMN parent_id INT(11) DEFAULT NULL AFTER category;

-- Add foreign key constraint
ALTER TABLE aneka_grafik 
ADD CONSTRAINT fk_aneka_grafik_parent 
FOREIGN KEY (parent_id) REFERENCES aneka_grafik(id) 
ON DELETE SET NULL;

-- Update category enum to new values
ALTER TABLE aneka_grafik 
MODIFY COLUMN category ENUM('omzet', 'bahan_baku', 'gaji_bonus_ops', 'gaji', 'bonus', 'operasional') NOT NULL;

-- Verify the changes
DESCRIBE aneka_grafik;
