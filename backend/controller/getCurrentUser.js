const User = require("../models/User");

// Helper function to generate default avatar URL based on user's name
const generateDefaultAvatar = (displayName, username) => {
    const name = displayName || username || "User";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=200&background=random&color=fff&bold=true`;
};

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
                avatarUrl: user.avatarUrl || generateDefaultAvatar(user.displayName, user.username),
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
