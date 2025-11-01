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
}, {timestamps : true}) // Automatically adds createdAt and updatedAt fields

// Create the User model from the schema
// This model provides methods to interact with the 'users' collection
const User = mongoose.model('User', UserSchema);

module.exports = User;



