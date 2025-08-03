const axios = require('axios');

const testAdminContacts = async () => {
  try {
    console.log('🧪 Testing admin contacts endpoint...');
    
    // First, login as admin to get token
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      const token = loginResponse.data.data.token;
      const adminId = loginResponse.data.data.user.id;
      
      console.log('✅ Login successful, admin ID:', adminId);
      
      // Test contacts endpoint
      const contactsResponse = await axios.get(`http://localhost:3000/api/admin-chat/contacts/${adminId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📋 Contacts response:', contactsResponse.data);
      
      if (contactsResponse.data.success) {
        console.log(`✅ Found ${contactsResponse.data.data.length} contacts`);
        contactsResponse.data.data.forEach((contact, index) => {
          console.log(`${index + 1}. ${contact.nama} (@${contact.username}) - ${contact.role}`);
        });
      } else {
        console.log('❌ Failed to get contacts:', contactsResponse.data.message);
      }
      
    } else {
      console.log('❌ Login failed:', loginResponse.data.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
};

testAdminContacts(); 