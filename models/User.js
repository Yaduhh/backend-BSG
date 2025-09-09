const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  nama: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [3, 50],
      is: /^[a-zA-Z0-9_]+$/ // Hanya huruf, angka, dan underscore
    }
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [6, 255]
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'suspended'),
    allowNull: false,
    defaultValue: 'active'
  },
  status_deleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  role: {
    type: DataTypes.ENUM('owner', 'admin', 'leader', 'divisi'),
    allowNull: false,
    defaultValue: 'divisi'
  },
  training_dasar: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  training_leadership: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  training_skill: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  training_lanjutan: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, {
  tableName: 'users',
  timestamps: true, // Ini akan membuat created_at dan updated_at
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Hash password sebelum disimpan
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance method untuk verifikasi password
User.prototype.verifyPassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Instance method untuk mendapatkan data user tanpa password
User.prototype.toJSON = function() {
  const values = Object.assign({}, this.get());
  delete values.password;
  return values;
};

// Association function
User.associate = (models) => {
  User.hasMany(models.UserDevice, {
    foreignKey: 'user_id',
    as: 'devices'
  });
  
  User.hasMany(models.Message, {
    foreignKey: 'sender_id',
    as: 'messages'
  });

};

module.exports = User; 