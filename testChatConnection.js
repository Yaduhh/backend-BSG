const mysql = require('mysql2/promise');
require('dotenv').config();

async function testChatConnection() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '192.168.30.124',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistem_bosgil_group'
        });

        console.log('✅ Database connected successfully');

        // Test chat_rooms table
        try {
            const [chatRooms] = await connection.execute('SELECT COUNT(*) as count FROM chat_rooms');
            console.log('✅ chat_rooms table exists, count:', chatRooms[0].count);
        } catch (error) {
            console.log('❌ chat_rooms table error:', error.message);
        }

        // Test messages table
        try {
            const [messages] = await connection.execute('SELECT COUNT(*) as count FROM messages');
            console.log('✅ messages table exists, count:', messages[0].count);
        } catch (error) {
            console.log('❌ messages table error:', error.message);
        }

        // Test users table
        try {
            const [users] = await connection.execute('SELECT COUNT(*) as count FROM users WHERE status_deleted = 0');
            console.log('✅ users table exists, active users:', users[0].count);
        } catch (error) {
            console.log('❌ users table error:', error.message);
        }

        // Test inserting a message
        try {
            const testRoomId = 'test_1_2';
            const testSenderId = 1;
            const testMessage = 'Test message from script';

            // Create test chat room if not exists
            await connection.execute(`
        INSERT IGNORE INTO chat_rooms (room_id, user1_id, user2_id, last_message, last_message_time, status_deleted) 
        VALUES (?, ?, ?, ?, NOW(), 0)
      `, [testRoomId, 1, 2, testMessage]);

            // Insert test message
            const [result] = await connection.execute(`
        INSERT INTO messages (room_id, sender_id, message, message_type, is_read, status_deleted) 
        VALUES (?, ?, ?, 'text', 0, 0)
      `, [testRoomId, testSenderId, testMessage]);

            console.log('✅ Test message inserted successfully, ID:', result.insertId);

            // Clean up test data
            await connection.execute('DELETE FROM messages WHERE room_id = ?', [testRoomId]);
            await connection.execute('DELETE FROM chat_rooms WHERE room_id = ?', [testRoomId]);
            console.log('✅ Test data cleaned up');

        } catch (error) {
            console.log('❌ Test message insertion error:', error.message);
        }

    } catch (error) {
        console.error('❌ Database connection error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

testChatConnection(); 