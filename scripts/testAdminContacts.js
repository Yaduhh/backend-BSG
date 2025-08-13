const axios = require('axios');
const { API_CONFIG } = require('../config/constants');

const baseURL = API_CONFIG.BASE_URL + API_CONFIG.ROUTES.API_PREFIX;

const testAdminContacts = async () => {
  try {
    console.log('🧪 Testing Admin Contacts...\n');

    // Test 1: Login as admin
    console.log('📊 Test 1: Login as admin...');
    const loginResponse = await axios.post(`${baseURL}/auth/login`, {
      email: 'admin@bosgil.com',
      password: 'admin123'
    });

    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      console.log('✅ Login successful, token received');

      // Test 2: Get admin contacts
      console.log('\n📊 Test 2: Getting admin contacts...');
      const adminId = loginResponse.data.data.user.id;
      const contactsResponse = await axios.get(`${baseURL}/admin-chat/contacts/${adminId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('✅ Admin contacts response:', JSON.stringify(contactsResponse.data, null, 2));
    } else {
      console.error('❌ Login failed:', loginResponse.data);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testAdminContacts(); 