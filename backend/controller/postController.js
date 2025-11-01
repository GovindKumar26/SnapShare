const Post = require("../models/Post");
const cloudinary = require("../config/cloudinary"); // if you’re uploading images to Cloudinary
const Like = require('../models/Likes');

const createPost = async (req, res) => {
  try {
    const { title, caption } = req.body;

    // Check if file was uploaded via multer
    if (!req.file || !req.file.path) {
      return res.status(400).json({ message: "Image file is required" });
    }

    if (!title) {
      // Clean up uploaded file if validation fails
      if (req.file.filename) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      return res.status(400).json({ message: "Title is required" });
    }

    // req.file.path = Cloudinary URL, req.file.filename = public_id
    const newPost = new Post({
      user: req.user.id,
      title,
      caption: caption || "",
      imageUrl: req.file.path,
      imagePublicId: req.file.filename,
    });

    await newPost.save();

    res.status(201).json({
      message: "Post created successfully",
      post: newPost,
    });

  } catch (error) {
    console.error("Error creating post:", error);
    // Clean up uploaded image if post creation failed
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename);
      } catch (cleanupErr) {
        console.error("Failed to cleanup image after error:", cleanupErr);
      }
    }
    res.status(500).json({ message: "Error creating post" });
  }
};


const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("user", "username avatarUrl") // fetch user info
      .sort({ createdAt: -1 }); // newest first

    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};


const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const posts = await Post.find({ user: id }).sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    console.error("Error fetching user posts:", error);
    res.status(500).json({ message: "Error fetching user posts" });
  }
};


const deletePost = async (req, res) => {
  try {
    const { id } = req.params; // post id
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Ensure the logged-in user owns this post
    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to delete this post" });
    }

    // Delete image from Cloudinary
    if (post.imagePublicId) {
      try {
        await cloudinary.uploader.destroy(post.imagePublicId);
      } catch (cloudinaryErr) {
        console.error("Failed to delete image from Cloudinary:", cloudinaryErr);
        // Continue with post deletion even if Cloudinary cleanup fails
      }
    }

    // Delete all likes linked to this post
    await Like.deleteMany({ post: id });
    
    await post.deleteOne();

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ message: "Error deleting post" });
  }
};


module.exports = {
  createPost,
  getAllPosts,
  getUserPosts,
  deletePost,
};
