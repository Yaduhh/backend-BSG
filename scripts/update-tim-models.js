const fs = require('fs');
const path = require('path');

function updateTimModels() {
  console.log('🔄 Updating TimMerah and TimBiru models...\n');

  // Update TimMerah model
  const timMerahPath = path.join(__dirname, '../models/TimMerah.js');
  let timMerahContent = fs.readFileSync(timMerahPath, 'utf8');

  // Add divisi and posisi fields after nama field
  const updatedTimMerah = timMerahContent.replace(
    /  nama: {\s*type: DataTypes\.STRING\(255\),\s*allowNull: false,\s*comment: 'Nama karyawan'\s*},/,
    `  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama karyawan'
  },
  divisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Divisi/cabang tempat kerja'
  },
  posisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Posisi/jabatan karyawan'
  },`
  );

  // Update indexes to include divisi and posisi
  const updatedTimMerahWithIndexes = updatedTimMerah.replace(
    /  indexes: \[\s*{\s*fields: \['nama'\]\s*},\s*{\s*fields: \['status'\]\s*},\s*{\s*fields: \['created_by'\]\s*},\s*{\s*fields: \['user_id'\]\s*}\s*\]/,
    `  indexes: [
    {
      fields: ['nama']
    },
    {
      fields: ['divisi']
    },
    {
      fields: ['posisi']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['user_id']
    }
  ]`
  );

  fs.writeFileSync(timMerahPath, updatedTimMerahWithIndexes);
  console.log('✅ Updated TimMerah.js model');

  // Update TimBiru model
  const timBiruPath = path.join(__dirname, '../models/TimBiru.js');
  let timBiruContent = fs.readFileSync(timBiruPath, 'utf8');

  // Add divisi and posisi fields after nama field
  const updatedTimBiru = timBiruContent.replace(
    /  nama: {\s*type: DataTypes\.STRING\(255\),\s*allowNull: false,\s*comment: 'Nama karyawan'\s*},/,
    `  nama: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nama karyawan'
  },
  divisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Divisi/cabang tempat kerja'
  },
  posisi: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Posisi/jabatan karyawan'
  },`
  );

  // Update indexes to include divisi and posisi
  const updatedTimBiruWithIndexes = updatedTimBiru.replace(
    /  indexes: \[\s*{\s*fields: \['nama'\]\s*},\s*{\s*fields: \['created_by'\]\s*},\s*{\s*fields: \['user_id'\]\s*}\s*\]/,
    `  indexes: [
    {
      fields: ['nama']
    },
    {
      fields: ['divisi']
    },
    {
      fields: ['posisi']
    },
    {
      fields: ['created_by']
    },
    {
      fields: ['user_id']
    }
  ]`
  );

  fs.writeFileSync(timBiruPath, updatedTimBiruWithIndexes);
  console.log('✅ Updated TimBiru.js model');

  console.log('\n🎉 Models updated successfully!');
  console.log('\n📋 Changes made:');
  console.log('- Added divisi field to both models');
  console.log('- Added posisi field to both models');
  console.log('- Updated indexes to include divisi and posisi');
}

// Run the update
try {
  updateTimModels();
  console.log('\n✅ Script completed successfully');
} catch (error) {
  console.error('❌ Script failed:', error);
  process.exit(1);
}
