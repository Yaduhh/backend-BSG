const { ChatGroup, ChatGroupMember, User, Message } = require('../models');

const testBackendDirectly = async () => {
    try {
        console.log('🧪 Testing Backend Logic Directly...\n');

        // Test 1: Test the exact logic from user-groups endpoint
        console.log('📊 Test 1: Testing user-groups endpoint logic...');
        try {
            const userId = 1;

            const userGroups = await ChatGroupMember.findAll({
                where: {
                    user_id: userId,
                    is_active: true
                },
                include: [{
                    model: ChatGroup,
                    where: { is_active: true },
                    include: [{
                        model: ChatGroupMember,
                        include: [{
                            model: User,
                            as: 'member',
                            attributes: ['id', 'nama', 'username']
                        }]
                    }]
                }]
            });

            console.log(`✅ Found ${userGroups.length} user groups`);
            userGroups.forEach((member, index) => {
                const group = member.ChatGroup;
                console.log(`   ${index + 1}. Group: ${group.group_name} (${group.group_id})`);
                console.log(`      Members: ${group.ChatGroupMembers.length}`);
            });

            // Test the formatting logic
            console.log('\n📊 Test 1.1: Testing formatting logic...');
            const formattedGroups = await Promise.all(userGroups.map(async (member) => {
                const group = member.ChatGroup;

                // Get last message for this group
                const lastMessage = await Message.findOne({
                    where: {
                        room_id: group.group_id,
                        is_group_message: true,
                        status_deleted: false
                    },
                    order: [['created_at', 'DESC']],
                    include: [{
                        model: User,
                        as: 'sender',
                        attributes: ['id', 'nama', 'username']
                    }]
                });

                return {
                    group_id: group.group_id,
                    group_name: group.group_name,
                    group_description: group.group_description,
                    created_by: group.created_by,
                    created_at: group.created_at,
                    last_message: lastMessage ? lastMessage.message : null,
                    last_message_time: lastMessage ? lastMessage.created_at : null,
                    unread_count: 0,
                    members: group.ChatGroupMembers.map(m => ({
                        id: m.member.id,
                        nama: m.member.nama,
                        username: m.member.username,
                        role: m.role
                    }))
                };
            }));

            console.log(`✅ Formatted ${formattedGroups.length} groups`);
            formattedGroups.forEach((group, index) => {
                console.log(`   ${index + 1}. ${group.group_name}: ${group.members.length} members`);
                if (group.last_message) {
                    console.log(`      Last message: ${group.last_message.substring(0, 50)}...`);
                }
            });

        } catch (error) {
            console.error('❌ Error in user-groups logic:', error.message);
            console.error('Full error:', error);
        }

        // Test 2: Test group details endpoint logic
        console.log('\n📊 Test 2: Testing group details endpoint logic...');
        try {
            const groupId = 'group_1';

            const group = await ChatGroup.findOne({
                where: {
                    group_id: groupId,
                    is_active: true
                },
                include: [{
                    model: ChatGroupMember,
                    where: { is_active: true },
                    include: [{
                        model: User,
                        as: 'member',
                        attributes: ['id', 'nama', 'username']
                    }]
                }]
            });

            if (group) {
                console.log(`✅ Found group: ${group.group_name}`);
                console.log(`   Members: ${group.ChatGroupMembers.length}`);
                group.ChatGroupMembers.forEach((member, index) => {
                    console.log(`   ${index + 1}. ${member.member.nama} (${member.role})`);
                });
            } else {
                console.log('❌ Group not found');
            }

        } catch (error) {
            console.error('❌ Error in group details logic:', error.message);
            console.error('Full error:', error);
        }

        console.log('\n🎉 Backend logic test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testBackendDirectly(); 