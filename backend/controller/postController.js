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
    const userId = req.user?.id || req.user?._id;
    
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
          { title: { $regex: search, $options: 'i' } },
          { caption: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get total count for pagination
    const total = await Post.countDocuments(query);
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    // Fetch posts with pagination
    const posts = await Post.find(query)
      .populate("user", "username avatarUrl") // fetch user info
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    // Get all post IDs to check which ones the current user has liked
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({ user: userId, post: { $in: postIds } }).select('post');
    const likedPostIds = new Set(userLikes.map(like => like.post.toString()));

    // Add likedByMe field to each post
    const postsWithLikeStatus = posts.map(post => ({
      _id: post._id,
      title: post.title,
      caption: post.caption,
      imageUrl: post.imageUrl,
      imagePublicId: post.imagePublicId,
      user: post.user,
      likeCount: post.likeCount,
      likedByMe: likedPostIds.has(post._id.toString()),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.status(200).json({
      posts: postsWithLikeStatus,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: total,
        postsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Error fetching posts" });
  }
};


const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params; // user id
    const userId = req.user?.id || req.user?._id;

    // Pagination parameters with validation
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 10;

    // Ensure positive values and cap limit
    if (page < 1) page = 1;
    if (limit < 1) limit = 10;
    if (limit > 100) limit = 100; // Cap at 100 to prevent abuse

    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await Post.countDocuments({ user: id });
    const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;

    // Fetch posts with pagination
    const posts = await Post.find({ user: id })
      .populate("user", "username avatarUrl")  // Populate user info
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get all post IDs to check which ones the current user has liked
    const postIds = posts.map(post => post._id);
    const userLikes = await Like.find({ user: userId, post: { $in: postIds } }).select('post');
    const likedPostIds = new Set(userLikes.map(like => like.post.toString()));

    // Add likedByMe field to each post
    const postsWithLikeStatus = posts.map(post => ({
      _id: post._id,
      title: post.title,
      caption: post.caption,
      imageUrl: post.imageUrl,
      imagePublicId: post.imagePublicId,
      user: post.user,
      likeCount: post.likeCount,
      likedByMe: likedPostIds.has(post._id.toString()),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.status(200).json({
      posts: postsWithLikeStatus,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalPosts: total,
        postsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
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

    // Delete post - pre-hook will handle Cloudinary cleanup, likes, and comments
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
