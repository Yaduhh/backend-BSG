const User = require('./User');
const ChatRoom = require('./ChatRoom');
const Message = require('./Message');
const PicMenu = require('./PicMenu');
const UserDevice = require('./UserDevice');
const DaftarTugas = require('./DaftarTugas');

// Initialize associations
const models = {
  User,
  ChatRoom,
  Message,
  PicMenu,
  UserDevice,
  DaftarTugas
};

// Call associate function for each model
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = models; 