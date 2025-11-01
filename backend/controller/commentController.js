const Comment = require("../models/Comment");

const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const comment = await Comment.create({
      post: postId,
      user: req.user.id || req.user._id,  // Support both field names
      text: text.trim()
    });
    
    res.status(201).json(comment);

  } catch (error) {
    res.status(500).json({ message: "Error adding comment.", error });
  }
};

const getComments = async (req, res) => {
  try {
    const { postId } = req.params;
    const comments = await Comment.find({ post: postId })
      .populate("user", "username avatarUrl")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching comments.", error });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const comment = await Comment.findById(commentId);

    if (!comment) return res.status(404).json({ message: "Comment not found." });
    
    const userId = req.user.id || req.user._id;
    if (comment.user.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this comment." });
    }

    await comment.deleteOne();
    res.json({ message: "Comment deleted." });
  } catch (error) {
    res.status(500).json({ message: "Error deleting comment.", error });
  }
};

module.exports = { addComment, getComments, deleteComment };
