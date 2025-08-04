const User = require('./User');
const UserDevice = require('./UserDevice');
const DaftarTugas = require('./DaftarTugas');
const DaftarKomplain = require('./DaftarKomplain');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');
const KeuanganPoskas = require('./KeuanganPoskas');
const PicMenu = require('./PicMenu');

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
  PicMenu
}; 