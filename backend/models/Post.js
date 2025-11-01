// Post.js - Mongoose model for posts in SnapShare
// This file defines the schema for posts shared by users

// Import the Mongoose library for MongoDB object modeling
const mongoose = require('mongoose');

// Define the schema for a Post document
// Each field below represents a property in the MongoDB collection
const Post = new mongoose.Schema({
    // Reference to the user who created the post
    user: {
        type: mongoose.Schema.Types.ObjectId, // Stores the user's unique ID
        ref: 'User', // References the User model
        required: true,
    },

    // Title of the post
    title: { type: String, required: true },
    // Optional caption for the post
    caption: { type: String },

    // URL to the image associated with the post
    imageUrl: { type: String, required: true },

    imagePublicId: { type: String },
    likeCount: {
        type: Number,
        default: 0,
    },


}, { timestamps: true }) // Automatically adds createdAt and updatedAt fields

// Pre-hook for cascade deletion when a post is deleted
// This runs automatically before deleteOne is called on a document
Post.pre('deleteOne', { document: true, query: false }, async function(next) {
    try {
        const postId = this._id;
        
        // Import models to avoid circular dependencies
        const Like = require('./Likes');
        const Comment = require('./Comment');
        const cloudinary = require('../config/cloudinary');
        
        // 1. Delete post image from Cloudinary
        if (this.imagePublicId) {
            try {
                await cloudinary.uploader.destroy(this.imagePublicId);
            } catch (err) {
                console.error('Failed to delete post image from Cloudinary:', err);
            }
        }
        
        // 2. Delete all likes for this post
        await Like.deleteMany({ post: postId });
        
        // 3. Delete all comments for this post
        await Comment.deleteMany({ post: postId });
        
        next();
    } catch (error) {
        console.error('Error in Post pre-delete hook:', error);
        next(error);
    }
});

// Export the Post model for use in other parts of the application
module.exports = mongoose.model('Post', Post);