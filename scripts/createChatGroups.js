const { sequelize } = require('../config/database');

const createChatGroups = async () => {
    try {
        console.log('🏗️ Creating sample chat groups...\n');

        // Step 1: Check if chat_groups table exists
        console.log('📊 Step 1: Checking chat_groups table...');
        const tableExists = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'chat_groups'
        `, { type: sequelize.QueryTypes.SELECT });

        if (tableExists[0].count === 0) {
            console.log('   - Creating chat_groups table...');
            await sequelize.query(`
                CREATE TABLE chat_groups (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    group_id VARCHAR(255) UNIQUE NOT NULL,
                    group_name VARCHAR(255) NOT NULL,
                    group_description TEXT,
                    created_by INT NOT NULL,
                    status_deleted BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    INDEX idx_group_id (group_id),
                    INDEX idx_created_by (created_by)
                )
            `);
            console.log('✅ chat_groups table created');
        } else {
            console.log('✅ chat_groups table already exists');
        }

        // Step 2: Check if group_members table exists
        console.log('\n📊 Step 2: Checking group_members table...');
        const membersTableExists = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'group_members'
        `, { type: sequelize.QueryTypes.SELECT });

        if (membersTableExists[0].count === 0) {
            console.log('   - Creating group_members table...');
            await sequelize.query(`
                CREATE TABLE group_members (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    group_id VARCHAR(255) NOT NULL,
                    user_id INT NOT NULL,
                    role ENUM('admin', 'member') DEFAULT 'member',
                    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status_deleted BOOLEAN DEFAULT FALSE,
                    UNIQUE KEY unique_group_user (group_id, user_id),
                    INDEX idx_group_id (group_id),
                    INDEX idx_user_id (user_id)
                )
            `);
            console.log('✅ group_members table created');
        } else {
            console.log('✅ group_members table already exists');
        }

        // Step 3: Create sample groups
        console.log('\n📝 Step 3: Creating sample groups...');

        const sampleGroups = [
            {
                group_id: 'group_1',
                group_name: 'Tim Bosgil Group',
                group_description: 'Grup utama untuk semua anggota Bosgil Group',
                created_by: 1
            },
            {
                group_id: 'group_2',
                group_name: 'Tim Marketing',
                group_description: 'Grup khusus untuk tim marketing',
                created_by: 2
            },
            {
                group_id: 'group_3',
                group_name: 'Tim Development',
                group_description: 'Grup untuk tim development dan IT',
                created_by: 3
            },
            {
                group_id: 'group_4',
                group_name: 'Announcement',
                group_description: 'Grup untuk pengumuman penting',
                created_by: 1
            }
        ];

        let createdGroups = 0;
        for (const group of sampleGroups) {
            try {
                await sequelize.query(`
                    INSERT INTO chat_groups (group_id, group_name, group_description, created_by)
                    VALUES (?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    group_name = VALUES(group_name),
                    group_description = VALUES(group_description)
                `, {
                    replacements: [group.group_id, group.group_name, group.group_description, group.created_by]
                });
                createdGroups++;
                console.log(`   ✅ Created group: ${group.group_name}`);
            } catch (error) {
                console.log(`   ⚠️ Group ${group.group_name} already exists or error: ${error.message}`);
            }
        }

        // Step 4: Add members to groups
        console.log('\n👥 Step 4: Adding members to groups...');

        const groupMembers = [
            // Tim Bosgil Group - semua user
            { group_id: 'group_1', user_id: 1, role: 'admin' },
            { group_id: 'group_1', user_id: 2, role: 'member' },
            { group_id: 'group_1', user_id: 3, role: 'member' },
            { group_id: 'group_1', user_id: 4, role: 'member' },
            { group_id: 'group_1', user_id: 5, role: 'member' },

            // Tim Marketing - user 2, 4, 5
            { group_id: 'group_2', user_id: 2, role: 'admin' },
            { group_id: 'group_2', user_id: 4, role: 'member' },
            { group_id: 'group_2', user_id: 5, role: 'member' },

            // Tim Development - user 1, 3
            { group_id: 'group_3', user_id: 1, role: 'admin' },
            { group_id: 'group_3', user_id: 3, role: 'member' },

            // Announcement - semua user
            { group_id: 'group_4', user_id: 1, role: 'admin' },
            { group_id: 'group_4', user_id: 2, role: 'member' },
            { group_id: 'group_4', user_id: 3, role: 'member' },
            { group_id: 'group_4', user_id: 4, role: 'member' },
            { group_id: 'group_4', user_id: 5, role: 'member' }
        ];

        let addedMembers = 0;
        for (const member of groupMembers) {
            try {
                await sequelize.query(`
                    INSERT INTO group_members (group_id, user_id, role)
                    VALUES (?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    role = VALUES(role)
                `, {
                    replacements: [member.group_id, member.user_id, member.role]
                });
                addedMembers++;
            } catch (error) {
                console.log(`   ⚠️ Error adding member ${member.user_id} to group ${member.group_id}: ${error.message}`);
            }
        }

        console.log(`✅ Added ${addedMembers} members to groups`);

        // Step 5: Create some sample group messages
        console.log('\n💬 Step 5: Creating sample group messages...');

        const sampleMessages = [
            { group_id: 'group_1', sender_id: 1, message: 'Selamat datang di grup utama Bosgil Group!' },
            { group_id: 'group_1', sender_id: 2, message: 'Terima kasih! Senang bergabung' },
            { group_id: 'group_1', sender_id: 3, message: 'Halo semua!' },
            { group_id: 'group_2', sender_id: 2, message: 'Tim marketing meeting hari ini jam 2 siang' },
            { group_id: 'group_2', sender_id: 4, message: 'Siap, akan hadir' },
            { group_id: 'group_3', sender_id: 1, message: 'Update sistem selesai, bisa di-test' },
            { group_id: 'group_4', sender_id: 1, message: 'Pengumuman: Libur nasional besok' }
        ];

        let createdMessages = 0;
        for (const msg of sampleMessages) {
            try {
                await sequelize.query(`
                    INSERT INTO messages (room_id, sender_id, message, message_type, is_group_message, is_read, status_deleted)
                    VALUES (?, ?, ?, 'text', true, false, false)
                `, {
                    replacements: [msg.group_id, msg.sender_id, msg.message]
                });
                createdMessages++;
            } catch (error) {
                console.log(`   ⚠️ Error creating message: ${error.message}`);
            }
        }

        console.log(`✅ Created ${createdMessages} sample messages`);

        // Step 6: Final summary
        console.log('\n📊 Step 6: Final summary...');
        const totalGroups = await sequelize.query(`
            SELECT COUNT(*) as count FROM chat_groups WHERE status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });

        const totalMembers = await sequelize.query(`
            SELECT COUNT(*) as count FROM group_members WHERE status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });

        const totalGroupMessages = await sequelize.query(`
            SELECT COUNT(*) as count FROM messages WHERE is_group_message = true AND status_deleted = 0
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`   - Total Groups: ${totalGroups[0].count}`);
        console.log(`   - Total Members: ${totalMembers[0].count}`);
        console.log(`   - Total Group Messages: ${totalGroupMessages[0].count}`);

        console.log('\n🎉 Chat groups creation completed successfully!');
        console.log('💡 You can now test group chat functionality');

    } catch (error) {
        console.error('❌ Error creating chat groups:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the creation script
createChatGroups(); 