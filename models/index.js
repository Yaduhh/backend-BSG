const User = require('./User');
const UserDevice = require('./UserDevice');
const DaftarTugas = require('./DaftarTugas');
const DaftarKomplain = require('./DaftarKomplain');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');
const ChatGroup = require('./ChatGroup');
const ChatGroupMember = require('./ChatGroupMember');
const KeuanganPoskas = require('./KeuanganPoskas');
const PicMenu = require('./PicMenu');
const Pengumuman = require('./Pengumuman');
const TimMerah = require('./TimMerah');
const TimBiru = require('./TimBiru');
const DataAset = require('./DataAset');
const KPI = require('./KPI');
const DataTarget = require('./DataTarget');
const DataInvestor = require('./DataInvestor');
const JadwalPembayaran = require('./JadwalPembayaran');
const PicKategori = require('./PicKategori');
const SdmDivisi = require('./SdmDivisi');
const SdmJabatan = require('./SdmJabatan');
const SdmData = require('./SdmData');
const JobdeskDivisi = require('./JobdeskDivisi');
const JobdeskDepartment = require('./JobdeskDepartment');
const JobdeskPosition = require('./JobdeskPosition');
const SopDivisi = require('./SopDivisi');
const SopCategory = require('./SopCategory');
const SopStep = require('./SopStep');
const StrukturOrganisasi = require('./StrukturOrganisasi');

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

// DataAset associations
User.hasMany(DataAset, { foreignKey: 'created_by', as: 'dataAsetEntries' });
DataAset.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

// DataTarget associations
User.hasMany(DataTarget, { foreignKey: 'created_by', as: 'dataTargetEntries' });
User.hasMany(DataTarget, { foreignKey: 'updated_by', as: 'dataTargetUpdates' });
DataTarget.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
DataTarget.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

// KeuanganPoskas associations - commented out because it's not a Sequelize model
// User.hasMany(KeuanganPoskas, { foreignKey: 'user_id' });
// KeuanganPoskas.belongsTo(User, { foreignKey: 'user_id' });

// ChatGroup associations
User.hasMany(ChatGroup, { foreignKey: 'created_by', as: 'createdGroups' });
ChatGroup.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });

ChatGroup.hasMany(ChatGroupMember, { foreignKey: 'group_id', sourceKey: 'group_id' });
ChatGroupMember.belongsTo(ChatGroup, { foreignKey: 'group_id', targetKey: 'group_id' });

User.hasMany(ChatGroupMember, { foreignKey: 'user_id', as: 'groupMemberships' });
ChatGroupMember.belongsTo(User, { foreignKey: 'user_id', as: 'member' });

// PicKategori associations
User.hasMany(PicKategori, { foreignKey: 'pic_id', as: 'picKategori' });
PicKategori.belongsTo(User, { foreignKey: 'pic_id', as: 'pic' });

// SDM associations
User.hasMany(SdmDivisi, { foreignKey: 'created_by', as: 'sdmDivisiCreated' });
User.hasMany(SdmDivisi, { foreignKey: 'updated_by', as: 'sdmDivisiUpdated' });
User.hasMany(SdmDivisi, { foreignKey: 'deleted_by', as: 'sdmDivisiDeleted' });
SdmDivisi.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SdmDivisi.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
SdmDivisi.belongsTo(User, { foreignKey: 'deleted_by', as: 'deleter' });

User.hasMany(SdmJabatan, { foreignKey: 'created_by', as: 'sdmJabatanCreated' });
User.hasMany(SdmJabatan, { foreignKey: 'updated_by', as: 'sdmJabatanUpdated' });
User.hasMany(SdmJabatan, { foreignKey: 'deleted_by', as: 'sdmJabatanDeleted' });
SdmJabatan.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SdmJabatan.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
SdmJabatan.belongsTo(User, { foreignKey: 'deleted_by', as: 'deleter' });

User.hasMany(SdmData, { foreignKey: 'created_by', as: 'sdmDataCreated' });
User.hasMany(SdmData, { foreignKey: 'updated_by', as: 'sdmDataUpdated' });
User.hasMany(SdmData, { foreignKey: 'deleted_by', as: 'sdmDataDeleted' });
User.hasMany(SdmData, { foreignKey: 'user_id', as: 'sdmDataUser' });
SdmData.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SdmData.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });
SdmData.belongsTo(User, { foreignKey: 'deleted_by', as: 'deleter' });
SdmData.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

SdmDivisi.hasMany(SdmJabatan, { foreignKey: 'divisi_id', as: 'jabatans' });
SdmJabatan.belongsTo(SdmDivisi, { foreignKey: 'divisi_id', as: 'divisi' });

SdmJabatan.hasMany(SdmData, { foreignKey: 'jabatan_id', as: 'employees' });
SdmData.belongsTo(SdmJabatan, { foreignKey: 'jabatan_id', as: 'jabatan' });

// Jobdesk associations
User.hasMany(JobdeskDivisi, { foreignKey: 'created_by', as: 'jobdeskDivisiCreated' });
User.hasMany(JobdeskDivisi, { foreignKey: 'updated_by', as: 'jobdeskDivisiUpdated' });
JobdeskDivisi.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
JobdeskDivisi.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(JobdeskDepartment, { foreignKey: 'created_by', as: 'jobdeskDepartmentCreated' });
User.hasMany(JobdeskDepartment, { foreignKey: 'updated_by', as: 'jobdeskDepartmentUpdated' });
JobdeskDepartment.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
JobdeskDepartment.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(JobdeskPosition, { foreignKey: 'created_by', as: 'jobdeskPositionCreated' });
User.hasMany(JobdeskPosition, { foreignKey: 'updated_by', as: 'jobdeskPositionUpdated' });
JobdeskPosition.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
JobdeskPosition.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

JobdeskDivisi.hasMany(JobdeskDepartment, { foreignKey: 'divisi_id', as: 'departments' });
JobdeskDepartment.belongsTo(JobdeskDivisi, { foreignKey: 'divisi_id', as: 'divisi' });

JobdeskDepartment.hasMany(JobdeskPosition, { foreignKey: 'department_id', as: 'positions' });
JobdeskPosition.belongsTo(JobdeskDepartment, { foreignKey: 'department_id', as: 'department' });

// SOP associations
User.hasMany(SopDivisi, { foreignKey: 'created_by', as: 'sopDivisiCreated' });
User.hasMany(SopDivisi, { foreignKey: 'updated_by', as: 'sopDivisiUpdated' });
SopDivisi.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SopDivisi.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(SopCategory, { foreignKey: 'created_by', as: 'sopCategoryCreated' });
User.hasMany(SopCategory, { foreignKey: 'updated_by', as: 'sopCategoryUpdated' });
SopCategory.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SopCategory.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(SopStep, { foreignKey: 'created_by', as: 'sopStepCreated' });
User.hasMany(SopStep, { foreignKey: 'updated_by', as: 'sopStepUpdated' });
SopStep.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
SopStep.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

SopDivisi.hasMany(SopCategory, { foreignKey: 'divisi_id', as: 'categories' });
SopCategory.belongsTo(SopDivisi, { foreignKey: 'divisi_id', as: 'divisi' });

SopCategory.hasMany(SopStep, { foreignKey: 'category_id', as: 'steps' });
SopStep.belongsTo(SopCategory, { foreignKey: 'category_id', as: 'category' });

module.exports = {
  User,
  UserDevice,
  DaftarTugas,
  DaftarKomplain,
  ChatRoom,
  Message,
  ChatGroup,
  ChatGroupMember,
  KeuanganPoskas,
  PicMenu,
  Pengumuman,
  TimMerah,
  TimBiru,
  DataAset,
  KPI,
  DataTarget,
  DataInvestor,
  JadwalPembayaran,
  PicKategori,
  SdmDivisi,
  SdmJabatan,
  SdmData,
  JobdeskDivisi,
  JobdeskDepartment,
  JobdeskPosition,
  SopDivisi,
  SopCategory,
  SopStep,
  StrukturOrganisasi
};