const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixMessagesTable() {
    let connection;

    try {
        // Create connection
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || '172.20.10.10',
            host: process.env.DB_HOST || '192.168.0.107',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'sistem_bosgil_group'
        });

        console.log('✅ Database connected successfully');

        // Check current AUTO_INCREMENT value
        try {
            const [autoIncrementResult] = await connection.execute(`
        SELECT AUTO_INCREMENT 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages'
      `, [process.env.DB_NAME || 'sistem_bosgil_group']);

            console.log('🔍 Current AUTO_INCREMENT value:', autoIncrementResult[0]?.AUTO_INCREMENT);
        } catch (error) {
            console.log('⚠️ Could not check AUTO_INCREMENT:', error.message);
        }

        // Get the maximum ID from messages table
        try {
            const [maxIdResult] = await connection.execute('SELECT MAX(id) as max_id FROM messages');
            const maxId = maxIdResult[0].max_id || 0;
            console.log('🔍 Maximum ID in messages table:', maxId);

            // Fix AUTO_INCREMENT if needed
            if (maxId > 0) {
                const newAutoIncrement = maxId + 1;
                await connection.execute(`ALTER TABLE messages AUTO_INCREMENT = ${newAutoIncrement}`);
                console.log(`✅ Fixed AUTO_INCREMENT to ${newAutoIncrement}`);
            } else {
                // If no messages exist, reset to 1
                await connection.execute('ALTER TABLE messages AUTO_INCREMENT = 1');
                console.log('✅ Reset AUTO_INCREMENT to 1');
            }
        } catch (error) {
            console.log('❌ Error fixing AUTO_INCREMENT:', error.message);
        }

        // Verify the fix
        try {
            const [verifyResult] = await connection.execute(`
        SELECT AUTO_INCREMENT 
        FROM information_schema.TABLES 
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'messages'
      `, [process.env.DB_NAME || 'sistem_bosgil_group']);

            console.log('✅ New AUTO_INCREMENT value:', verifyResult[0]?.AUTO_INCREMENT);
        } catch (error) {
            console.log('⚠️ Could not verify AUTO_INCREMENT:', error.message);
        }

        // Test inserting a message
        try {
            const testRoomId = 'test_fix_1_2';
            const testSenderId = 1;
            const testMessage = 'Test message after fix';

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
        console.error('❌ Error fixing messages table:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Database connection closed');
        }
    }
}

fixMessagesTable(); 