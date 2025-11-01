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

// Export the Post model for use in other parts of the application
module.exports = mongoose.model('Post', Post);