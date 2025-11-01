const express = require('express');
const { getUser, updateUser, deleteUser, updateUserAvatar } = require('../controller/userController');
const verifyToken = require('../middleware/verifyToken');
const upload = require('../config/multer');

const router = express.Router();

// get a user profile
router.get('/:id', verifyToken, getUser);

// update user info
router.put('/:id', verifyToken, updateUser);
router.put('/update-avatar/:id', verifyToken, upload.single("avatar"), updateUserAvatar);

// delete user
router.delete('/:id', verifyToken, deleteUser);

module.exports = router;
