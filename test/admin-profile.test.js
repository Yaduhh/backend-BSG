const request = require('supertest');
const app = require('../app');
const { User } = require('../models');
const jwt = require('jsonwebtoken');

describe('Admin Profile API', () => {
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    // Create test admin user
    adminUser = await User.create({
      nama: 'Test Admin',
      username: 'testadmin',
      email: 'testadmin@bosgil.com',
      password: 'password123',
      role: 'admin',
      status: 'active'
    });

    // Generate token for admin
    adminToken = jwt.sign(
      { id: adminUser.id, role: adminUser.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await User.destroy({ where: { id: adminUser.id } });
  });

  describe('GET /api/admin/profile', () => {
    it('should get admin profile with stats', async () => {
      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('nama');
      expect(response.body.data).toHaveProperty('email');
      expect(response.body.data).toHaveProperty('role');
      expect(response.body.data).toHaveProperty('stats');
      expect(response.body.data.role).toBe('admin');
    });

    it('should return 401 without token', async () => {
      const response = await request(app)
        .get('/api/admin/profile');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin user', async () => {
      // Create non-admin user
      const regularUser = await User.create({
        nama: 'Regular User',
        username: 'regularuser',
        email: 'regular@bosgil.com',
        password: 'password123',
        role: 'divisi',
        status: 'active'
      });

      const regularToken = jwt.sign(
        { id: regularUser.id, role: regularUser.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/admin/profile')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);

      // Clean up
      await User.destroy({ where: { id: regularUser.id } });
    });
  });

  describe('PUT /api/admin/profile', () => {
    it('should update admin profile', async () => {
      const updateData = {
        nama: 'Updated Admin Name',
        email: 'updatedadmin@bosgil.com',
        username: 'updatedadmin'
      };

      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.nama).toBe(updateData.nama);
      expect(response.body.data.email).toBe(updateData.email);
      expect(response.body.data.username).toBe(updateData.username);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama: '',
          email: '',
          username: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama: 'Test Admin',
          email: 'invalid-email',
          username: 'testadmin'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate username format', async () => {
      const response = await request(app)
        .put('/api/admin/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nama: 'Test Admin',
          email: 'test@bosgil.com',
          username: 'test-admin' // Invalid format
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/admin/change-password', () => {
    it('should change admin password', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should validate current password', async () => {
      const passwordData = {
        currentPassword: 'wrongpassword',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123'
      };

      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password confirmation', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: 'newpassword123',
        confirmPassword: 'differentpassword'
      };

      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password length', async () => {
      const passwordData = {
        currentPassword: 'password123',
        newPassword: '123',
        confirmPassword: '123'
      };

      const response = await request(app)
        .put('/api/admin/change-password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(passwordData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/stats', () => {
    it('should get admin statistics', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalTugas');
      expect(response.body.data).toHaveProperty('activeChats');
      expect(response.body.data).toHaveProperty('totalKeuangan');
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('pendingTugas');
      expect(response.body.data).toHaveProperty('ongoingTugas');
      expect(response.body.data).toHaveProperty('completedTugas');
    });
  });

  describe('GET /api/admin/activity-history', () => {
    it('should get activity history with pagination', async () => {
      const response = await request(app)
        .get('/api/admin/activity-history?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('activities');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('currentPage');
      expect(response.body.data.pagination).toHaveProperty('totalPages');
      expect(response.body.data.pagination).toHaveProperty('totalItems');
      expect(response.body.data.pagination).toHaveProperty('itemsPerPage');
    });
  });

  describe('GET /api/admin/settings', () => {
    it('should get admin settings', async () => {
      const response = await request(app)
        .get('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('notifications');
      expect(response.body.data).toHaveProperty('privacy');
      expect(response.body.data).toHaveProperty('theme');
    });
  });

  describe('PUT /api/admin/settings', () => {
    it('should update admin settings', async () => {
      const settingsData = {
        notifications: {
          email: true,
          push: false,
          sms: false
        },
        privacy: {
          showOnlineStatus: false,
          showLastSeen: true
        },
        theme: {
          mode: 'dark',
          primaryColor: '#DC2626'
        }
      };

      const response = await request(app)
        .put('/api/admin/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(settingsData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(settingsData);
    });
  });
}); 