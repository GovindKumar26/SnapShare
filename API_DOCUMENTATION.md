# SnapShare API Documentation

## Pagination & Search Features

### Posts Endpoints

#### 1. Get All Posts (with Pagination & Search)
```
GET /api/posts?page=1&limit=10&search=keyword
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)
- `search` (optional): Search in title and caption

**Response:**
```json
{
  "posts": [
    {
      "_id": "post_id",
      "user": {
        "_id": "user_id",
        "username": "john_doe",
        "avatarUrl": "cloudinary_url"
      },
      "title": "Post Title",
      "caption": "Post caption",
      "imageUrl": "cloudinary_url",
      "likeCount": 5,
      "createdAt": "2025-11-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 50,
    "postsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Example Usage:**
```javascript
// Get first page with 10 posts
GET /api/posts?page=1&limit=10

// Search for posts with "sunset"
GET /api/posts?search=sunset

// Page 2 with 20 posts per page
GET /api/posts?page=2&limit=20

// Search with pagination
GET /api/posts?search=beach&page=1&limit=5
```

---

#### 2. Get User Posts (with Pagination)
```
GET /api/posts/user/:id?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Posts per page (default: 10)

**Response:** Same structure as Get All Posts

**Example Usage:**
```javascript
// Get first page of user's posts
GET /api/posts/user/507f1f77bcf86cd799439011?page=1&limit=10

// Get second page with 20 posts
GET /api/posts/user/507f1f77bcf86cd799439011?page=2&limit=20
```

---

### Users Endpoints

#### 3. Search Users
```
GET /api/users/search/users?search=keyword&page=1&limit=10
```

**Query Parameters:**
- `search` (optional): Search in username, displayName, and bio
- `page` (optional): Page number (default: 1)
- `limit` (optional): Users per page (default: 10)

**Response:**
```json
{
  "users": [
    {
      "_id": "user_id",
      "username": "john_doe",
      "displayName": "John Doe",
      "email": "john@example.com",
      "avatarUrl": "cloudinary_url",
      "bio": "Hi, I'm using SnapShare!",
      "createdAt": "2025-11-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 3,
    "totalUsers": 30,
    "usersPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

**Example Usage:**
```javascript
// Search for users with "john"
GET /api/users/search/users?search=john

// Search with pagination
GET /api/users/search/users?search=john&page=2&limit=5
```

---

#### 4. Get All Users (with Pagination)
```
GET /api/users/all/users?page=1&limit=10
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Users per page (default: 10)

**Response:** Same structure as Search Users

**Example Usage:**
```javascript
// Get first page with 10 users
GET /api/users/all/users?page=1&limit=10

// Get third page with 20 users
GET /api/users/all/users?page=3&limit=20
```

---

## Implementation Details

### How Pagination Works
```javascript
// Query parameters
const page = parseInt(req.query.page) || 1;      // Current page (default: 1)
const limit = parseInt(req.query.limit) || 10;    // Items per page (default: 10)
const skip = (page - 1) * limit;                  // Items to skip

// MongoDB query
const posts = await Post.find(query)
  .skip(skip)      // Skip items from previous pages
  .limit(limit);   // Limit results to specified number
```

### How Search Works
```javascript
// For posts - search in title and caption
const query = {
  $or: [
    { title: { $regex: search, $options: 'i' } },    // Case-insensitive
    { caption: { $regex: search, $options: 'i' } }
  ]
};

// For users - search in username, displayName, and bio
const query = {
  $or: [
    { username: { $regex: search, $options: 'i' } },
    { displayName: { $regex: search, $options: 'i' } },
    { bio: { $regex: search, $options: 'i' } }
  ]
};
```

---

## Frontend Integration Examples

### React/JavaScript Example

```javascript
// Fetch posts with pagination and search
const fetchPosts = async (page = 1, limit = 10, search = '') => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search })
    });

    const response = await fetch(`/api/posts?${params}`, {
      credentials: 'include' // Include cookies for auth
    });

    const data = await response.json();
    
    console.log('Posts:', data.posts);
    console.log('Current Page:', data.pagination.currentPage);
    console.log('Total Pages:', data.pagination.totalPages);
    console.log('Has Next Page:', data.pagination.hasNextPage);
    
    return data;
  } catch (error) {
    console.error('Error fetching posts:', error);
  }
};

// Search users
const searchUsers = async (searchTerm, page = 1) => {
  try {
    const response = await fetch(
      `/api/users/search/users?search=${searchTerm}&page=${page}`,
      { credentials: 'include' }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching users:', error);
  }
};

// Usage
fetchPosts(1, 10, 'sunset');  // Get first page, search for "sunset"
searchUsers('john', 1);        // Search for users with "john"
```

---

## Best Practices

1. **Default Values**: Always provide defaults for `page` and `limit`
   ```javascript
   const page = parseInt(req.query.page) || 1;
   const limit = parseInt(req.query.limit) || 10;
   ```

2. **Validate Input**: Ensure page and limit are positive integers
   ```javascript
   if (page < 1) page = 1;
   if (limit < 1 || limit > 100) limit = 10; // Cap at 100
   ```

3. **Count Total First**: Use `countDocuments()` before fetching data
   ```javascript
   const total = await Post.countDocuments(query);
   ```

4. **Calculate Pagination Info**: Provide helpful metadata
   ```javascript
   {
     currentPage: page,
     totalPages: Math.ceil(total / limit),
     totalPosts: total,
     hasNextPage: page < Math.ceil(total / limit),
     hasPrevPage: page > 1
   }
   ```

5. **Empty Search**: If search is empty, return all results (with pagination)

6. **Case-Insensitive Search**: Always use `{ $options: 'i' }` for user-friendly search

---

## Testing Examples

### Using cURL

```bash
# Get posts with pagination
curl -X GET "http://localhost:3000/api/posts?page=1&limit=5" \
  -H "Cookie: accessToken=your_token_here"

# Search posts
curl -X GET "http://localhost:3000/api/posts?search=sunset" \
  -H "Cookie: accessToken=your_token_here"

# Search users
curl -X GET "http://localhost:3000/api/users/search/users?search=john&page=1" \
  -H "Cookie: accessToken=your_token_here"

# Get all users
curl -X GET "http://localhost:3000/api/users/all/users?page=1&limit=10" \
  -H "Cookie: accessToken=your_token_here"
```

### Using Postman

1. Set request type to `GET`
2. Enter URL: `http://localhost:3000/api/posts`
3. Add Query Params:
   - Key: `page`, Value: `1`
   - Key: `limit`, Value: `10`
   - Key: `search`, Value: `sunset` (optional)
4. Ensure cookies are included (accessToken)
5. Send request

---

## Performance Considerations

1. **Indexing**: Add indexes to frequently searched fields
   ```javascript
   // In your models
   UserSchema.index({ username: 1, displayName: 1 });
   PostSchema.index({ title: 1, caption: 1 });
   PostSchema.index({ createdAt: -1 }); // For sorting
   ```

2. **Limit Max Results**: Cap the `limit` parameter to prevent excessive queries
   ```javascript
   const limit = Math.min(parseInt(req.query.limit) || 10, 100);
   ```

3. **Use Select**: Only return necessary fields
   ```javascript
   .select('-hashPassword') // Exclude password
   .populate('user', 'username avatarUrl') // Only include specific fields
   ```

4. **Cache Results**: Consider caching frequently accessed pages

---

## Error Handling

All endpoints return appropriate error responses:

```json
{
  "message": "Error fetching posts"
}
```

Common status codes:
- `200`: Success
- `400`: Bad request (invalid parameters)
- `401`: Unauthorized (no token)
- `500`: Server error

---

## Default Avatar System

### Overview

SnapShare automatically generates default avatars for users who haven't uploaded a custom profile picture using the UI Avatars service (https://ui-avatars.com/).

### How It Works

**When a user registers without an avatar:**
- `avatarUrl` is set to a generated URL based on their display name or username
- No Cloudinary storage is used
- `avatarPublicId` remains `null`

**Example generated URL:**
```
https://ui-avatars.com/api/?name=John%20Doe&size=200&background=random&color=fff&bold=true
```

### Avatar URL Types

All user-related endpoints return an `avatarUrl` field that can be one of two types:

| Type | Example | Storage | Public ID |
|------|---------|---------|-----------|
| **Uploaded** | `https://res.cloudinary.com/...` | Cloudinary | Has value |
| **Generated** | `https://ui-avatars.com/api/?name=...` | None | `null` |

### Affected Endpoints

The following endpoints automatically include default avatars if user hasn't uploaded one:

#### 1. User Registration
```
POST /api/users/register
```
If no avatar file is uploaded, `avatarUrl` is set to generated URL.

#### 2. Get Current User
```
GET /api/auth/me
```
Response includes `avatarUrl` (uploaded or generated).

#### 3. Get User Profile
```
GET /api/users/:id
```
Response includes `avatarUrl` (uploaded or generated).

#### 4. Search Users
```
GET /api/users/search/users
```
All users in results have `avatarUrl` (uploaded or generated).

#### 5. Get All Users
```
GET /api/users/all/users
```
All users in results have `avatarUrl` (uploaded or generated).

#### 6. Get Posts (populated user)
```
GET /api/posts
GET /api/posts/user/:id
```
Posts include populated user with `avatarUrl` (uploaded or generated).

### Frontend Handling

**No special logic needed** - simply display the `avatarUrl`:

```javascript
// React example
<img src={user.avatarUrl} alt={user.username} />

// Avatar component
<Avatar>
  <AvatarImage src={user.avatarUrl} alt={user.username} />
  <AvatarFallback>{user.username?.[0]?.toUpperCase()}</AvatarFallback>
</Avatar>
```

### Generated Avatar Features

- **Personalized:** Shows user's initials (e.g., "JD" for "John Doe")
- **Colorful:** Random background color based on name (consistent per user)
- **Professional:** 200x200px, white text, bold font
- **No Cost:** Generated on-demand, no storage quota used

### Cleanup Behavior

When deleting a user or updating their avatar:
- **Uploaded avatar:** Deleted from Cloudinary (uses `avatarPublicId`)
- **Generated avatar:** No cleanup needed (no storage used)

```javascript
// Backend automatically handles this
if (user.avatarPublicId) {
  await cloudinary.uploader.destroy(user.avatarPublicId);
}
```

### Migration Note

Existing users without `avatarUrl` will automatically receive a generated avatar when their profile is fetched. No database migration required.

---

**Last Updated:** November 7, 2025
