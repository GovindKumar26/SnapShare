const User = require("../models/User");

const getCurrentUser = async (req, res) => {
    try {
        // req.user is set by verifyToken middleware
        const user = await User.findById(req.user.id).select('-hashPassword');
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.status(200).json({
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                displayName: user.displayName,
                avatarUrl: user.avatarUrl,
                bio: user.bio,
                website: user.website
            }
        });
    } catch (err) {
        console.error("Error fetching current user:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = getCurrentUser;
