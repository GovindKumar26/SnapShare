// controllers/likeController.js
const mongoose = require('mongoose');
const Like = require('../models/Likes');
const Post = require('../models/Post');

// Toggle like/unlike for a post. Expects { postId } in the request body
exports.toggleLike = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id; // support either shape in token
    const { postId } = req.body;

    // Basic validation
    if (!postId) return res.status(400).json({ message: 'postId is required' });
    if (!mongoose.Types.ObjectId.isValid(postId)) return res.status(400).json({ message: 'postId is not a valid id' });
    if (!userId) return res.status(401).json({ message: 'invalid token payload' });

    // Check if post exists
    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Check if already liked
    const existingLike = await Like.findOne({ user: userId, post: postId });

    if (existingLike) {
      // Unlike (remove like)
      await existingLike.deleteOne();
      const updatedPost = await Post.findByIdAndUpdate(postId, { $inc: { likeCount: -1 } }, { new: true });
      return res.status(200).json({ liked: false, likeCount: updatedPost?.likeCount ?? 0 });
    } else {
      // Like (create new like)
      try {
        await Like.create({ user: userId, post: postId });
      } catch (createErr) {
        // Handle duplicate-key race where another request inserted the like concurrently
        if (createErr?.code === 11000) {
          const currentPost = await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { new: true });
          return res.status(200).json({ liked: true, likeCount: currentPost?.likeCount ?? 0 });
        }
        throw createErr; // rethrow other errors
      }

      const updatedPost = await Post.findByIdAndUpdate(postId, { $inc: { likeCount: 1 } }, { new: true });
      return res.status(200).json({ liked: true, likeCount: updatedPost?.likeCount ?? 0 });
    }
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Server error in like controller' });
  }
};
