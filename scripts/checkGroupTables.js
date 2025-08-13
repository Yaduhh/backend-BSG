const { sequelize } = require('../config/database');

const checkGroupTables = async () => {
    try {
        console.log('🔍 Checking group tables...\n');

        // Check if chat_groups table exists
        console.log('📊 Step 1: Checking chat_groups table...');
        const groupsTableExists = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'chat_groups'
        `, { type: sequelize.QueryTypes.SELECT });

        if (groupsTableExists[0].count > 0) {
            console.log('✅ chat_groups table exists');

            // Get table structure
            const tableStructure = await sequelize.query(`
                DESCRIBE chat_groups
            `, { type: sequelize.QueryTypes.SELECT });

            console.log('📋 Table structure:');
            tableStructure.forEach(field => {
                console.log(`   - ${field.Field}: ${field.Type} ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });

            // Get all groups (without WHERE clause first)
            const groups = await sequelize.query(`
                SELECT * FROM chat_groups LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });

            console.log(`📋 Found ${groups.length} groups (showing first 5):`);
            groups.forEach((group, index) => {
                console.log(`   ${index + 1}. Group ID: ${group.group_id || group.id}, Name: ${group.group_name || group.name}`);
            });
        } else {
            console.log('❌ chat_groups table does not exist');
        }

        // Check if group_members table exists
        console.log('\n📊 Step 2: Checking group_members table...');
        const membersTableExists = await sequelize.query(`
            SELECT COUNT(*) as count 
            FROM information_schema.TABLES 
            WHERE TABLE_SCHEMA = 'sistem_bosgil_group' 
            AND TABLE_NAME = 'group_members'
        `, { type: sequelize.QueryTypes.SELECT });

        if (membersTableExists[0].count > 0) {
            console.log('✅ group_members table exists');

            // Get table structure
            const tableStructure = await sequelize.query(`
                DESCRIBE group_members
            `, { type: sequelize.QueryTypes.SELECT });

            console.log('📋 Table structure:');
            tableStructure.forEach(field => {
                console.log(`   - ${field.Field}: ${field.Type} ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
            });

            // Get all members (without WHERE clause first)
            const members = await sequelize.query(`
                SELECT * FROM group_members LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });

            console.log(`👥 Found ${members.length} members (showing first 5):`);
            members.forEach((member, index) => {
                console.log(`   ${index + 1}. Group: ${member.group_id}, User: ${member.user_id}, Role: ${member.role}`);
            });
        } else {
            console.log('❌ group_members table does not exist');
        }

        // Check group messages
        console.log('\n📊 Step 3: Checking group messages...');
        const groupMessages = await sequelize.query(`
            SELECT m.*, u.nama as sender_nama
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.is_group_message = true AND m.status_deleted = 0
            ORDER BY m.created_at DESC
            LIMIT 10
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`💬 Found ${groupMessages.length} group messages (showing first 10):`);
        groupMessages.forEach((msg, index) => {
            console.log(`   ${index + 1}. [${msg.room_id}] ${msg.sender_nama}: ${msg.message}`);
        });

        console.log('\n🎉 Group tables check completed!');

    } catch (error) {
        console.error('❌ Error checking group tables:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the check
checkGroupTables(); 