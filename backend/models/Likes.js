const mongoose = require('mongoose');

const LikeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: true,
  },
}, { timestamps: true });

// Prevent same user from liking the same post twice
LikeSchema.index({ user: 1, post: 1 }, { unique: true });

/**
 * Indexes in Mongoose/MongoDB:
 * - An index is a special data structure that improves the speed of queries on a database collection.
 * - In this schema, we create a compound index on the 'user' and 'post' fields.
 *
 * Uniqueness:
 * - The option { unique: true } ensures that each combination of 'user' and 'post' is unique in the collection.
 * - This means a user cannot like the same post more than once.
 * - If you try to insert a duplicate (same user and post), MongoDB will throw an error.
 *
 * Practical effect:
 * - Guarantees that each like is unique per user-post pair.
 * - Helps prevent duplicate likes and improves query performance for these fields.
 */

module.exports = mongoose.model('Like', LikeSchema);
