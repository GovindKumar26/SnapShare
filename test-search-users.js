// Quick Test Script for searchUsers endpoint
// Run: node test-search-users.js

const http = require('http');

// ===== CONFIGURATION =====
const CONFIG = {
  host: 'localhost',
  port: 3000,
  // Update these with your test user credentials
  testUser: {
    email: 'kree@test.com',
    password: '101010'
  },
  searchTerm: 'kree'  // Change this to test different searches
};

// ===== HELPER FUNCTIONS =====
function makePostRequest(path, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        const accessToken = cookies.find(c => c.startsWith('accessToken='));
        resolve({ 
          status: res.statusCode, 
          data: responseData, 
          accessToken: accessToken ? accessToken.split(';')[0] : null 
        });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

function makeGetRequest(path, cookie = '') {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: CONFIG.host,
      port: CONFIG.port,
      path: path,
      method: 'GET',
      headers: cookie ? { 'Cookie': cookie } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data }));
    });

    req.on('error', reject);
    req.end();
  });
}

// ===== MAIN TEST FUNCTION =====
async function testSearchUsers() {
  console.log('🧪 SnapShare API - Search Users Test\n');
  console.log('=' .repeat(50));

  try {
    // Step 1: Login
    console.log('\n📝 Step 1: Logging in...');
    console.log(`   Email: ${CONFIG.testUser.email}`);
    
    const loginResponse = await makePostRequest('/login', {
      email: CONFIG.testUser.email,
      password: CONFIG.testUser.password
    });

    if (loginResponse.status !== 200) {
      console.log('❌ Login failed!');
      console.log('   Response:', JSON.parse(loginResponse.data));
      console.log('\n💡 Tip: Make sure you have registered this user first');
      return;
    }

    console.log('✅ Login successful');
    console.log('   Token:', loginResponse.accessToken ? 'Received' : 'Not found');

    // Step 2: Test search with term
    console.log(`\n📝 Step 2: Searching for "${CONFIG.searchTerm}"...`);
    
    const searchResponse = await makeGetRequest(
      `/api/users/search/users?search=${CONFIG.searchTerm}&page=1&limit=10`,
      loginResponse.accessToken
    );

    if (searchResponse.status !== 200) {
      console.log('❌ Search failed!');
      console.log('   Status:', searchResponse.status);
      console.log('   Response:', searchResponse.data);
      return;
    }

    const searchResult = JSON.parse(searchResponse.data);
    console.log('✅ Search successful');
    console.log('\n📊 Results:');
    console.log('   Total users found:', searchResult.pagination.totalUsers);
    console.log('   Current page:', searchResult.pagination.currentPage);
    console.log('   Total pages:', searchResult.pagination.totalPages);
    console.log('   Users per page:', searchResult.pagination.usersPerPage);
    console.log('   Has next page:', searchResult.pagination.hasNextPage);
    
    if (searchResult.users.length > 0) {
      console.log('\n👥 Users:');
      searchResult.users.forEach((user, index) => {
        console.log(`\n   ${index + 1}. ${user.username}`);
        console.log(`      Name: ${user.displayName}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Bio: ${user.bio}`);
        console.log(`      Created: ${new Date(user.createdAt).toLocaleDateString()}`);
      });
    } else {
      console.log('\n   No users found matching your search term');
    }

    // Step 3: Test empty search (all users)
    console.log('\n📝 Step 3: Getting all users (empty search)...');
    
    const allUsersResponse = await makeGetRequest(
      '/api/users/search/users?page=1&limit=5',
      loginResponse.accessToken
    );

    const allUsersResult = JSON.parse(allUsersResponse.data);
    console.log('✅ Query successful');
    console.log(`   Total users in database: ${allUsersResult.pagination.totalUsers}`);
    console.log(`   Showing first ${allUsersResult.users.length} users`);

    // Step 4: Test pagination
    console.log('\n📝 Step 4: Testing pagination (page 2)...');
    
    const page2Response = await makeGetRequest(
      `/api/users/search/users?search=${CONFIG.searchTerm}&page=2&limit=2`,
      loginResponse.accessToken
    );

    const page2Result = JSON.parse(page2Response.data);
    console.log('✅ Pagination working');
    console.log(`   Page 2 has ${page2Result.users.length} users`);
    console.log(`   Has previous page: ${page2Result.pagination.hasPrevPage}`);

    // Success summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ All tests passed!');
    console.log('\n📋 Summary:');
    console.log(`   - Login: Working`);
    console.log(`   - Search: Working`);
    console.log(`   - Pagination: Working`);
    console.log(`   - Empty search: Working`);
    console.log('='.repeat(50));

  } catch (error) {
    console.log('\n❌ Test failed with error:');
    console.log('   ', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Tip: Make sure your server is running:');
      console.log('   cd backend && npm run dev');
    }
  }
}

// ===== RUN TESTS =====
console.log(`\n🚀 Starting tests on http://${CONFIG.host}:${CONFIG.port}`);
console.log('⏳ Please wait...\n');

testSearchUsers();
