const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('Admin Change Password API', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    // Create test admin user
    const hashedPassword = await bcrypt.hash('oldpassword123', 10);
    adminUser = await User.create({
      nama: 'Test Admin',
      email: 'admin@test.com',
      username: 'testadmin',
      password: hashedPassword,
      role: 'admin'
    });

    // Generate JWT token
    adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { id: adminUser.id } });
  });

  describe('PUT /api/admin/change-password', () => {
    it('should change password successfully with valid data', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Password berhasil diubah');

      // Verify password was actually changed
      const updatedUser = await User.findByPk(adminUser.id);
      const isNewPasswordValid = await bcrypt.compare('newpassword123', updatedUser.password);
      expect(isNewPasswordValid).toBe(true);
    });

    it('should return 400 if current password is missing', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Semua field password harus diisi');
    });

    it('should return 400 if new password is missing', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'oldpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Semua field password harus diisi');
    });

    it('should return 400 if confirm password is missing', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Semua field password harus diisi');
    });

    it('should return 400 if new password and confirm password do not match', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'differentpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password baru dan konfirmasi password tidak cocok');
    });

    it('should return 400 if new password is too short', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: '123',
          confirmPassword: '123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password baru minimal 6 karakter');
    });

    it('should return 400 if current password is incorrect', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password saat ini tidak valid');
    });

    it('should return 400 if new password is same as current password', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'oldpassword123',
          confirmPassword: 'oldpassword123'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Password baru tidak boleh sama dengan password lama');
    });

    it('should return 401 if no token provided', async () => {
      const response = await request(app)
        .put('/api/admin/change-password')
        .send({
          currentPassword: 'oldpassword123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
    });

    it('should return 403 if user is not admin', async () => {
      // Create non-admin user
      const nonAdminUser = await User.create({
        nama: 'Test User',
        email: 'user@test.com',
        username: 'testuser',
        password: await bcrypt.hash('password123', 10),
        role: 'user'
      });

      const nonAdminToken = jwt.sign(
        { id: nonAdminUser.id, role: nonAdminUser.role },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${nonAdminToken}`)
        .send({
          currentPassword: 'password123',
          newPassword: 'newpassword123',
          confirmPassword: 'newpassword123'
        });

      expect(response.status).toBe(403);

      // Clean up
      await User.destroy({ where: { id: nonAdminUser.id } });
    });
  });
}); 