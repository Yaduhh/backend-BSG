const User = require('./User');
const UserDevice = require('./UserDevice');
const DaftarTugas = require('./DaftarTugas');
const DaftarKomplain = require('./DaftarKomplain');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');
const KeuanganPoskas = require('./KeuanganPoskas');
const PicMenu = require('./PicMenu');
const Pengumuman = require('./Pengumuman');
const TimMerah = require('./TimMerah');
const TimBiru = require('./TimBiru');

// Define associations - testing one by one
User.hasMany(UserDevice, { foreignKey: 'user_id' });
UserDevice.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(DaftarTugas, { foreignKey: 'pemberi_tugas', as: 'pemberiTugas' });
User.hasMany(DaftarTugas, { foreignKey: 'penerima_tugas', as: 'penerimaTugas' });
DaftarTugas.belongsTo(User, { foreignKey: 'pemberi_tugas', as: 'pemberiTugas' });
DaftarTugas.belongsTo(User, { foreignKey: 'penerima_tugas', as: 'penerimaTugas' });

// DaftarKomplain associations
User.hasMany(DaftarKomplain, { foreignKey: 'pelapor_id', as: 'Pelapor' });
User.hasMany(DaftarKomplain, { foreignKey: 'penerima_komplain_id', as: 'PenerimaKomplain' });
DaftarKomplain.belongsTo(User, { foreignKey: 'pelapor_id', as: 'Pelapor' });
DaftarKomplain.belongsTo(User, { foreignKey: 'penerima_komplain_id', as: 'PenerimaKomplain' });

User.hasMany(ChatRoom, { foreignKey: 'user1_id', as: 'user1' });
User.hasMany(ChatRoom, { foreignKey: 'user2_id', as: 'user2' });
ChatRoom.belongsTo(User, { foreignKey: 'user1_id', as: 'user1' });
ChatRoom.belongsTo(User, { foreignKey: 'user2_id', as: 'user2' });

ChatRoom.hasMany(Message, { foreignKey: 'room_id', sourceKey: 'room_id' });
Message.belongsTo(ChatRoom, { foreignKey: 'room_id', targetKey: 'room_id' });

User.hasMany(Message, { foreignKey: 'sender_id', as: 'messages' });
Message.belongsTo(User, { foreignKey: 'sender_id', as: 'sender' });

// Pengumuman associations
User.hasMany(Pengumuman, { foreignKey: 'penulis_id', as: 'pengumuman' });
Pengumuman.belongsTo(User, { foreignKey: 'penulis_id', as: 'penulis' });

// TimMerah associations
User.hasMany(TimMerah, { foreignKey: 'created_by', as: 'timMerahEntries' });
TimMerah.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// TimBiru associations
User.hasMany(TimBiru, { foreignKey: 'created_by', as: 'timBiruEntries' });
TimBiru.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// KeuanganPoskas associations - commented out because it's not a Sequelize model
// User.hasMany(KeuanganPoskas, { foreignKey: 'user_id' });
// KeuanganPoskas.belongsTo(User, { foreignKey: 'user_id' });

module.exports = {
  User,
  UserDevice,
  DaftarTugas,
  DaftarKomplain,
  ChatRoom,
  Message,
  KeuanganPoskas,
  PicMenu,
  Pengumuman,
  TimMerah,
  TimBiru
}; 