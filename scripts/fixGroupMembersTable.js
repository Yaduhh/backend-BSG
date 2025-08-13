const { sequelize } = require('../config/database');

const fixGroupMembersTable = async () => {
    try {
        console.log('🔧 Fixing group_members table to match backend expectations...\n');

        // Step 1: Add is_active column if it doesn't exist
        console.log('📊 Step 1: Adding is_active column...');
        try {
            await sequelize.query(`
                ALTER TABLE group_members 
                ADD COLUMN is_active TINYINT(1) DEFAULT 1
            `);
            console.log('✅ Added is_active column');
        } catch (error) {
            if (error.message.includes('Duplicate column name')) {
                console.log('ℹ️ is_active column already exists');
            } else {
                throw error;
            }
        }

        // Step 2: Update is_active based on status_deleted
        console.log('📊 Step 2: Updating is_active values...');
        const updateResult = await sequelize.query(`
            UPDATE group_members 
            SET is_active = CASE 
                WHEN status_deleted = 1 THEN 0 
                ELSE 1 
            END
        `);
        console.log('✅ Updated is_active values based on status_deleted');

        // Step 3: Show current data
        console.log('📊 Step 3: Current group_members data:');
        const members = await sequelize.query(`
            SELECT * FROM group_members 
            ORDER BY group_id, user_id
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`📋 Found ${members.length} members:`);
        members.forEach((member, index) => {
            console.log(`   ${index + 1}. Group: ${member.group_id}, User: ${member.user_id}, Role: ${member.role}, is_active: ${member.is_active}, status_deleted: ${member.status_deleted}`);
        });

        // Step 4: Test the backend query
        console.log('📊 Step 4: Testing backend query...');
        const testQuery = await sequelize.query(`
            SELECT gm.*, u.nama as user_nama
            FROM group_members gm
            LEFT JOIN users u ON gm.user_id = u.id
            WHERE gm.is_active = 1
            ORDER BY gm.group_id, gm.user_id
        `, { type: sequelize.QueryTypes.SELECT });

        console.log(`✅ Backend query works! Found ${testQuery.length} active members:`);
        testQuery.forEach((member, index) => {
            console.log(`   ${index + 1}. Group: ${member.group_id}, User: ${member.user_nama} (${member.user_id}), Role: ${member.role}`);
        });

        console.log('\n🎉 Group members table fixed successfully!');
        console.log('💡 The backend should now work correctly with the database.');

    } catch (error) {
        console.error('❌ Error fixing group_members table:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the fix
fixGroupMembersTable(); 