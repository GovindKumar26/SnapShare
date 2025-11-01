const User = require('../models/User');
const cloudinary = require('../config/cloudinary'); // make sure you import it

// @desc Get user profile
// @route GET /api/users/:id
// @access Private
const getUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-hashPassword'); // remove password
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Update user
// @route PUT /api/users/:id
// @access Private
const updateUser = async (req, res) => {
    if (req.user.id !== req.params.id)
        return res.status(403).json({ message: 'You can update only your account' });

    try {
        // Whitelist: destructure only safe fields
        const { displayName, bio, username } = req.body;
        
        const updates = {};
        if (displayName !== undefined) updates.displayName = displayName;
        if (bio !== undefined) updates.bio = bio;
        
        // Username with validation
        if (username !== undefined) {
            const trimmedUsername = username.trim().toLowerCase();
            
            // Validate username format
            if (trimmedUsername.length < 3) {
                return res.status(400).json({ message: 'Username must be at least 3 characters' });
            }
            if (trimmedUsername.length > 30) {
                return res.status(400).json({ message: 'Username must be less than 30 characters' });
            }
            if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
                return res.status(400).json({ message: 'Username can only contain letters, numbers, and underscores' });
            }
            
            // Check if username already exists (and it's not the current user's username)
            const existingUser = await User.findOne({ username: trimmedUsername });
            if (existingUser && existingUser._id.toString() !== req.params.id) {
                return res.status(400).json({ message: 'Username already taken' });
            }
            
            updates.username = trimmedUsername;
        }

        // Validate at least one field present
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true }
        ).select('-hashPassword');
        
        res.status(200).json(updatedUser);
    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Username already taken' });
        }
        res.status(500).json({ message: error.message });
    }
};

const updateUserAvatar = async (req, res) => {
    if (req.user.id !== req.params.id)
        return res.status(403).json({ message: 'You can update only your account' });

    try {
        if (!req.file || !req.file.path)
            return res.status(400).json({ message: 'No file uploaded' });
        
        // Find user to check for old avatar
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        // If user already has an avatar, delete it from Cloudinary
        if (user.avatarPublicId) {
            await cloudinary.uploader.destroy(user.avatarPublicId);
        }
        // req.file.path is already the Cloudinary URL
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: { avatarUrl: req.file.path, avatarPublicId: req.file.filename } },
            { new: true }
        ).select('-hashPassword');

        res.status(200).json({
            message: 'Avatar updated successfully',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Delete user
// @route DELETE /api/users/:id
// @access Private
const deleteUser = async (req, res) => {
    if (req.user.id !== req.params.id)
        return res.status(403).json({ message: 'You can delete only your account' });

    try {
        await User.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc Search users with pagination
// @route GET /api/users/search
// @access Private
const searchUsers = async (req, res) => {
    try {
        // Pagination parameters with validation
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        // Ensure positive values and cap limit
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100; // Cap at 100 to prevent abuse

        const skip = (page - 1) * limit;

        // Search parameter
        const search = req.query.search || '';

        // Build search query
        let query = {};
        if (search) {
            query = {
                $or: [
                    { username: { $regex: search, $options: 'i' } },
                    { displayName: { $regex: search, $options: 'i' } },
                    { bio: { $regex: search, $options: 'i' } }
                ]
            };
        }

        // Get total count for pagination
        const total = await User.countDocuments(query);
        const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

        // Fetch users with pagination (exclude password)
        const users = await User.find(query)
            .select('-hashPassword')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalUsers: total,
                usersPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc Get all users with pagination
// @route GET /api/users
// @access Private
const getAllUsers = async (req, res) => {
    try {
        // Pagination parameters with validation
        let page = parseInt(req.query.page) || 1;
        let limit = parseInt(req.query.limit) || 10;

        // Ensure positive values and cap limit
        if (page < 1) page = 1;
        if (limit < 1) limit = 10;
        if (limit > 100) limit = 100; // Cap at 100 to prevent abuse

        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await User.countDocuments();
        const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

        // Fetch users with pagination (exclude password)
        const users = await User.find()
            .select('-hashPassword')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.status(200).json({
            users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalUsers: total,
                usersPerPage: limit,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getUser, updateUser, deleteUser, updateUserAvatar, searchUsers, getAllUsers };
