# SnapShare Backend - Development Notes

## Table of Contents
1. [Mongoose Pre-Hooks & Middleware](#mongoose-pre-hooks--middleware)
2. [Static vs Instance Methods](#static-vs-instance-methods)
3. [Cascade Deletion Implementation](#cascade-deletion-implementation)
4. [Field Whitelisting](#field-whitelisting)
5. [File Upload Flow](#file-upload-flow)
6. [Object.keys() Explained](#objectkeys-explained)
7. [Pagination & Search](#pagination--search)
8. [Security Best Practices](#security-best-practices)

---

## Mongoose Pre-Hooks & Middleware

### What Are Pre-Hooks?

Pre-hooks are middleware functions that run **before** a specific Mongoose operation executes. They allow you to perform tasks like validation, cleanup, or data transformation automatically.

### Basic Syntax

```javascript
SchemaName.pre('operationName', async function(next) {
    // Your code here
    next(); // Must call to continue to actual operation
});
```

### Two Types of Middleware

#### 1. Query Middleware
Used when operations are called on the **Model** (static methods).

```javascript
UserSchema.pre('findOneAndDelete', async function(next) {
    // 'this' = Query object
    const userId = this.getQuery()._id;  // Get ID from query conditions
    
    // Fetch the document if needed
    const user = await mongoose.model('User').findById(userId);
    
    // Do cleanup
    await Post.deleteMany({ user: userId });
    
    next();
});
```

**When to use:**
- `findOneAndDelete`, `findByIdAndDelete`
- `findOneAndUpdate`, `findByIdAndUpdate`
- `updateOne`, `updateMany`, `deleteMany`

#### 2. Document Middleware
Used when operations are called on a **document instance**.

```javascript
PostSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    // 'this' = the actual document
    const postId = this._id;  // Direct access to document fields
    
    // Do cleanup
    await Comment.deleteMany({ post: postId });
    
    next();
});
```

**When to use:**
- `save()`, `validate()`
- `deleteOne()` when called on document: `doc.deleteOne()`
- `updateOne()` when called on document: `doc.updateOne()`

### Key Methods in Pre-Hooks

#### Query Middleware Methods:
```javascript
this.getQuery();        // Returns query conditions: { _id: '507f...' }
this.getFilter();       // Same as getQuery() (alias)
this.model;             // The Model (User, Post, etc.)
```

#### Document Middleware Methods:
```javascript
this._id;               // Document's ID
this.fieldName;         // Direct access to any field
this.save();            // Can call other document methods
```

---

## Static vs Instance Methods

### Static Methods = Called on Model (Class)

```javascript
// These are STATIC methods:
User.findById(id)
User.findByIdAndDelete(id)
User.create({ ... })
Post.find({ ... })
Model.updateOne({ ... })
```

**How to recognize:**
- Called directly on Model (capital letter: `User`, `Post`)
- No variable holding a document first
- One-step operation

### Instance Methods = Called on Document (Object)

```javascript
// These are INSTANCE methods:
const user = await User.findById(id);  // Step 1: Get document
user.save();                           // Step 2: Call on instance
user.deleteOne();

const post = await Post.findById(id);
post.deleteOne();
```

**How to recognize:**
- Called on a variable (lowercase: `user`, `post`)
- Two-step process: fetch first, then operate
- Variable holds a document instance

### Quick Reference Table

| Your Code | Type | Middleware Type | Access ID |
|-----------|------|----------------|-----------|
| `User.findByIdAndDelete(id)` | Static | Query | `this.getQuery()._id` |
| `doc.deleteOne()` | Instance | Document | `this._id` |
| `User.create()` | Static | Query | N/A |
| `doc.save()` | Instance | Document | `this._id` |

### Special Case: `deleteOne()`

`deleteOne()` can be **both static and instance**:

```javascript
// Static (Query Middleware)
await Post.deleteOne({ _id: id });

// Instance (Document Middleware)  
const post = await Post.findById(id);
await post.deleteOne();
```

To specify document middleware for `deleteOne`:
```javascript
PostSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    // This only runs for doc.deleteOne(), not Model.deleteOne()
});
```

---

## Cascade Deletion Implementation

### User Model Pre-Hook

When a user is deleted, automatically clean up:
1. User's avatar from Cloudinary
2. All user's post images from Cloudinary
3. All user's posts
4. All user's likes
5. All user's comments
6. All follow relationships

```javascript
UserSchema.pre('findOneAndDelete', async function(next) {
    try {
        const userId = this.getQuery()._id;
        const Post = require('./Post');
        const Like = require('./Likes');
        const Comment = require('./Comment');
        const Follow = require('./Follow');
        const cloudinary = require('../config/cloudinary');
        
        const user = await mongoose.model('User').findById(userId);
        
        if (user) {
            // Delete avatar from Cloudinary
            if (user.avatarPublicId) {
                await cloudinary.uploader.destroy(user.avatarPublicId);
            }
            
            // Delete all post images
            const userPosts = await Post.find({ user: userId });
            for (const post of userPosts) {
                if (post.imagePublicId) {
                    await cloudinary.uploader.destroy(post.imagePublicId);
                }
            }
            
            // Delete all related data
            await Post.deleteMany({ user: userId });
            await Like.deleteMany({ user: userId });
            await Comment.deleteMany({ user: userId });
            await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });
        }
        
        next();
    } catch (error) {
        console.error('Error in User pre-delete hook:', error);
        next(error);
    }
});
```

### Post Model Pre-Hook

When a post is deleted, automatically clean up:
1. Post image from Cloudinary
2. All likes for the post
3. All comments for the post

```javascript
PostSchema.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const postId = this._id;
        const Like = require('./Likes');
        const Comment = require('./Comment');
        const cloudinary = require('../config/cloudinary');
        
        // Delete image from Cloudinary
        if (this.imagePublicId) {
            await cloudinary.uploader.destroy(this.imagePublicId);
        }
        
        // Delete all likes and comments
        await Like.deleteMany({ post: postId });
        await Comment.deleteMany({ post: postId });
        
        next();
    } catch (error) {
        console.error('Error in Post pre-delete hook:', error);
        next(error);
    }
});
```

### Advantages
- ✅ Centralized cleanup logic in models
- ✅ Automatic - runs every time delete is called
- ✅ Prevents orphaned data
- ✅ Prevents storage leaks in Cloudinary
- ✅ Controllers stay simple and clean

---

## Field Whitelisting

### The Problem

If you allow `$set: req.body` in updates, clients can modify **any** field:

```javascript
// ❌ UNSAFE - Client can update anything
await User.findByIdAndUpdate(id, { $set: req.body });

// Client sends:
{ hashPassword: "hacked", email: "evil@example.com" }
// Bypasses validation and security!
```

### The Solution: Whitelist Safe Fields

Only extract and update fields that are safe to change:

```javascript
// ✅ SAFE - Only allowed fields
const { displayName, bio, username } = req.body;

const updates = {};
if (displayName !== undefined) updates.displayName = displayName;
if (bio !== undefined) updates.bio = bio;
if (username !== undefined) {
    // Additional validation for username
    updates.username = username;
}

if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
}

await User.findByIdAndUpdate(id, { $set: updates }, { new: true });
```

### What Gets Blocked vs Allowed

**❌ Blocked (dangerous fields):**
- `hashPassword` - Would bypass bcrypt hashing
- `email` - Would bypass uniqueness validation
- `avatarUrl` - Should only be updated via `updateUserAvatar`
- `avatarPublicId` - Would corrupt avatar tracking
- `_id` - Can't change primary key

**✅ Allowed (safe fields):**
- `displayName` - Safe to change anytime
- `bio` - Safe to change anytime
- `username` - Safe with proper validation (uniqueness, format)

---

## File Upload Flow

### How Multer Works

```
Client sends multipart/form-data
    ↓
POST /api/posts
    ↓
verifyToken middleware (checks auth)
    ↓
upload.single("image") middleware (MULTER)
    ↓
  ├─ Extracts file from "image" field
  ├─ Uploads to Cloudinary (via CloudinaryStorage)
  ├─ Populates req.file with:
  │    req.file.path → Cloudinary URL
  │    req.file.filename → Cloudinary public_id
  └─ Calls next()
    ↓
createPost controller
    ↓
  ├─ Reads req.file.path and req.file.filename
  ├─ Creates Post with those values
  └─ Saves to MongoDB
```

### Multer Configuration

```javascript
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "avatars",
        allowed_formats: ['jpg', 'png', 'jpeg'],
        public_id: (req, file) => Date.now() + "-" + file.originalname,
    }
});

const upload = multer({ storage });
```

### Usage in Routes

```javascript
// Register with avatar
router.post('/register', upload.single("avatar"), register);

// Update avatar
router.put('/update-avatar/:id', verifyToken, upload.single("avatar"), updateUserAvatar);

// Create post with image
router.post('/', verifyToken, upload.single('image'), createPost);
```

### Client-Side Example

```javascript
const formData = new FormData();
formData.append('image', fileInput.files[0]);  // Actual File object
formData.append('title', 'My Post');
formData.append('caption', 'Check this out!');

fetch('/api/posts', {
  method: 'POST',
  body: formData,
  credentials: 'include',  // Include cookies for auth
  // Don't set Content-Type - browser sets it with boundary
});
```

---

## Object.keys() Explained

### What is Object.keys()?

Returns an **array** of an object's property names (keys).

```javascript
const user = { name: "Alice", age: 25, city: "NYC" };

Object.keys(user);
// Returns: ["name", "age", "city"]

Object.keys(user).length;
// Returns: 3
```

### Usage in Validation

Check if any valid fields were provided for update:

```javascript
const updates = {};
if (displayName !== undefined) updates.displayName = displayName;
if (bio !== undefined) updates.bio = bio;

// Check if updates object is empty
if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: 'No valid fields to update' });
}
```

### Related Methods

```javascript
const user = { name: "Alice", age: 25 };

Object.keys(user);     // ["name", "age"] - array of keys
Object.values(user);   // ["Alice", 25] - array of values
Object.entries(user);  // [["name", "Alice"], ["age", 25]] - array of [key, value] pairs
```

---

## Security Best Practices

### 1. Never Log Sensitive Data
```javascript
// ❌ BAD
console.log(createdUser);  // Logs hashPassword, email, etc.

// ✅ GOOD
console.log('User created:', createdUser._id);
```

### 2. Whitelist Update Fields
```javascript
// ❌ BAD
{ $set: req.body }  // Client can update anything

// ✅ GOOD
const { displayName, bio } = req.body;
{ $set: { displayName, bio } }
```

### 3. Exclude Passwords from Responses
```javascript
// Always exclude hashPassword
const user = await User.findById(id).select('-hashPassword');
```

### 4. Use Environment Variables
```javascript
// ❌ BAD
const connectionString = 'mongodb://localhost:27017/myDB';

// ✅ GOOD
const connectionString = process.env.MONGO_URI || 'mongodb://localhost:27017/myDB';
```

### 5. Validate Input
```javascript
// Validate username format
if (!/^[a-z0-9_]+$/.test(username)) {
    return res.status(400).json({ message: 'Invalid username format' });
}

// Check uniqueness
const existingUser = await User.findOne({ username });
if (existingUser) {
    return res.status(400).json({ message: 'Username already taken' });
}
```

### 6. Handle Errors Safely
```javascript
// ❌ BAD
res.status(500).json({ message: "Error", error });  // Exposes stack trace

// ✅ GOOD
res.status(500).json({ message: error.message });  // Only message
```

### 7. Use httpOnly Cookies for Tokens
```javascript
res.cookie("accessToken", token, {
    httpOnly: true,                           // Can't be accessed by JavaScript
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in production
    maxAge: 24 * 60 * 60 * 1000              // 1 day
});
```

---

## Common Patterns

### Token Generation
```javascript
const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
    
    const refreshToken = jwt.sign(
        { id: user._id, username: user.username, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    
    return { accessToken, refreshToken };
};
```

### Authorization Check
```javascript
if (req.user.id !== req.params.id) {
    return res.status(403).json({ message: 'You can only update your own account' });
}
```

### Cloudinary Cleanup Pattern
```javascript
if (user.avatarPublicId) {
    try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
    } catch (err) {
        console.error('Failed to delete from Cloudinary:', err);
        // Continue anyway - don't block the operation
    }
}
```

---

## Useful MongoDB Queries

### Find with OR Condition
```javascript
const user = await User.findOne({
    $or: [{ email }, { username }]
});
```

### Increment/Decrement Field
```javascript
await Post.findByIdAndUpdate(
    postId,
    { $inc: { likeCount: 1 } },  // Increment by 1
    { new: true }                 // Return updated document
);
```

### Delete Many with OR
```javascript
await Follow.deleteMany({
    $or: [{ follower: userId }, { following: userId }]
});
```

### Populate References
```javascript
const posts = await Post.find()
    .populate("user", "username avatarUrl")  // Populate user, only these fields
    .sort({ createdAt: -1 });                // Newest first
```

---

## Notes & Tips

### Import Models in Pre-Hooks
Always require models inside the hook to avoid circular dependencies:
```javascript
UserSchema.pre('findOneAndDelete', async function(next) {
    const Post = require('./Post');  // ✅ Inside hook
    const Like = require('./Likes');
    // ...
});
```

### Error Handling in Hooks
Always wrap in try/catch and call `next(error)` on failure:
```javascript
try {
    // Cleanup code
    next();
} catch (error) {
    console.error('Error in hook:', error);
    next(error);  // Pass error to Mongoose
}
```

### Mongoose vs MongoDB Methods
- `findByIdAndDelete()` → Triggers Mongoose middleware ✅
- `collection.deleteOne()` → Direct MongoDB, bypasses middleware ❌

Always use Mongoose methods to ensure hooks run!

---

## Project Structure

```
backend/
├── config/
│   ├── cloudinary.js      # Cloudinary configuration
│   ├── db.js              # MongoDB connection
│   └── multer.js          # Multer/Cloudinary storage config
├── controller/
│   ├── commentController.js
│   ├── followController.js
│   ├── likeController.js
│   ├── login.js
│   ├── logout.js
│   ├── postController.js
│   ├── refreshToken.js
│   ├── register.js
│   └── userController.js
├── middleware/
│   └── verifyToken.js     # JWT verification middleware
├── models/
│   ├── Comment.js         # Comment schema + pre-hooks
│   ├── Follow.js          # Follow schema
│   ├── Likes.js           # Like schema
│   ├── Post.js            # Post schema + pre-hooks
│   └── User.js            # User schema + pre-hooks
├── routes/
│   ├── commentRoutes.js
│   ├── followRoutes.js
│   ├── likeRoutes.js
│   ├── postRoutes.js
│   └── userRoutes.js
└── server.js              # Express app entry point
```

---

## Pagination & Search

### Overview

Pagination and search features have been added to both Posts and Users endpoints to handle large datasets efficiently.

### Key Concepts

#### 1. Pagination Parameters
```javascript
const page = parseInt(req.query.page) || 1;      // Current page (default: 1)
const limit = parseInt(req.query.limit) || 10;    // Items per page (default: 10)
const skip = (page - 1) * limit;                  // Items to skip
```

#### 2. MongoDB Skip & Limit
```javascript
const posts = await Post.find(query)
  .skip(skip)      // Skip items from previous pages
  .limit(limit);   // Limit results per page
```

#### 3. Total Count
```javascript
const total = await Post.countDocuments(query);
```

#### 4. Pagination Metadata
```javascript
{
  currentPage: page,
  totalPages: Math.ceil(total / limit),
  totalPosts: total,
  postsPerPage: limit,
  hasNextPage: page < Math.ceil(total / limit),
  hasPrevPage: page > 1
}
```

### Search Implementation

#### Posts Search (Title & Caption)
```javascript
const search = req.query.search || '';
const query = search ? {
  $or: [
    { title: { $regex: search, $options: 'i' } },    // Case-insensitive
    { caption: { $regex: search, $options: 'i' } }
  ]
} : {};
```

#### Users Search (Username, DisplayName & Bio)
```javascript
const query = search ? {
  $or: [
    { username: { $regex: search, $options: 'i' } },
    { displayName: { $regex: search, $options: 'i' } },
    { bio: { $regex: search, $options: 'i' } }
  ]
} : {};
```

### API Endpoints

| Endpoint | Query Params | Description |
|----------|-------------|-------------|
| `GET /api/posts` | `page`, `limit`, `search` | Get all posts with pagination & search |
| `GET /api/posts/user/:id` | `page`, `limit` | Get user's posts with pagination |
| `GET /api/users/search/users` | `search`, `page`, `limit` | Search users by username/name/bio |
| `GET /api/users/all/users` | `page`, `limit` | Get all users with pagination |

### Example Usage

```javascript
// Get posts - page 1, 10 per page
GET /api/posts?page=1&limit=10

// Search posts for "sunset"
GET /api/posts?search=sunset&page=1&limit=5

// Get user's posts - page 2, 20 per page
GET /api/posts/user/507f1f77bcf86cd799439011?page=2&limit=20

// Search users for "john"
GET /api/users/search/users?search=john&page=1&limit=10
```

### Response Structure

```javascript
{
  "posts": [...],  // or "users": [...]
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalPosts": 50,       // or totalUsers
    "postsPerPage": 10,     // or usersPerPage
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

### Performance Tips

1. **Add Indexes** for searched fields:
   ```javascript
   UserSchema.index({ username: 1, displayName: 1 });
   PostSchema.index({ title: 1, caption: 1 });
   PostSchema.index({ createdAt: -1 });
   ```

2. **Limit Max Results**: Cap the limit to prevent abuse
   ```javascript
   const limit = Math.min(parseInt(req.query.limit) || 10, 100);
   ```

3. **Use Select**: Only return necessary fields
   ```javascript
   .select('-hashPassword')
   .populate('user', 'username avatarUrl')
   ```

4. **Empty Search Optimization**: If no search term, skip regex matching
   ```javascript
   const query = search ? { /* search logic */ } : {};
   ```

---

**Last Updated:** November 1, 2025
**Status:** Backend 90% production-ready. Pagination & search implemented. See API_DOCUMENTATION.md for full details.
