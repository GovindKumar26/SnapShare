const mongoose = require('mongoose');

const FollowSchema = new mongoose.Schema({
  follower: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  following: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
}, { timestamps: true });

// Prevent duplicate follows (a user following the same person twice)
FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const Follow = mongoose.model('Follow', FollowSchema);

module.exports = Follow; 

