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
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { $set: req.body },
            { new: true }
        ).select('-hashPassword');
        res.status(200).json(updatedUser);
    } catch (error) {
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

module.exports = { getUser, updateUser, deleteUser, updateUserAvatar };
