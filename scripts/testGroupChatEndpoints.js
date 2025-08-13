const testGroupChatEndpoints = async () => {
    try {
        console.log('🧪 Testing Group Chat Endpoints...\n');

        const baseURL = 'http://localhost:3000/api';

        // Test 1: Get user groups
        console.log('📊 Test 1: Getting user groups for user ID 1...');
        try {
            const userGroupsResponse = await fetch(`${baseURL}/chat-group/user-groups/1`);
            const userGroupsData = await userGroupsResponse.json();
            console.log('✅ User groups response:', JSON.stringify(userGroupsData, null, 2));

            if (!userGroupsData.success) {
                console.log('❌ Error details:', userGroupsData.message);
            }
        } catch (error) {
            console.error('❌ Error getting user groups:', error.message);
        }

        // Test 2: Get user groups (alternative endpoint)
        console.log('\n📊 Test 2: Getting user groups (alternative endpoint)...');
        try {
            const userGroupsAltResponse = await fetch(`${baseURL}/chat-group/user/1`);
            const userGroupsAltData = await userGroupsAltResponse.json();
            console.log('✅ User groups alt response:', JSON.stringify(userGroupsAltData, null, 2));

            if (!userGroupsAltData.success) {
                console.log('❌ Error details:', userGroupsAltData.message);
            }
        } catch (error) {
            console.error('❌ Error getting user groups (alt):', error.message);
        }

        // Test 3: Get group messages
        console.log('\n📊 Test 3: Getting group messages for group_1...');
        try {
            const groupMessagesResponse = await fetch(`${baseURL}/chat-group/group_1/messages`);
            const groupMessagesData = await groupMessagesResponse.json();
            console.log('✅ Group messages response:', JSON.stringify(groupMessagesData, null, 2));
        } catch (error) {
            console.error('❌ Error getting group messages:', error.message);
        }

        // Test 4: Get group details
        console.log('\n📊 Test 4: Getting group details for group_1...');
        try {
            const groupDetailsResponse = await fetch(`${baseURL}/chat-group/group_1`);
            const groupDetailsData = await groupDetailsResponse.json();
            console.log('✅ Group details response:', JSON.stringify(groupDetailsData, null, 2));

            if (!groupDetailsData.success) {
                console.log('❌ Error details:', groupDetailsData.message);
            }
        } catch (error) {
            console.error('❌ Error getting group details:', error.message);
        }

        console.log('\n🎉 Group chat endpoints test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testGroupChatEndpoints(); 