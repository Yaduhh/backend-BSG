const { sequelize } = require('../config/database');
const { ChatGroup, ChatGroupMember, User, Message } = require('../models');

const debugGroupChat = async () => {
    try {
        console.log('🔍 Debugging Group Chat...\n');

        // Test 1: Check if models are working
        console.log('📊 Test 1: Testing basic model queries...');
        
        // Test ChatGroupMember
        console.log('🔍 Testing ChatGroupMember.findAll()...');
        try {
            const members = await ChatGroupMember.findAll({
                where: { user_id: 1, is_active: true },
                limit: 5
            });
            console.log(`✅ Found ${members.length} members for user 1`);
            members.forEach((member, index) => {
                console.log(`   ${index + 1}. Group: ${member.group_id}, Role: ${member.role}`);
            });
        } catch (error) {
            console.error('❌ ChatGroupMember error:', error.message);
        }

        // Test ChatGroup
        console.log('\n🔍 Testing ChatGroup.findAll()...');
        try {
            const groups = await ChatGroup.findAll({
                where: { is_active: true },
                limit: 5
            });
            console.log(`✅ Found ${groups.length} active groups`);
            groups.forEach((group, index) => {
                console.log(`   ${index + 1}. ID: ${group.group_id}, Name: ${group.group_name}`);
            });
        } catch (error) {
            console.error('❌ ChatGroup error:', error.message);
        }

        // Test 2: Test associations
        console.log('\n📊 Test 2: Testing associations...');
        try {
            const userGroups = await ChatGroupMember.findAll({
                where: { user_id: 1, is_active: true },
                include: [{
                    model: ChatGroup,
                    where: { is_active: true }
                }],
                limit: 3
            });
            console.log(`✅ Found ${userGroups.length} groups with associations for user 1`);
            userGroups.forEach((member, index) => {
                console.log(`   ${index + 1}. Group: ${member.ChatGroup.group_name} (${member.ChatGroup.group_id})`);
            });
        } catch (error) {
            console.error('❌ Association error:', error.message);
            console.error('Error details:', error);
        }

        // Test 3: Test with raw SQL to compare
        console.log('\n📊 Test 3: Testing with raw SQL...');
        try {
            const rawResult = await sequelize.query(`
                SELECT gm.*, cg.group_name, cg.group_description
                FROM group_members gm
                LEFT JOIN chat_groups cg ON gm.group_id = cg.group_id
                WHERE gm.user_id = 1 AND gm.is_active = 1 AND cg.is_active = 1
                LIMIT 5
            `, { type: sequelize.QueryTypes.SELECT });
            
            console.log(`✅ Raw SQL found ${rawResult.length} results:`);
            rawResult.forEach((row, index) => {
                console.log(`   ${index + 1}. Group: ${row.group_name} (${row.group_id}), Role: ${row.role}`);
            });
        } catch (error) {
            console.error('❌ Raw SQL error:', error.message);
        }

        console.log('\n🎉 Debug completed!');

    } catch (error) {
        console.error('❌ Debug failed:', error);
    } finally {
        await sequelize.close();
    }
};

// Run the debug
debugGroupChat(); 