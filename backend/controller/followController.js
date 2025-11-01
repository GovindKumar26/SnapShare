const Follow = require("../models/Follow");
const User = require("../models/User");

const followUser = async (req, res) => {
  try {
    const { userId } = req.params; // user to follow
    const currentUserId = req.user.id || req.user._id; // logged-in user

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself." });
    }

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found." });
    }

    await Follow.create({ follower: currentUserId, following: userId });
    res.status(201).json({ message: "User followed successfully." });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Already following this user." });
    }
    res.status(500).json({ message: "Error following user.", error });
  }
};

const unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user._id;

    const result = await Follow.findOneAndDelete({ follower: currentUserId, following: userId });
    
    if (!result) {
      return res.status(404).json({ message: "You are not following this user." });
    }

    res.json({ message: "Unfollowed successfully." });
  } catch (error) {
    res.status(500).json({ message: "Error unfollowing user.", error });
  }
};

const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params;
    const followers = await Follow.find({ following: userId })
      .populate("follower", "username avatarUrl");
    res.json(followers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching followers.", error });
  }
};

const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params;
    const following = await Follow.find({ follower: userId })
      .populate("following", "username avatarUrl");
    res.json(following);
  } catch (error) {
    res.status(500).json({ message: "Error fetching following.", error });
  }
};

module.exports = { followUser, unfollowUser, getFollowers, getFollowing };
