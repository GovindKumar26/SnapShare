// User.js - Mongoose model for user accounts
// This file defines the schema and model for users in the SnapShare app

// Import the Mongoose library for MongoDB object modeling
const mongoose = require('mongoose'); 

// Define the schema for a User document
// Each field below represents a property in the MongoDB collection
const UserSchema = new mongoose.Schema({
    // Unique username for the user (lowercased and trimmed)
    username : { type : String, required : true, unique : true, lowercase : true, trim : true},
    // Display name shown in the app
    displayName : {type : String, required : true},
    // Unique email address for the user
    email : {type : String, required : true, unique : true},
    // Hashed password for authentication
    hashPassword : {type : String, required : true},
    // Optional URL to user's avatar image
    avatarUrl  : {type : String},

    avatarPublicId : String,
    // Optional user bio
    bio : String,
    // Optional website URL
    website : String,
}, {timestamps : true}) // Automatically adds createdAt and updatedAt fields

// Pre-hook for cascade deletion when a user is deleted
// This runs automatically before findOneAndDelete, findByIdAndDelete, deleteOne, etc.
UserSchema.pre('findOneAndDelete', async function(next) {
    try {
        const userId = this.getQuery()._id;
        
        // Import models here to avoid circular dependencies
        const Post = require('./Post');
        const Like = require('./Likes');
        const Comment = require('./Comment');
        const Follow = require('./Follow');
        const cloudinary = require('../config/cloudinary');
        
        // Find the user to get avatar info
        const user = await mongoose.model('User').findById(userId);
        
        if (user) {
            // 1. Delete user's avatar from Cloudinary
            if (user.avatarPublicId) {
                try {
                    await cloudinary.uploader.destroy(user.avatarPublicId);
                } catch (err) {
                    console.error('Failed to delete user avatar from Cloudinary:', err);
                }
            }
            
            // 2. Find all user's posts to delete their images from Cloudinary
            const userPosts = await Post.find({ user: userId });
            for (const post of userPosts) {
                if (post.imagePublicId) {
                    try {
                        await cloudinary.uploader.destroy(post.imagePublicId);
                    } catch (err) {
                        console.error('Failed to delete post image from Cloudinary:', err);
                    }
                }
            }
            
            // 3. Delete all user's posts
            await Post.deleteMany({ user: userId });
            
            // 4. Delete all user's likes
            await Like.deleteMany({ user: userId });
            
            // 5. Delete all user's comments
            await Comment.deleteMany({ user: userId });
            
            // 6. Delete all follow relationships (as follower and as following)
            await Follow.deleteMany({ $or: [{ follower: userId }, { following: userId }] });
        }
        
        next();
    } catch (error) {
        console.error('Error in User pre-delete hook:', error);
        next(error);
    }
});

// Create the User model from the schema
// This model provides methods to interact with the 'users' collection
const User = mongoose.model('User', UserSchema);

module.exports = User;



