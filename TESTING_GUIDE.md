# Testing Guide - SnapShare API

## Testing the searchUsers Endpoint

**Endpoint:** `GET /api/users/search/users`  
**Authentication:** Required (accessToken cookie)  
**Method:** GET

---

## Prerequisites

1. **Server must be running:**
   ```powershell
   cd backend
   npm run dev
   ```

2. **You must be logged in** to get an accessToken cookie
3. **Have some users in the database**

---

## Method 1: Using VS Code REST Client Extension

### Step 1: Install Extension
1. Open VS Code Extensions (Ctrl+Shift+X)
2. Search for "REST Client"
3. Install by Huachao Mao

### Step 2: Create Test File
Create `backend/test.http`:

```http
### Variables
@baseUrl = http://localhost:3000
@accessToken = your_token_here

### Register a test user
POST {{baseUrl}}/register
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW

------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="username"

john_doe
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="email"

john@example.com
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="password"

password123
------WebKitFormBoundary7MA4YWxkTrZu0gW
Content-Disposition: form-data; name="displayName"

John Doe
------WebKitFormBoundary7MA4YWxkTrZu0gW--

### Login to get token
POST {{baseUrl}}/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

### Search users - Basic (searches in username, displayName, bio)
GET {{baseUrl}}/api/users/search/users?search=john
Cookie: accessToken={{accessToken}}

### Search users - With pagination
GET {{baseUrl}}/api/users/search/users?search=john&page=1&limit=5
Cookie: accessToken={{accessToken}}

### Search users - Empty search (returns all users)
GET {{baseUrl}}/api/users/search/users
Cookie: accessToken={{accessToken}}

### Get all users
GET {{baseUrl}}/api/users/all/users?page=1&limit=10
Cookie: accessToken={{accessToken}}
```

---

## Method 2: Using cURL (PowerShell)

### Step 1: Login and capture cookie
```powershell
# Login and save cookies
curl.exe -X POST http://localhost:3000/login `
  -H "Content-Type: application/json" `
  -d '{"email":"john@example.com","password":"password123"}' `
  -c cookies.txt `
  -v

# View saved cookies
cat cookies.txt
```

### Step 2: Search users with saved cookie
```powershell
# Basic search
curl.exe -X GET "http://localhost:3000/api/users/search/users?search=john" `
  -b cookies.txt

# With pagination
curl.exe -X GET "http://localhost:3000/api/users/search/users?search=john&page=1&limit=5" `
  -b cookies.txt

# Empty search (all users)
curl.exe -X GET "http://localhost:3000/api/users/search/users" `
  -b cookies.txt
```

### Alternative: Using token directly
```powershell
# If you know your token
$token = "your_access_token_here"

curl.exe -X GET "http://localhost:3000/api/users/search/users?search=john" `
  -H "Cookie: accessToken=$token"
```

---

## Method 3: Using Postman

### Step 1: Create Collection
1. Open Postman
2. Create new collection: "SnapShare API"

### Step 2: Login Request
1. New Request: "Login"
2. Method: POST
3. URL: `http://localhost:3000/login`
4. Body → raw → JSON:
   ```json
   {
     "email": "john@example.com",
     "password": "password123"
   }
   ```
5. Send
6. Check "Cookies" tab to see accessToken

### Step 3: Search Users Request
1. New Request: "Search Users"
2. Method: GET
3. URL: `http://localhost:3000/api/users/search/users`
4. Params:
   - Key: `search`, Value: `john`
   - Key: `page`, Value: `1`
   - Key: `limit`, Value: `10`
5. **Important:** Cookies are automatically included if you logged in from same Postman window
6. Send

**Expected Response:**
```json
{
  "users": [
    {
      "_id": "673abc123...",
      "username": "john_doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "https://...",
      "bio": "Hi, I'm using SnapShare!",
      "createdAt": "2025-11-02T..."
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 1,
    "totalUsers": 1,
    "usersPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

## Method 4: Using JavaScript/Node.js Script

Create `backend/test-search.js`:

```javascript
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testSearchUsers() {
  try {
    // Step 1: Login
    console.log('1. Logging in...');
    const loginRes = await axios.post(`${BASE_URL}/login`, {
      email: 'john@example.com',
      password: 'password123'
    });

    // Extract cookie from response
    const cookies = loginRes.headers['set-cookie'];
    const accessToken = cookies
      .find(c => c.startsWith('accessToken='))
      .split(';')[0];

    console.log('✅ Logged in successfully');
    console.log('Token:', accessToken);

    // Step 2: Search users
    console.log('\n2. Searching for users with "john"...');
    const searchRes = await axios.get(`${BASE_URL}/api/users/search/users`, {
      params: {
        search: 'john',
        page: 1,
        limit: 5
      },
      headers: {
        Cookie: accessToken
      }
    });

    console.log('✅ Search successful');
    console.log('\nResults:');
    console.log(`Found ${searchRes.data.pagination.totalUsers} users`);
    console.log(`Page ${searchRes.data.pagination.currentPage} of ${searchRes.data.pagination.totalPages}`);
    
    searchRes.data.users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.username} (${user.displayName})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Bio: ${user.bio}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testSearchUsers();
```

Run:
```powershell
cd backend
node test-search.js
```

---

## Method 5: Using Browser DevTools

### Step 1: Login via Browser
1. Open browser: `http://localhost:3000`
2. Login through your app (or Postman)
3. Cookie is automatically stored

### Step 2: Test in DevTools Console
Press F12 → Console:

```javascript
// Fetch API
fetch('http://localhost:3000/api/users/search/users?search=john&page=1&limit=5', {
  credentials: 'include'  // Include cookies
})
  .then(res => res.json())
  .then(data => {
    console.log('Users found:', data.users.length);
    console.log('Pagination:', data.pagination);
    console.table(data.users);
  })
  .catch(err => console.error('Error:', err));
```

---

## Method 6: Using Thunder Client (VS Code Extension)

### Step 1: Install Extension
1. Open VS Code Extensions
2. Search "Thunder Client"
3. Install

### Step 2: Test
1. Open Thunder Client tab (lightning icon)
2. New Request
3. Method: GET
4. URL: `http://localhost:3000/api/users/search/users?search=john`
5. Auth tab → Type: Cookie → Key: `accessToken`, Value: `your_token`
6. Send

---

## Quick Test Script (Recommended)

Create `backend/quick-test.js`:

```javascript
// Quick test - Just run: node quick-test.js

const http = require('http');

const makeRequest = (path, cookie = '') => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: 'GET',
      headers: cookie ? { 'Cookie': cookie } : {}
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        resolve({ status: res.statusCode, data, cookies });
      });
    });

    req.on('error', reject);
    req.end();
  });
};

const loginRequest = (email, password) => {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({ email, password });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const cookies = res.headers['set-cookie'] || [];
        const accessToken = cookies.find(c => c.startsWith('accessToken='));
        resolve({ status: res.statusCode, data, accessToken });
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
};

async function test() {
  try {
    console.log('🔐 Logging in...');
    const login = await loginRequest('john@example.com', 'password123');
    
    if (login.status !== 200) {
      console.log('❌ Login failed:', login.data);
      return;
    }
    
    console.log('✅ Login successful');
    
    console.log('\n🔍 Searching users...');
    const search = await makeRequest('/api/users/search/users?search=john', login.accessToken);
    
    if (search.status !== 200) {
      console.log('❌ Search failed:', search.data);
      return;
    }
    
    const result = JSON.parse(search.data);
    console.log('✅ Search successful');
    console.log(`\nFound ${result.pagination.totalUsers} user(s):`);
    result.users.forEach((u, i) => {
      console.log(`${i+1}. ${u.username} - ${u.displayName}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();
```

Run:
```powershell
node backend/quick-test.js
```

---

## Expected Responses

### Success (200)
```json
{
  "users": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 2,
    "totalUsers": 15,
    "usersPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### No Results (200)
```json
{
  "users": [],
  "pagination": {
    "currentPage": 1,
    "totalPages": 0,
    "totalUsers": 0,
    "usersPerPage": 10,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

### Unauthorized (401)
```json
{
  "message": "Access denied"
}
```

### Server Error (500)
```json
{
  "message": "Error message here"
}
```

---

## Test Cases to Try

1. **Basic search:**
   ```
   GET /api/users/search/users?search=john
   ```

2. **Case-insensitive:**
   ```
   GET /api/users/search/users?search=JOHN
   ```

3. **Partial match:**
   ```
   GET /api/users/search/users?search=joh
   ```

4. **With pagination:**
   ```
   GET /api/users/search/users?search=john&page=1&limit=5
   ```

5. **Empty search (all users):**
   ```
   GET /api/users/search/users
   ```

6. **Search in displayName:**
   ```
   GET /api/users/search/users?search=doe
   ```

7. **Search in bio:**
   ```
   GET /api/users/search/users?search=snapshare
   ```

8. **No results:**
   ```
   GET /api/users/search/users?search=nonexistentuser12345
   ```

9. **Special characters:**
   ```
   GET /api/users/search/users?search=user_name
   ```

10. **Large page number:**
    ```
    GET /api/users/search/users?search=john&page=999
    ```

---

## Troubleshooting

### "Access denied" error
- Make sure you're logged in
- Check cookie is being sent
- Verify token hasn't expired (1 day)

### Empty results
- Check database has users
- Verify search term exists in username/displayName/bio
- Try empty search to see all users

### Server not responding
- Check server is running on port 3000
- Check MongoDB is connected
- Check console for errors

---

## My Recommendation

**Easiest for quick testing:** Method 6 (Thunder Client) or Method 2 (cURL)  
**Best for development:** Method 1 (REST Client extension)  
**Best for automation:** Method 4 (Node.js script)
