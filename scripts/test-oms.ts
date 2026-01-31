import { oms } from '../coreos/oms';

async function runTest() {
    console.log('--- OMS v1 Test Harness ---');

    console.log('\n1. Resolve Root (/)');
    const root = await oms.resolve('/');
    console.log(JSON.stringify(root, null, 2));

    if (root && root.path === '/') console.log('✅ Root Resolved');
    else console.error('❌ Root Resolve Failed');

    console.log('\n2. List System Apps (/system/apps)');
    const apps = await oms.list('/system/apps');
    console.log(`Found ${apps.length} apps`);
    apps.forEach(app => console.log(`- ${app.name} (${app.path})`));

    if (apps.length > 0) console.log('✅ System Apps Listed');
    else console.error('❌ System Apps List Failed');

    console.log('\n3. Get User (/data/users/1)');
    const user = await oms.get('/data/users/1');
    console.log(user ? `User: ${user.name} (${user.meta.email})` : 'User not found');

    if (user && user.id === 'user-1') console.log('✅ User Resolved');
    else console.error('❌ User Resolve Failed');

    console.log('\n--- Test Complete ---');
}

runTest().catch(console.error);
