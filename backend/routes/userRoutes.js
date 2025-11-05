const express = require('express');
const { getUser, updateUser, deleteUser, updateUserAvatar, searchUsers, getAllUsers } = require('../controller/userController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../config/multer');

const router = express.Router();

// Search users (must come before /:id to avoid conflict)
router.get('/search/users', verifyToken, searchUsers);

// Get all users with pagination
router.get('/all/users', verifyToken, getAllUsers);

// get a user profile
router.get('/:id', verifyToken, getUser);

// update user info
router.put('/:id', verifyToken, updateUser);
router.put('/update-avatar/:id', verifyToken, upload.single("avatar"), updateUserAvatar);

// Complete profile (avatar + bio) - for signup step 2
router.put('/complete-profile/:id', verifyToken, upload.single("avatar"), updateUser);

// delete user
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;
